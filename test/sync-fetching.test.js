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

test("a page that does not present itself as the club's is never taken for it", () => {
  const { identifiesGym } = require("../src/sync/pipeline");
  const { htmlToText } = require("../src/sync/html");
  const { loadGymRegistry } = require("../src/gyms");
  const workspace = createWorkspace();
  try {
    const registry = loadGymRegistry(workspace.config);
    const portet = registry.get("portet");
    // The group's home page names every club; a site that redirects unknown paths to it
    // would otherwise hand the same practical sheet to all five.
    const home = `<html><head><title>Boxing Center Toulouse - Salle de Sport et Club de Boxe</title></head>
      <body><h1>Boxing Center</h1><p>Nos 5 clubs : Saint-Cyprien, États-Unis, Minimes, Ramonville, Portet-sur-Garonne</p></body></html>`;
    assert.equal(identifiesGym({ html: home, text: htmlToText(home), url: "https://boxingcenter.fr/", gym: portet }), false);
    assert.equal(identifiesGym({ html: home, text: htmlToText(home), url: "https://boxingcenter.fr/salles/portet", gym: portet }), true);
    assert.equal(identifiesGym({ html: home, text: htmlToText(home), url: "https://boxingcenter.fr/", gym: null }), true);

    const page = `<html><head><title>Boxing Center Portet-sur-Garonne</title></head><body><h1>Boxing Center Portet</h1>
      <p>Retrouvez aussi nos salles de Minimes et Ramonville.</p></body></html>`;
    assert.equal(identifiesGym({ html: page, text: htmlToText(page), url: "https://boxing-center-portet.fr/", gym: portet }), true);

    const other = `<html><head><title>Boxing Center Minimes</title></head><body><h1>Boxing Center Minimes</h1></body></html>`;
    assert.equal(identifiesGym({ html: other, text: htmlToText(other), url: "https://boxingcenter.fr/x", gym: portet }), false);
  } finally {
    workspace.cleanup();
  }
});

test("an address is published only when a street and a postal code sit together", () => {
  const { addressFromText } = require("../src/sync/normalizers/profile");
  // The sentence that shipped as an address on the first real poll.
  assert.equal(addressFromText("175 cours chaque semaine dans nos 5 clubs à Toulouse\n3200 adhérents 31000 Toulouse"), null);
  assert.equal(addressFromText("Code postal 31000 Toulouse"), null);
  assert.equal(addressFromText("61 route d’Espagne"), null);
  assert.equal(addressFromText("61 route d’Espagne\n31120 Portet-sur-Garonne").full, "61 route d’Espagne, 31120 Portet-sur-Garonne");
  assert.equal(addressFromText("Nous trouver : 1 avenue des États-Unis, 31200 Toulouse.").full, "1 avenue des États-Unis, 31200 Toulouse");
});

test("funnel copy carrying a price is not an offer", () => {
  const { normalizeOffersDocument } = require("../src/sync/normalizers/offers");
  const funnel = [
    "<h1>Abonnement boxe dès 29 € — Boxing Center Toulouse</h1>",
    "<p>Accueil · Offres</p>",
    "<p>Plus que 70 places à 29 €</p>",
    "<p>01 Clique sur « Je profite de l'offre à 29 € »</p>",
    "<p>02 Pour passer de 44,99 € à 29 €, indique les coordonnées d’un(e) proche</p>",
    "<p>Abonnement 29 € toutes les 4 semaines, sans engagement et sans préavis</p>",
    "<p>Tarif actuel : 44,99 €</p>",
    "<p>Questions fréquentes 29 €</p>",
  ].join("\n");
  const offers = normalizeOffersDocument({ html: funnel }).offers;
  assert.ok(offers.length <= 4, `a funnel page should not yield ${offers.length} offers`);
  assert.equal(offers.some((offer) => /clique|places|questions|indique|accueil/i.test(offer.name)), false);
  const monthly = offers.find((offer) => offer.period?.id === "par_4_semaines");
  assert.equal(monthly.price, 29);
  assert.equal(monthly.commitment.id, "sans_engagement");

  // Structured data speaks for the page: the surrounding text is then ignored.
  const structured = `${funnel}<script type="application/ld+json">{"@type":"Product","name":"Abonnement 4 semaines","offers":{"@type":"Offer","price":"29.00","priceCurrency":"EUR"}}</script>`;
  const fromJsonLd = normalizeOffersDocument({ html: structured }).offers;
  assert.deepEqual(fromJsonLd.map((offer) => offer.name), ["Abonnement 4 semaines"]);
});
