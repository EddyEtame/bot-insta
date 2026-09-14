"use strict";

const ROBOTS = "User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://www.boxingcenter.fr/sitemap.xml\n";

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.boxingcenter.fr/salles/ramonville</loc></url>
  <url><loc>https://www.boxingcenter.fr/salles/minimes/planning</loc></url>
  <url><loc>https://www.boxingcenter.fr/horaires-minimes</loc></url>
</urlset>`;

const RAMONVILLE_PROFILE = `<html lang="fr"><head><title>Boxing Center Ramonville</title>
<meta name="description" content="La salle Boxing Center de Ramonville">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"ExerciseGym","name":"Boxing Center Ramonville","telephone":"05 61 11 22 33","address":{"@type":"PostalAddress","streetAddress":"3 rue de la Fixture","postalCode":"31520","addressLocality":"Ramonville-Saint-Agne"}}</script>
</head><body><h1>Boxing Center Ramonville</h1>
<p>Du lundi au vendredi : 10h - 21h15</p><p>Samedi : 10h - 18h</p>
<p>Disciplines : Boxe anglaise, MMA, Cross training.</p></body></html>`;

const RAMONVILLE_PLANNING = `<html><head><title>Planning Ramonville - Boxing Center</title></head><body>
<h1>Planning Boxing Center Ramonville saison 2026/2027</h1>
<table>
<tr><th>Heure</th><th>Lundi</th><th>Mardi</th></tr>
<tr><td>12h15 - 13h15</td><td>Boxing fitness</td><td>Cross training</td></tr>
<tr><td>18h30 - 20h00</td><td>Boxe anglaise (tous niveaux)</td><td>MMA</td></tr>
</table>
<h3>Samedi</h3><ul><li>10h - 11h30 Boxe éducative (7-12 ans)</li></ul>
<p>Planning aménagé fin juillet–mi-août.</p></body></html>`;

const RAMONVILLE_PLANNING_V2 = RAMONVILLE_PLANNING
  .replace("<tr><td>18h30 - 20h00</td><td>Boxe anglaise (tous niveaux)</td><td>MMA</td></tr>", "<tr><td>19h00 - 20h30</td><td>Boxe anglaise (tous niveaux)</td><td>MMA</td></tr>");

const OFFERS = `<html><head><title>Offres Boxing Center</title></head><body>
<h2>Abonnement découverte</h2><p>Abonnement dès 29,99 € par 4 semaines, sans engagement.</p>
<h2>Abonnement annuel</h2><p>Année : 259 € l'année</p></body></html>`;

const HOME = `<html><head><title>Boxing Center Toulouse</title></head><body><h1>Boxing Center</h1>
<p>6 salles à Toulouse. Boxe anglaise, Boxe thaï / K1, MMA, Grappling, Cross training.</p></body></html>`;

function defaultPages() {
  return {
    "https://www.boxingcenter.fr/robots.txt": { type: "text/plain", body: ROBOTS },
    "https://boutique.boxingcenter.fr/robots.txt": { type: "text/plain", body: "User-agent: *\nAllow: /\n" },
    "https://www.boxingcenter.fr/sitemap.xml": { type: "application/xml", body: SITEMAP },
    "https://www.boxingcenter.fr/": { type: "text/html", body: HOME },
    "https://www.boxingcenter.fr/salles/ramonville": { type: "text/html", body: RAMONVILLE_PROFILE },
    "https://www.boxingcenter.fr/salles/ramonville/planning": { type: "text/html", body: RAMONVILLE_PLANNING },
    "https://boutique.boxingcenter.fr/offre/29": { type: "text/html", body: OFFERS },
  };
}

/** Minimal Meta-free web: every unknown URL is a 404, like a real site. */
function createFakeFetch({ pages = defaultPages(), log = [] } = {}) {
  const fakeFetch = async (url) => {
    log.push(String(url));
    const page = pages[String(url)];
    if (!page) return new Response("not found", { status: 404, headers: { "content-type": "text/html" } });
    return new Response(page.body, {
      status: page.status || 200,
      headers: { "content-type": `${page.type}; charset=utf-8`, etag: `"${Buffer.byteLength(page.body)}"` },
    });
  };
  fakeFetch.pages = pages;
  fakeFetch.log = log;
  return fakeFetch;
}

module.exports = { RAMONVILLE_PLANNING, RAMONVILLE_PLANNING_V2, RAMONVILLE_PROFILE, HOME, OFFERS, ROBOTS, SITEMAP, createFakeFetch, defaultPages };
