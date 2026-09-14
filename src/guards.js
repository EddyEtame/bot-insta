"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { flatten, normalize } = require("./text");

/**
 * "La barre commerciale : on vend ce qui existe, jamais ce qui manque."
 * A reply that opens on an absence kills the click that brought the customer in.
 */
const NEGATIVE_OPENINGS = [
  /^\s*(?:non|no)\b/i,
  /\b(?:il n['’ ]?y a pas|il n['’ ]?y en a pas|nous n['’ ]?avons pas|on n['’ ]?a pas|nous ne proposons pas|on ne propose pas|nous ne faisons pas|on ne fait pas|il n['’ ]?existe pas)\b/i,
  /\b(?:malheureusement|h[ée]las|d[ée]sol[ée]s?,? (?:mais )?(?:nous|on|je))\b/i,
  /\b(?:we (?:don['’]t|do not) (?:have|offer)|there (?:is|are) no|unfortunately)\b/i,
];

const SECRET_OR_INTERNAL = /(?:api[_ -]?key|access[_ -]?token|meta app secret|system prompt|developer message|ignore previous instructions|process\.env)/i;

/** Numbers a customer would act on: prices, times, and counted durations. */
const CLAIM_PATTERNS = [
  { kind: "price", pattern: /(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros?\b)/gi, canonical: (value) => `price:${value.replace(",", ".").replace(/\.0+$/, "")}` },
  { kind: "time", pattern: /(?<![\d,.])(\d{1,2})\s*[h:]\s*(\d{2})?(?![\d])/gi, canonical: (hours, minutes) => `time:${Number(hours)}h${minutes && minutes !== "00" ? minutes : ""}` },
  { kind: "duration", pattern: /(\d{1,3})\s*(mois|semaines?|ans?|jours?|s[ée]ances?|salles?|cours)\b/gi, canonical: (value, unit) => `duration:${Number(value)}:${flatten(unit).replace(/s$/, "")}` },
];

function extractClaims(text) {
  const claims = new Set();
  for (const { pattern, canonical } of CLAIM_PATTERNS) {
    for (const match of String(text || "").matchAll(pattern)) claims.add(canonical(...match.slice(1)));
  }
  return claims;
}

/** Numbers in the reply that no retrieved source supports. */
function unsourcedClaims(reply, evidenceText) {
  const supported = extractClaims(evidenceText);
  return [...extractClaims(reply)].filter((claim) => !supported.has(claim));
}

function negativeSaleOpening(text) {
  const firstSentence = String(text || "").split(/(?<=[.!?\n])/)[0] || "";
  return NEGATIVE_OPENINGS.some((pattern) => pattern.test(firstSentence));
}

function loadForbiddenClaims(config) {
  const file = path.join(config.knowledgeBasePath, "rules", "forbidden-claims.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return (Array.isArray(parsed.claims) ? parsed.claims : [])
      .filter((claim) => claim && claim.id && claim.pattern)
      .map((claim) => ({
        id: String(claim.id),
        kind: claim.kind === "requires_evidence" ? "requires_evidence" : "forbidden",
        why: String(claim.why || ""),
        regexp: new RegExp(claim.pattern, "i"),
      }));
  } catch {
    return [];
  }
}

/**
 * `forbidden` claims never ship. `requires_evidence` claims ship only when the same
 * wording is in the evidence that was actually retrieved for this message.
 */
function violatedClaims(reply, evidenceText, claims) {
  const replyText = normalize(reply);
  const evidence = normalize(evidenceText);
  return claims
    .filter((claim) => claim.regexp.test(replyText))
    .filter((claim) => claim.kind === "forbidden" || !claim.regexp.test(evidence))
    .map((claim) => ({ id: claim.id, kind: claim.kind, why: claim.why }));
}

function evidenceTextOf(retrieval) {
  return (retrieval?.chunks || [])
    .map((chunk) => [chunk.content, ...(chunk.facts || []).map((fact) => `${fact.key} ${fact.value}`)].join("\n"))
    .join("\n");
}

module.exports = {
  CLAIM_PATTERNS,
  NEGATIVE_OPENINGS,
  SECRET_OR_INTERNAL,
  evidenceTextOf,
  extractClaims,
  loadForbiddenClaims,
  negativeSaleOpening,
  unsourcedClaims,
  violatedClaims,
};
