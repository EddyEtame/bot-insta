"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { normalizePlanning } = require("../planning");
const { containsPhrase } = require("../text");
const { buildOffersDocument, buildPlanningDocument, buildProfileDocument } = require("./documents");
const { hashContent } = require("./store");
const { extractMeta, extractSections, htmlToText } = require("./html");
const { isHostAllowed } = require("./http");
const { normalizeOffersDocument } = require("./normalizers/offers");
const { normalizePlanningDocument } = require("./normalizers/planning");
const { normalizeProfileDocument } = require("./normalizers/profile");

/**
 * Bumped whenever a normalizer changes what it extracts. Without it, a page that has not
 * changed keeps the document its old extractor produced — a fixed parser would never
 * reach the corpus until the club happened to edit the page.
 */
const EXTRACTOR_VERSION = 2;

const STATUS = Object.freeze({
  UPDATED: "updated",
  UNCHANGED: "unchanged",
  UNRESOLVED: "unresolved",
  BLOCKED: "blocked",
  FAILED: "failed",
  SKIPPED: "skipped",
  EMPTY: "empty",
});

/**
 * A page is a club's page only when it says so where a page declares what it is about:
 * its URL or its title/first heading. Mentioning the club somewhere in the body is not
 * enough — the group's home page names all five, and a site that redirects unknown paths
 * to that home page would otherwise hand the same sheet to every club.
 */
function identifiesGym({ html = "", text = "", url = "", gym }) {
  if (!containsPhrase(text, "boxing center")) return false;
  if (!gym) return true;
  const title = extractMeta(html).title || "";
  const heading = extractSections(html).find((section) => section.level <= 2)?.heading || "";
  const path = decodeURIComponent(String(url || "")).toLowerCase();
  const namedInUrl = gym.aliases.some((alias) => path.includes(alias.replace(/\s+/g, "-")) || path.includes(alias.replace(/\s+/g, "")));
  const namedInTitle = gym.aliases.some((alias) => containsPhrase(`${title} ${heading}`, alias));
  return namedInUrl || namedInTitle;
}

function urlSlugs(gym) {
  return gym ? gym.aliases.map((alias) => alias.replace(/\s+/g, "-")).filter((slug) => slug.length >= 4) : [];
}

/**
 * Ranks a discovered URL for one source. A gym source must carry that gym's name in the
 * URL and must not carry another gym's: "horaires-minimes" is not Ramonville's planning.
 */
function discoveryScore(url, { gym, docType, otherGyms = [] }) {
  const value = url.toLowerCase();
  if (otherGyms.some((other) => urlSlugs(other).some((slug) => value.includes(slug)))) return 0;
  const namesGym = urlSlugs(gym).some((slug) => value.includes(slug));
  if (gym && !namesGym) return 0;
  const planningWords = /planning|horaire|cours|creneau/.test(value);
  if (docType === "planning" && !planningWords) return 0;
  if (docType !== "planning" && planningWords) return 0;
  return 2 + (namesGym ? 2 : 0) + (planningWords ? 1 : 0);
}

function parseSitemap(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1]);
}

function diffPlanning(previous, next) {
  const before = new Map((previous?.sessions || []).map((session) => [`${session.day}|${session.start}|${session.discipline}`, session]));
  const after = new Map((next.sessions || []).map((session) => [`${session.day}|${session.start}|${session.discipline}`, session]));
  const added = [...after.keys()].filter((key) => !before.has(key));
  const removed = [...before.keys()].filter((key) => !after.has(key));
  const notesChanged = JSON.stringify(previous?.notes || []) !== JSON.stringify(next.notes || []);
  return { added, removed, notesChanged, changed: added.length > 0 || removed.length > 0 || notesChanged };
}

function diffOffers(previous, next) {
  const before = new Map((previous?.offers || []).map((offer) => [offer.id, offer]));
  const after = new Map((next.offers || []).map((offer) => [offer.id, offer]));
  const added = [...after.keys()].filter((key) => !before.has(key));
  const removed = [...before.keys()].filter((key) => !after.has(key));
  const repriced = [...after.entries()]
    .filter(([id, offer]) => before.has(id) && before.get(id).price !== offer.price)
    .map(([id, offer]) => ({ id, from: before.get(id).price, to: offer.price }));
  return { added, removed, repriced, changed: added.length > 0 || removed.length > 0 || repriced.length > 0 };
}

function diffProfile(previous, next) {
  const fields = ["phone", "email"];
  const changes = fields.filter((field) => (previous?.[field] || null) !== (next[field] || null));
  if ((previous?.address?.full || null) !== (next.address?.full || null)) changes.push("address");
  if (JSON.stringify(previous?.hours || []) !== JSON.stringify(next.hours || [])) changes.push("hours");
  return { fields: changes, changed: changes.length > 0 };
}

function createPipeline({ config, registry, http, robots, store, logger = { log() {}, error() {} } }) {
  const officialHosts = registry.hostAllowlist;

  async function probeCandidates(source, gym, state) {
    const attempts = [];
    for (const candidate of source.candidates) {
      if (!isHostAllowed(candidate, officialHosts)) {
        attempts.push({ url: candidate, outcome: "not-allowlisted" });
        continue;
      }
      const gate = await robots.check(candidate).catch(() => ({ allowed: false, reason: "robots check failed" }));
      if (!gate.allowed) {
        attempts.push({ url: candidate, outcome: `robots: ${gate.reason || "disallowed"}` });
        continue;
      }
      try {
        const response = await http.get(candidate, { timeoutMs: config.sync.probeTimeoutMs });
        const text = htmlToText(response.body || "");
        if (identifiesGym({ html: response.body || "", text, url: response.url, gym })) {
          state.candidateUrl = response.url;
          attempts.push({ url: candidate, outcome: "confirmed" });
          return { url: response.url, response, attempts };
        }
        attempts.push({ url: candidate, outcome: "page does not identify the gym" });
      } catch (err) {
        attempts.push({ url: candidate, outcome: err.message });
      }
    }
    return { url: null, response: null, attempts };
  }

  async function discoverFromSitemap(source, gym) {
    const origins = [...new Set(source.candidates.concat(officialHosts.map((host) => `https://${host}/`))
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean))];
    for (const origin of origins) {
      let sitemaps = [];
      try {
        sitemaps = await robots.sitemapsFor(origin);
      } catch {
        sitemaps = [];
      }
      const queue = sitemaps.length ? [...sitemaps] : [`${origin}/sitemap.xml`];
      const seen = new Set();
      const found = [];
      while (queue.length && seen.size < 5) {
        const sitemapUrl = queue.shift();
        if (seen.has(sitemapUrl) || !isHostAllowed(sitemapUrl, officialHosts)) continue;
        seen.add(sitemapUrl);
        try {
          const response = await http.get(sitemapUrl, { headers: { accept: "application/xml,text/xml,*/*;q=0.5" } });
          for (const location of parseSitemap(response.body)) {
            if (/\.xml(\.gz)?$/i.test(location)) queue.push(location);
            else found.push(location);
          }
        } catch {
          // A missing sitemap is normal; candidate probing already covered the common paths.
        }
      }
      const otherGyms = registry.gyms.filter((entry) => entry.id !== gym?.id);
      const ranked = found
        .filter((url) => isHostAllowed(url, officialHosts))
        .map((url) => ({ url, score: discoveryScore(url, { gym, docType: source.docType, otherGyms }) }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score || left.url.length - right.url.length);
      if (ranked.length) return ranked[0].url;
    }
    return null;
  }

  function readFileSource(source) {
    const root = config.sync.planningExportPath;
    if (!root || !source.file) return null;
    const target = path.resolve(root, source.file);
    if (!target.startsWith(path.resolve(root))) throw new Error(`File source escapes the export directory: ${source.file}`);
    if (!fs.existsSync(target)) return null;
    // The check date of a handed-over planning is the day a human last verified it —
    // never the day the poll ran, because a file cannot verify itself. The file says so
    // itself through `verifiedAt`; its modification time is only the fallback, and a
    // fresh clone would otherwise make every export look checked today.
    const body = fs.readFileSync(target, "utf8");
    let verifiedAt = null;
    try {
      const declared = JSON.parse(body)?.verifiedAt;
      if (declared && Number.isFinite(Date.parse(declared))) verifiedAt = new Date(declared).toISOString();
    } catch {
      verifiedAt = null;
    }
    return { body, url: `file://${target}`, checkedAt: verifiedAt || fs.statSync(target).mtime.toISOString() };
  }

  function normalizeBody({ source, gym, body, url }) {
    const isJson = body.trim().startsWith("{") || body.trim().startsWith("[");
    if (source.docType === "planning") {
      const raw = isJson ? JSON.parse(body) : normalizePlanningDocument({ html: body, gymId: gym?.id, sourceId: source.id, sourceUrl: url });
      return normalizePlanning({ ...raw, gymId: gym?.id || raw.gymId || null, sourceId: source.id, sourceUrl: url });
    }
    if (source.docType === "offer") {
      return isJson
        ? { gymId: gym?.id || null, sourceId: source.id, sourceUrl: url, offers: [JSON.parse(body)].flat().filter(Boolean) }
        : normalizeOffersDocument({ html: body, gymId: gym?.id, sourceId: source.id, sourceUrl: url });
    }
    return normalizeProfileDocument({
      html: body,
      gymId: gym?.id,
      sourceId: source.id,
      sourceUrl: url,
      knownDisciplines: registry.club.disciplines || [],
    });
  }

  /** Club-wide pages are documented under a pseudo-gym so one code path covers both. */
  function clubPseudoGym() {
    const club = registry.club || {};
    return {
      id: "club",
      name: club.name || "Boxing Center",
      displayName: club.name || "Boxing Center",
      commune: club.area || null,
      aliases: ["boxing center", "toutes les salles", "le club"],
    };
  }

  /** Club-wide pages are documented per source, so two of them never overwrite each other. */
  function documentIdFor(source, gym) {
    return gym ? `bc-${gym.id}-${source.docType}` : `bc-${source.id.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
  }

  function buildDocument({ source, gym, record, checkedAt, capturedAt, url }) {
    const isOfficial = url.startsWith("file://") || isHostAllowed(url, officialHosts);
    const shared = {
      gym: gym || clubPseudoGym(),
      sourceUrl: source.url && url.startsWith("file://") ? source.url : (url.startsWith("file://") ? null : url),
      checkedAt,
      capturedAt,
      documentId: documentIdFor(source, gym),
      effectiveFrom: source.effectiveFrom,
      effectiveUntil: source.effectiveUntil,
      maxAgeDays: source.maxAgeDays ?? config.freshness[source.docType] ?? 30,
      // Only the club's own domains, and plannings handed over by the club, publish
      // straight into the answering corpus.
      verificationStatus: isOfficial ? "verified_public" : "pending_review",
    };
    if (source.docType === "planning") return buildPlanningDocument({ ...shared, planning: record });
    if (source.docType === "offer") return buildOffersDocument({ ...shared, gym, offers: record.offers });
    return buildProfileDocument({ ...shared, profile: record });
  }

  function diffFor(docType, previous, next) {
    if (docType === "planning") return diffPlanning(previous, next);
    if (docType === "offer") return diffOffers(previous, next);
    return diffProfile(previous, next);
  }

  async function syncSource(source, { state, now, dryRun, force = false }) {
    const gym = source.gymId ? registry.get(source.gymId) : null;
    const scope = gym?.id || `club/${source.id}`;
    const sourceState = state.sources[source.id] || {};
    const result = { sourceId: source.id, gymId: source.gymId, docType: source.docType, status: STATUS.SKIPPED, url: null, changes: null, error: null };
    const checkedAt = now.toISOString();

    let body = null;
    let url = sourceState.resolvedUrl || source.url || null;
    let headers = {};
    let fileCheckedAt = null;
    // An extractor that has moved on must read the page again, whatever the cache says.
    const extractorMoved = sourceState.extractorVersion !== EXTRACTOR_VERSION;

    if (source.kind === "file") {
      const file = readFileSource(source);
      if (!file) {
        result.status = STATUS.UNRESOLVED;
        result.error = source.file ? `export file not found: ${source.file}` : "no export file configured";
        return { result, sourceState };
      }
      body = file.body;
      url = file.url;
      fileCheckedAt = file.checkedAt;
    } else {
      const cooldownActive = sourceState.probeCooldownUntil && Date.parse(sourceState.probeCooldownUntil) > now.getTime();
      if (!url && cooldownActive && !force) {
        result.status = STATUS.UNRESOLVED;
        result.error = `no URL confirmed; next probe after ${sourceState.probeCooldownUntil}`;
        sourceState.lastCheckedAt = checkedAt;
        sourceState.lastStatus = STATUS.UNRESOLVED;
        return { result, sourceState };
      }
      if (!url) {
        const probed = await probeCandidates(source, gym, sourceState);
        sourceState.probes = probed.attempts;
        if (probed.url) {
          url = probed.url;
          body = probed.response.body;
          headers = probed.response.headers;
        } else {
          url = await discoverFromSitemap(source, gym);
        }
        if (!url) {
          sourceState.probeCooldownUntil = new Date(now.getTime() + config.sync.probeCooldownDays * 24 * 60 * 60 * 1000).toISOString();
          result.status = STATUS.UNRESOLVED;
          result.error = "no URL confirmed for this source — set it in knowledge/registry/gyms.json";
          sourceState.lastCheckedAt = checkedAt;
          sourceState.lastStatus = STATUS.UNRESOLVED;
          return { result, sourceState };
        }
      }
      result.url = url;
      const gate = await robots.check(url).catch((err) => ({ allowed: false, reason: err.message }));
      if (!gate.allowed) {
        result.status = STATUS.BLOCKED;
        result.error = `robots.txt disallows ${url}${gate.reason ? ` (${gate.reason})` : ""}`;
        sourceState.lastCheckedAt = checkedAt;
        sourceState.lastStatus = STATUS.BLOCKED;
        return { result, sourceState };
      }
      if (body === null) {
        try {
          const response = await http.get(url, extractorMoved ? {} : { etag: sourceState.etag, lastModified: sourceState.lastModified });
          if (response.notModified) {
            sourceState.lastCheckedAt = checkedAt;
            sourceState.lastStatus = STATUS.UNCHANGED;
            sourceState.failures = 0;
            result.status = STATUS.UNCHANGED;
            return { result, sourceState };
          }
          body = response.body;
          headers = response.headers;
          url = response.url;
        } catch (err) {
          sourceState.lastCheckedAt = checkedAt;
          sourceState.lastStatus = STATUS.FAILED;
          sourceState.failures = (sourceState.failures || 0) + 1;
          sourceState.lastError = err.message;
          // A URL that fails is not a confirmed URL: drop it so the next run resolves again,
          // and stop re-resolving to the same wrong page every week once it keeps failing.
          if (!source.url) {
            sourceState.resolvedUrl = null;
            if (sourceState.failures >= 2) {
              sourceState.probeCooldownUntil = new Date(now.getTime() + config.sync.probeCooldownDays * 24 * 60 * 60 * 1000).toISOString();
            }
          }
          result.status = STATUS.FAILED;
          result.error = err.message;
          return { result, sourceState };
        }
      }
    }

    result.url = url;
    const contentHash = hashContent(body);
    if (contentHash === sourceState.contentHash && !extractorMoved) {
      sourceState.lastCheckedAt = checkedAt;
      sourceState.lastStatus = STATUS.UNCHANGED;
      sourceState.failures = 0;
      result.status = STATUS.UNCHANGED;
      return { result, sourceState };
    }

    let record;
    try {
      record = normalizeBody({ source, gym, body, url });
    } catch (err) {
      sourceState.lastCheckedAt = checkedAt;
      sourceState.lastStatus = STATUS.FAILED;
      sourceState.lastError = `normalization failed: ${err.message}`;
      result.status = STATUS.FAILED;
      result.error = sourceState.lastError;
      return { result, sourceState };
    }

    const verifiedAt = fileCheckedAt || checkedAt;
    const previous = store.readNormalized(scope, source.docType);
    const document = buildDocument({ source, gym, record, checkedAt: verifiedAt, capturedAt: verifiedAt, url });
    if (!document) {
      sourceState.lastCheckedAt = checkedAt;
      sourceState.lastStatus = STATUS.EMPTY;
      result.status = STATUS.EMPTY;
      result.error = "page fetched but no publishable fact could be extracted";
      return { result, sourceState };
    }

    const changes = diffFor(source.docType, previous, record);
    result.changes = changes;
    result.status = STATUS.UPDATED;

    if (!dryRun) {
      store.snapshot(source.id, body, { at: now });
      store.writeNormalized(scope, source.docType, {
        ...record,
        sourceId: source.id,
        sourceUrl: url,
        checkedAt: verifiedAt,
        polledAt: checkedAt,
        contentHash,
      });
      store.writeSourceDocument(document);
    }

    sourceState.etag = headers.etag || null;
    sourceState.lastModified = headers.lastModified || null;
    sourceState.contentHash = contentHash;
    sourceState.extractorVersion = EXTRACTOR_VERSION;
    sourceState.lastCheckedAt = checkedAt;
    sourceState.lastChangedAt = changes.changed || !previous ? checkedAt : sourceState.lastChangedAt || checkedAt;
    sourceState.lastStatus = STATUS.UPDATED;
    sourceState.resolvedUrl = url.startsWith("file://") ? null : url;
    sourceState.resolvedAt = checkedAt;
    sourceState.probeCooldownUntil = null;
    sourceState.documentId = document.metadata.id;
    sourceState.failures = 0;
    sourceState.lastError = null;
    return { result, sourceState, document, changes };
  }

  async function run({ now = new Date(), dryRun = false, only = [], force = false } = {}) {
    const state = store.loadState();
    const sources = registry.allSources().filter((source) => !only.length || only.includes(source.id) || only.includes(source.gymId));
    const report = {
      startedAt: now.toISOString(),
      finishedAt: null,
      dryRun,
      registryErrors: registry.errors,
      sources: [],
      changes: [],
      stats: { total: sources.length, updated: 0, unchanged: 0, failed: 0, blocked: 0, unresolved: 0, empty: 0, skipped: 0 },
    };

    for (const source of sources) {
      let outcome;
      try {
        outcome = await syncSource(source, { state, now, dryRun, force });
      } catch (err) {
        logger.error("sync.source_crashed", err, { sourceId: source.id });
        outcome = { result: { sourceId: source.id, gymId: source.gymId, docType: source.docType, status: STATUS.FAILED, url: null, changes: null, error: err.message }, sourceState: state.sources[source.id] || {} };
      }
      state.sources[source.id] = outcome.sourceState;
      report.sources.push(outcome.result);
      report.stats[outcome.result.status] = (report.stats[outcome.result.status] || 0) + 1;
      if (outcome.result.status === STATUS.UPDATED && outcome.changes?.changed) {
        report.changes.push({
          at: now.toISOString(),
          sourceId: source.id,
          gymId: source.gymId,
          docType: source.docType,
          url: outcome.result.url,
          detail: outcome.changes,
        });
      }
      logger.log("sync.source", {
        sourceId: source.id,
        status: outcome.result.status,
        changed: Boolean(outcome.changes?.changed),
        error: outcome.result.error || undefined,
      });
    }

    report.finishedAt = new Date().toISOString();
    report.ok = report.stats.failed === 0 && report.stats.blocked === 0;
    if (!dryRun) {
      store.saveState(state);
      store.appendChangelog(report.changes);
      store.writeReport(report);
    }
    return report;
  }

  return { run, syncSource, probeCandidates, discoverFromSitemap, STATUS };
}

module.exports = { EXTRACTOR_VERSION, STATUS, createPipeline, diffOffers, diffPlanning, diffProfile, discoveryScore, identifiesGym, parseSitemap };
