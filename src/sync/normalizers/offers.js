"use strict";

const { collapseWhitespace, slugify } = require("../../text");
const { extractJsonLd, extractSections, htmlToText } = require("../html");

const PRICE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros?\b)/i;

/** What an offer is called. A price on a line that names no offer is not an offer. */
const OFFER_WORDS = /(abonnement|offre|pass\b|carte|formule|tarif|s[ée]ance|cours|ann[ée]e|mois|semaines|illimit|engagement|inscription|adh[ée]sion|licence)/i;
/** Funnel and navigation copy that happens to carry a price. */
const NOISE_WORDS = /(clique|cliquez|indique|renseigne|pr[ée]nom|t[ée]l[ée]phone|ami\b|proche|place[s]?\b|questions? fr[ée]quentes|accueil|panier|connexion|newsletter|cookie|voir\b|^\d{2}\s|[?]$)/i;
const PRICE_GLOBAL = new RegExp(PRICE.source, "gi");

// Order matters: the specific periods are tested before the generic monthly one.
const PERIOD_PATTERNS = [
  { id: "par_4_semaines", pattern: /\b(?:par|\/|les|toutes les|tous les)\s*4\s*semaines\b|\b4\s*semaines\b/i, label: "par 4 semaines" },
  { id: "annuel", pattern: /\bl['’]ann[ée]e\b|\bpar an\b|\bannuel(?:le)?\b|\b(?:12|douze)\s*mois\b|^\s*ann[ée]e\b/i, label: "à l’année" },
  { id: "trimestre", pattern: /\b(?:3|trois)\s*mois\b|\btrimestre\b|\btrimestriel(?:le)?\b/i, label: "3 mois" },
  { id: "seance", pattern: /\b(?:la\s*)?s[ée]ance\b|\bcours\s*(?:à l['’]unité|unique)\b/i, label: "à la séance" },
  { id: "mensuel", pattern: /\b(?:par|\/)\s*mois\b|\bmensuel(?:le)?\b/i, label: "par mois" },
];

const COMMITMENT_PATTERNS = [
  { id: "sans_engagement", pattern: /\bsans engagement\b/i, label: "sans engagement" },
  { id: "engagement_12_mois", pattern: /\bengagement\s*(?:de\s*)?(?:12|douze)\s*mois\b/i, label: "engagement 12 mois" },
  { id: "paiement_fractionne", pattern: /\b\d\s*(?:x|×|fois)\s*sans frais\b/i, label: "paiement fractionné sans frais" },
];

function detectMarker(text, patterns) {
  const match = patterns.find((entry) => entry.pattern.test(text));
  return match ? { id: match.id, label: match.label } : null;
}

function parseAmount(raw) {
  const value = Number(String(raw).replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function offerFromJsonLd(entry) {
  const types = [entry["@type"]].flat().filter(Boolean).map((type) => String(type).toLowerCase());
  if (!types.some((type) => /product|offer|service|subscription/.test(type))) return null;
  const offer = [entry.offers].flat().filter(Boolean)[0] || entry;
  const amount = parseAmount(offer.price ?? offer.lowPrice ?? "");
  const name = collapseWhitespace(String(entry.name || offer.name || ""));
  if (!name || amount === null) return null;
  const description = collapseWhitespace(String(entry.description || ""));
  return {
    id: slugify(name).slice(0, 60),
    name,
    price: amount,
    currency: String(offer.priceCurrency || "EUR").toUpperCase(),
    priceText: `${String(offer.price ?? amount).replace(".", ",")} ${offer.priceCurrency === "EUR" || !offer.priceCurrency ? "€" : offer.priceCurrency}`,
    period: detectMarker(`${name} ${description}`, PERIOD_PATTERNS),
    commitment: detectMarker(`${name} ${description}`, COMMITMENT_PATTERNS),
    url: offer.url ? String(offer.url) : null,
    availability: offer.availability ? String(offer.availability).replace(/^https?:\/\/schema\.org\//, "") : null,
    evidence: `JSON-LD ${name}`,
    source: "json-ld",
  };
}

/** Trailing scraps left once the price is removed: "3 mois illimités : au lieu de" → "3 mois illimités". */
function cleanOfferName(value) {
  return collapseWhitespace(String(value || "")
    // A price removed from the middle of a sentence leaves its connector dangling.
    .replace(/\s*\b(?:au lieu de|au lieu|à partir de|a partir de|dès|des|seulement|soit)\b\s*(?=[—–\-:,./]|$)/gi, " ")
    .replace(/\s*[:/]\s*(?=[—–\-:,./]|$)/g, " ")
    .replace(/\s*([—–\-:])\s*\1+/g, " $1 ")
    .replace(/^[\s:;,.\-–—·•*|/]+/, "")
    .replace(/[\s:;,.\-–—·•*|/]+$/, "")).slice(0, 80);
}

/** Lines of the page paired with the heading they sit under. */
function linesWithHeadings(plainText, sections) {
  const lines = String(plainText || "").split("\n").map(collapseWhitespace).filter(Boolean);
  if (!sections.length) return lines.map((line) => ({ line, heading: null }));
  const headingByLine = new Map();
  for (const section of sections) {
    for (const sectionLine of section.text.split("\n").map(collapseWhitespace)) {
      if (sectionLine && !headingByLine.has(sectionLine)) headingByLine.set(sectionLine, section.heading);
    }
  }
  return lines.map((line) => ({ line, heading: headingByLine.get(line) || null }));
}

/**
 * A price alone is never an offer: it needs a name, taken from the heading that owns it
 * when that heading covers a single priced line, otherwise from the line itself.
 * Period and commitment are read from the line only — reading the neighbouring line
 * is how "3 mois" ends up stamped on the annual price.
 */
function offersFromText(plainText, sections) {
  const entries = linesWithHeadings(plainText, sections).filter(({ line }) => PRICE.test(line));
  const headingUse = new Map();
  for (const { heading } of entries) {
    if (heading) headingUse.set(heading, (headingUse.get(heading) || 0) + 1);
  }
  const offers = [];
  for (const { line, heading } of entries) {
    const amounts = [...line.matchAll(PRICE_GLOBAL)]
      .map((match) => ({ amount: parseAmount(match[1]), text: collapseWhitespace(match[0]) }))
      .filter((entry) => entry.amount !== null);
    if (!amounts.length) continue;
    const fromLine = cleanOfferName(line.replace(PRICE_GLOBAL, " "));
    const useHeading = heading && headingUse.get(heading) === 1 && cleanOfferName(heading).length >= 4;
    const name = useHeading ? cleanOfferName(heading) : fromLine;
    if (!name || !/[a-zà-ÿ]{3}/i.test(name)) continue;
    // The name has to say what is being sold, and not be the funnel copy around it.
    if (!useHeading && (!OFFER_WORDS.test(name) || NOISE_WORDS.test(name) || name.split(/\s+/).length < 2)) continue;
    const cheapest = [...amounts].sort((left, right) => left.amount - right.amount)[0];
    const highest = [...amounts].sort((left, right) => right.amount - left.amount)[0];
    offers.push({
      id: slugify(name).slice(0, 60),
      name,
      price: cheapest.amount,
      currency: "EUR",
      priceText: cheapest.text,
      previousPrice: highest.amount !== cheapest.amount ? highest.amount : null,
      period: detectMarker(line, PERIOD_PATTERNS),
      commitment: detectMarker(line, COMMITMENT_PATTERNS),
      url: null,
      availability: null,
      evidence: line,
      source: "text",
      fromHeading: useHeading,
    });
  }
  return offers;
}

/** Same price, same period, same offer — whatever the marketing page calls it each time. */
function offerRank(offer) {
  return (offer.source === "json-ld" ? 100 : 0) + (offer.fromHeading ? 10 : 0) + (offer.commitment ? 5 : 0) + Math.min(offer.name.length / 20, 4);
}

function dedupeOffers(offers) {
  const byKey = new Map();
  for (const offer of offers) {
    const key = `${offer.price}|${offer.period?.id || ""}`;
    const previous = byKey.get(key);
    if (!previous || offerRank(offer) > offerRank(previous)) {
      byKey.set(key, previous ? { ...offer, commitment: offer.commitment || previous.commitment } : offer);
    }
  }
  return [...byKey.values()].sort((left, right) => left.price - right.price || left.name.localeCompare(right.name, "fr"));
}

function normalizeOffersDocument({ html = "", text = null, gymId = null, sourceId = null, sourceUrl = null } = {}) {
  const plainText = text || htmlToText(html);
  const sections = html ? extractSections(html) : [];
  const structured = extractJsonLd(html).map(offerFromJsonLd).filter(Boolean);
  // Structured data is the page speaking for itself: when it exists, the text is noise.
  const offers = dedupeOffers(structured.length ? structured : offersFromText(plainText, sections));
  return { gymId, sourceId, sourceUrl, offers, hasStructuredData: structured.length > 0 };
}

function offerFacts(offers, scope) {
  return offers.map((offer) => ({
    key: `offer_${scope || "club"}_${offer.id}_price`,
    value: `${offer.priceText}${offer.period ? ` ${offer.period.label}` : ""}`,
  }));
}

module.exports = {
  COMMITMENT_PATTERNS,
  NOISE_WORDS,
  OFFER_WORDS,
  PERIOD_PATTERNS,
  cleanOfferName,
  dedupeOffers,
  detectMarker,
  normalizeOffersDocument,
  offerFacts,
  offerFromJsonLd,
  offersFromText,
};
