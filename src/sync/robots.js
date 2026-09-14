"use strict";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function patternToRegExp(pattern) {
  let source = "";
  for (const character of pattern) {
    if (character === "*") source += ".*";
    else if (character === "$") source += "$";
    else source += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}`);
}

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let expectingAgent = false;
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (field === "user-agent") {
      if (!current || !expectingAgent) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      expectingAgent = true;
      continue;
    }
    if (!current) continue;
    expectingAgent = false;
    if (field === "disallow" || field === "allow") current.rules.push({ type: field, path: value });
    if (field === "crawl-delay") {
      const delay = Number(value.replace(",", "."));
      if (Number.isFinite(delay) && delay >= 0) current.crawlDelay = delay;
    }
  }
  return { groups, sitemaps };
}

/** Most specific matching group: an exact agent token wins over the "*" group. */
function selectGroup(groups, userAgentToken) {
  const token = String(userAgentToken || "").toLowerCase();
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== "*" && token.includes(agent)));
  if (specific.length) return specific.reduce((best, group) => (group.rules.length > best.rules.length ? group : best));
  const wildcard = groups.filter((group) => group.agents.includes("*"));
  return wildcard.length ? wildcard.reduce((best, group) => (group.rules.length > best.rules.length ? group : best)) : null;
}

/** Longest matching rule wins; Allow wins ties, as in the REP draft. */
function isPathAllowed(group, pathname) {
  if (!group) return true;
  let decision = { allowed: true, length: -1 };
  for (const rule of group.rules) {
    if (rule.path === "") {
      // "Disallow:" with an empty value means "nothing is disallowed"; "Allow:" empty is a no-op.
      if (decision.length < 0) decision = { allowed: true, length: 0 };
      continue;
    }
    if (!patternToRegExp(rule.path).test(pathname)) continue;
    const length = rule.path.replace(/\$$/, "").length;
    if (length > decision.length || (length === decision.length && rule.type === "allow")) {
      decision = { allowed: rule.type === "allow", length };
    }
  }
  return decision.allowed;
}

function createRobotsGate({ http, userAgent, clock = () => Date.now() }) {
  const cache = new Map();
  const token = String(userAgent || "").split("/")[0].toLowerCase();

  async function load(origin) {
    const cached = cache.get(origin);
    if (cached && clock() - cached.at < CACHE_TTL_MS) return cached.value;
    let value;
    try {
      const response = await http.get(`${origin}/robots.txt`, { headers: { accept: "text/plain,*/*;q=0.5" } });
      const parsed = parseRobots(response.body || "");
      value = { ...parsed, group: selectGroup(parsed.groups, token), reachable: true, reason: null };
    } catch (err) {
      const status = err?.status;
      const missing = Number.isInteger(status) && status >= 400 && status < 500;
      value = {
        groups: [],
        sitemaps: [],
        group: null,
        reachable: missing,
        // No robots.txt means crawling is permitted; an unreachable server does not.
        blockAll: !missing,
        reason: missing ? `robots.txt absent (HTTP ${status})` : `robots.txt unreachable: ${err.message}`,
      };
    }
    cache.set(origin, { at: clock(), value });
    return value;
  }

  return {
    async check(url) {
      const target = new URL(url);
      const robots = await load(target.origin);
      if (robots.blockAll) return { allowed: false, reason: robots.reason, crawlDelay: 0, sitemaps: [] };
      return {
        allowed: isPathAllowed(robots.group, `${target.pathname}${target.search}`),
        reason: robots.reason,
        crawlDelay: robots.group?.crawlDelay ?? 0,
        sitemaps: robots.sitemaps,
      };
    },
    async sitemapsFor(origin) {
      const robots = await load(origin);
      return robots.sitemaps || [];
    },
    cache,
  };
}

module.exports = { createRobotsGate, isPathAllowed, parseRobots, selectGroup };
