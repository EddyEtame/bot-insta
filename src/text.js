"use strict";

const STOP_WORDS = new Set([
  "a", "au", "aux", "avec", "ce", "ces", "cette", "comme", "dans", "de", "des", "du", "en", "est", "et",
  "il", "je", "la", "le", "les", "ma", "mes", "mon", "nous", "ou", "par", "pas", "pour", "que", "qui",
  "sur", "tu", "un", "une", "vos", "you", "the", "and", "for", "with", "what", "how", "is", "it", "to",
]);

/** Lowercase, accent-free form used for every comparison in the project. */
function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .toLocaleLowerCase("fr-FR");
}

/** Normalized form with punctuation flattened to single spaces, for phrase matching. */
function flatten(text) {
  return normalize(text).replace(/[^a-z0-9€'\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(text) {
  return [...new Set(normalize(text).match(/[a-z0-9€]+/g) || [])]
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** True when `needle` appears in `haystack` on word boundaries, both normalized. */
function containsPhrase(haystack, needle) {
  const flatNeedle = flatten(needle);
  if (!flatNeedle) return false;
  return ` ${flatten(haystack)} `.includes(` ${flatNeedle} `);
}

function slugify(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function collapseWhitespace(text) {
  return String(text ?? "").replace(/[\t\f\r ]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = { STOP_WORDS, collapseWhitespace, containsPhrase, flatten, normalize, slugify, tokens };
