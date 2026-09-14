"use strict";

const { DAYS, parseTime, parseTimeRange } = require("../../calendar");
const { collapseWhitespace, flatten } = require("../../text");
const { extractJsonLd, extractMeta, htmlToText } = require("../html");
const { dayFromText } = require("./planning");

const STREET_WORDS = "rue|avenue|av\\.|bd|boulevard|chemin|route|impasse|all[ée]e|place|quai|cours|voie";
const ARTICLES = "(?:(?:de|du|des|d['’]?|la|le|les)\\s*){0,2}";
/**
 * A street name starts with a proper noun. Without that, "175 cours chaque semaine dans
 * nos 5 clubs" reads as an address — and a wrong address is the one fact a customer
 * travels on.
 */
const STREET_LINE = new RegExp(`\\b(\\d{1,4}(?:\\s?(?:bis|ter|quater))?)[,\\s]+((?:${STREET_WORDS})\\s+${ARTICLES}[A-ZÀ-Ÿ][\\wÀ-ÿ'’-]*(?:\\s+[A-Za-zÀ-ÿ'’-]+){0,4})`, "u");
const POSTAL_LINE = /\b(\d{5})[,\s]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\- ]{2,40})/;
const PHONE = /(?:\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const SCHEMA_DAY = {
  monday: "lundi", tuesday: "mardi", wednesday: "mercredi", thursday: "jeudi",
  friday: "vendredi", saturday: "samedi", sunday: "dimanche",
};

function jsonLdPlaces(html) {
  return extractJsonLd(html).filter((entry) => {
    const types = [entry["@type"]].flat().filter(Boolean).map((type) => String(type).toLowerCase());
    return types.some((type) => /gym|localbusiness|sportsactivitylocation|organization|place|healthclub/.test(type));
  });
}

function addressFromJsonLd(entry) {
  const address = entry?.address;
  if (!address) return null;
  if (typeof address === "string") return { full: collapseWhitespace(address), street: null, postalCode: null, city: null, source: "json-ld" };
  const street = address.streetAddress ? collapseWhitespace(String(address.streetAddress)) : null;
  const postalCode = address.postalCode ? collapseWhitespace(String(address.postalCode)) : null;
  const city = address.addressLocality ? collapseWhitespace(String(address.addressLocality)) : null;
  if (!street && !postalCode && !city) return null;
  return { street, postalCode, city, full: [street, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", "), source: "json-ld" };
}

function hoursFromJsonLd(entry) {
  const specifications = [entry?.openingHoursSpecification].flat().filter(Boolean);
  const hours = [];
  for (const specification of specifications) {
    const days = [specification.dayOfWeek].flat().filter(Boolean).map((day) => String(day).replace(/^https?:\/\/schema\.org\//, "").toLowerCase());
    const open = parseTime(String(specification.opens || "").replace(/^(\d{2}):(\d{2}).*$/, "$1:$2"));
    const close = parseTime(String(specification.closes || "").replace(/^(\d{2}):(\d{2}).*$/, "$1:$2"));
    for (const day of days) {
      const id = SCHEMA_DAY[day] || dayFromText(day);
      if (id && open) hours.push({ day: id, open, close, source: "json-ld" });
    }
  }
  for (const line of [entry?.openingHours].flat().filter(Boolean)) {
    const text = String(line);
    const range = parseTimeRange(text);
    const day = dayFromText(text);
    if (day && range?.start) hours.push({ day, open: range.start, close: range.end, source: "json-ld" });
  }
  return hours;
}

function hoursFromText(text) {
  const hours = [];
  for (const rawLine of String(text || "").split("\n")) {
    const line = collapseWhitespace(rawLine);
    if (!line || line.length > 120) continue;
    const flat = flatten(line);
    const range = parseTimeRange(line);
    if (!range?.start || !range.end) continue;
    const spanMatch = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*(?:au|a|-|–)\s*(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/.exec(flat);
    if (spanMatch) {
      const from = DAYS.findIndex((day) => day.id === spanMatch[1]);
      const to = DAYS.findIndex((day) => day.id === spanMatch[2]);
      if (from !== -1 && to !== -1) {
        for (let cursor = from; ; cursor = (cursor + 1) % DAYS.length) {
          hours.push({ day: DAYS[cursor].id, open: range.start, close: range.end, source: "text", evidence: line });
          if (cursor === to) break;
        }
        continue;
      }
    }
    const day = dayFromText(line);
    if (day) hours.push({ day, open: range.start, close: range.end, source: "text", evidence: line });
  }
  return hours;
}

/**
 * An address is published only when a street line and a postal code sit together —
 * a lone street fragment, or a postal code from a footer, is not an address.
 */
function addressFromText(text) {
  const lines = String(text || "").split("\n").map(collapseWhitespace);
  for (let index = 0; index < lines.length; index += 1) {
    const street = STREET_LINE.exec(lines[index]);
    if (!street) continue;
    const window = lines.slice(index, index + 3).join(" ");
    const postal = POSTAL_LINE.exec(window);
    if (!postal) continue;
    const streetText = collapseWhitespace(`${street[1]} ${street[2]}`).replace(/[,;|]+$/, "");
    const city = collapseWhitespace(postal[2]);
    return {
      street: streetText,
      postalCode: postal[1],
      city,
      full: `${streetText}, ${postal[1]} ${city}`,
      source: "text",
      evidence: collapseWhitespace(window).slice(0, 160),
    };
  }
  return null;
}

function dedupeHours(hours) {
  const byKey = new Map();
  for (const entry of hours) byKey.set(`${entry.day}|${entry.open}|${entry.close || ""}`, entry);
  return [...byKey.values()].sort((left, right) =>
    DAYS.findIndex((day) => day.id === left.day) - DAYS.findIndex((day) => day.id === right.day) || left.open.localeCompare(right.open));
}

/** Disciplines are only reported when the page itself names them. */
function disciplinesFromText(text, known) {
  const flat = ` ${flatten(text)} `;
  return (known || []).filter((discipline) => {
    const needle = flatten(discipline).split(" / ")[0];
    return needle.length >= 3 && flat.includes(` ${needle} `);
  });
}

function normalizeProfileDocument({ html = "", text = null, gymId = null, sourceId = null, sourceUrl = null, knownDisciplines = [] } = {}) {
  const plainText = text || htmlToText(html);
  const meta = extractMeta(html);
  const places = jsonLdPlaces(html);
  const place = places[0] || null;
  const address = (place && addressFromJsonLd(place)) || addressFromText(plainText);
  const hours = dedupeHours([...(place ? hoursFromJsonLd(place) : []), ...hoursFromText(plainText)]);
  const phoneMatch = (place?.telephone && String(place.telephone)) || PHONE.exec(plainText)?.[0] || null;
  const emailMatch = (place?.email && String(place.email)) || EMAIL.exec(plainText)?.[0] || null;
  return {
    gymId,
    sourceId,
    sourceUrl,
    name: collapseWhitespace(String(place?.name || meta.title || "")) || null,
    description: meta.description ? collapseWhitespace(meta.description) : null,
    address,
    phone: phoneMatch ? collapseWhitespace(phoneMatch) : null,
    email: emailMatch ? emailMatch.toLowerCase() : null,
    hours,
    disciplines: disciplinesFromText(plainText, knownDisciplines),
    hasStructuredData: Boolean(place),
  };
}

module.exports = {
  addressFromJsonLd,
  addressFromText,
  dedupeHours,
  disciplinesFromText,
  hoursFromJsonLd,
  hoursFromText,
  normalizeProfileDocument,
};
