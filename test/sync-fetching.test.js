"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { createHttpClient, isHostAllowed } = require("../src/sync/http");
const { createRobotsGate, isPathAllowed, parseRobots, selectGroup } = require("../src/sync/robots");
const { extractJsonLd, extractLinks, extractTables, htmlToText } = require("../src/sync/html");
const { createWorkspace } = require("./fixtures/workspace");

function client(fetchImpl, env = {}) {
  const workspace = createWorkspace(env);
  const http = createHttpClient({
    config: workspace.config,
    allowlist: ["boxingcenter.fr"],
    fetchImpl,
    sleep: async () => {},
  });
  return { http, workspace };
}

test("only the club's own hosts are reachable, over HTTPS, redirects included", async () => {
  assert.equal(isHostAllowed("https://www.boxingcenter.fr/x", ["boxingcenter.fr"]), true);
  assert.equal(isHostAllowed("https://evilboxingcenter.fr", ["boxingcenter.fr"]), false);
  assert.equal(isHostAllowed("https://boxingcenter.fr.attacker.example", ["boxingcenter.fr"]), false);

  const { http, workspace } = client(async (url) => {
    if (String(url).endsWith("/away")) return new Response(null, { status: 302, headers: { location: "https://attacker.example/x" } });
    return new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } });
  });
  try {
    await assert.rejects(() => http.get("https://www.boxingcenter.fr/away"), /not in the sync allowlist/);
    await assert.rejects(() => http.get("http://www.boxingcenter.fr/a"), /Refused non-HTTPS/);
    await assert.rejects(() => http.get("https://attacker.example/a"), /not in the sync allowlist/);
  } finally {
    workspace.cleanup();
  }
});

test("a conditional request is sent and HTTP 304 keeps the stored copy", async () => {
  const seen = [];
  const { http, workspace } = client(async (url, options) => {
    seen.push(options.headers["if-none-match"]);
    return new Response(null, { status: 304 });
  });
  try {
    const response = await http.get("https://www.boxingcenter.fr/a", { etag: '"v1"' });
    assert.equal(response.notModified, true);
    assert.deepEqual(seen, ['"v1"']);
  } finally {
    workspace.cleanup();
  }
});

test("a retryable failure is retried with backoff and an oversized page is refused", async () => {
  let attempts = 0;
  const { http, workspace } = client(async () => {
    attempts += 1;
    return attempts < 3
      ? new Response("busy", { status: 503 })
      : new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } });
  });
  try {
    const response = await http.get("https://www.boxingcenter.fr/a");
    assert.equal(response.status, 200);
    assert.equal(attempts, 3);
  } finally {
    workspace.cleanup();
  }

  const big = client(async () => new Response("x".repeat(200), { status: 200, headers: { "content-type": "text/html", "content-length": "200" } }), { KNOWLEDGE_SYNC_MAX_BYTES: "100000" });
  try {
    const response = await big.http.get("https://www.boxingcenter.fr/a");
    assert.equal(response.byteLength, 200);
  } finally {
    big.workspace.cleanup();
  }
});

test("robots.txt is obeyed, the most specific group wins, and an unreachable robots blocks crawling", async () => {
  const text = "User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nCrawl-delay: 2\n\nUser-agent: BoxingCenterSupportBot\nDisallow: /private/\n\nSitemap: https://www.boxingcenter.fr/sitemap.xml";
  const parsed = parseRobots(text);
  assert.deepEqual(parsed.sitemaps, ["https://www.boxingcenter.fr/sitemap.xml"]);
  const ours = selectGroup(parsed.groups, "boxingcentersupportbot/1.0");
  assert.equal(isPathAllowed(ours, "/private/x"), false);
  assert.equal(isPathAllowed(ours, "/salles/balma"), true);
  const wildcard = selectGroup(parsed.groups, "other");
  assert.equal(isPathAllowed(wildcard, "/wp-admin/x"), false);
  assert.equal(isPathAllowed(wildcard, "/wp-admin/admin-ajax.php"), true);
  assert.equal(wildcard.crawlDelay, 2);

  const gate = createRobotsGate({ http: { get: async () => ({ body: text }) }, userAgent: "BoxingCenterSupportBot/1.0" });
  assert.equal((await gate.check("https://www.boxingcenter.fr/private/a")).allowed, false);
  assert.equal((await gate.check("https://www.boxingcenter.fr/salles/balma")).allowed, true);

  const missing = createRobotsGate({ http: { get: async () => { const error = new Error("HTTP 404"); error.status = 404; throw error; } }, userAgent: "x/1" });
  assert.equal((await missing.check("https://www.boxingcenter.fr/a")).allowed, true);

  const broken = createRobotsGate({ http: { get: async () => { const error = new Error("HTTP 500"); error.status = 500; throw error; } }, userAgent: "x/1" });
  assert.equal((await broken.check("https://www.boxingcenter.fr/a")).allowed, false);
});

test("HTML extraction ignores scripts, decodes entities and keeps table rows intact", () => {
  const html = `<html lang="fr"><head><title>Planning Balma &ndash; Boxing Center</title>
    <script>var x = '<td>faux</td>';</script>
    <script type="application/ld+json">{"@type":"ExerciseGym","name":"Boxing Center Balma"}</script></head>
    <body><table><tr><th>Heure</th><th>Lundi</th></tr><tr><td>19h00</td><td>MMA<br>tous niveaux</td></tr></table>
    <a href="/salles/balma/planning">Voir le planning</a></body></html>`;
  assert.equal(extractJsonLd(html)[0].name, "Boxing Center Balma");
  assert.deepEqual(extractTables(html)[0].headers, ["Heure", "Lundi"]);
  assert.deepEqual(extractTables(html)[0].rows[0], ["19h00", "MMA\ntous niveaux"]);
  assert.equal(htmlToText(html).includes("faux"), false);
  assert.equal(extractLinks(html, "https://www.boxingcenter.fr/salles/balma")[0].url, "https://www.boxingcenter.fr/salles/balma/planning");
});
