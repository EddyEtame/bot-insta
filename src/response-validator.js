"use strict";

const { SECRET_OR_INTERNAL, evidenceTextOf, negativeSaleOpening, unsourcedClaims, violatedClaims } = require("./guards");

const MAX_LENGTH = 1_000;

function reject(reason, findings = []) {
  return { valid: false, reason, findings };
}

/**
 * The last gate before Instagram. The model composes; this decides whether what it
 * composed may leave the building.
 */
function validateResponse({ reply, sourceIds, decision, retrieval, claims = [] }) {
  const text = String(reply || "").trim();
  if (!text) return reject("Empty response");
  if (text.length > MAX_LENGTH) return reject("Response exceeds Instagram response limit");
  if (SECRET_OR_INTERNAL.test(text)) return reject("Response appears to expose internal or secret material");

  const evidence = evidenceTextOf(retrieval);
  const forbidden = violatedClaims(text, evidence, claims);
  const blocking = decision.action === "ANSWER" ? forbidden : forbidden.filter((claim) => claim.kind === "forbidden");
  if (blocking.length) return reject(`FAIT_FAUX: ${blocking.map((claim) => claim.id).join(", ")}`, blocking);

  if (decision.action === "ANSWER") {
    if (!Array.isArray(sourceIds) || !sourceIds.length) return reject("Factual answer has no source trace");
    const approved = new Set(retrieval.sources);
    if (sourceIds.some((id) => !approved.has(id))) return reject("Response cites a source that was not retrieved");
    const unsourced = unsourcedClaims(text, evidence);
    if (unsourced.length) return reject(`Unsourced figures: ${unsourced.join(", ")}`, unsourced);
    // "On vend ce qui existe, jamais ce qui manque" — an answer never opens on an absence.
    if (negativeSaleOpening(text)) return reject("VENTE_NEGATIVE: the answer opens on an absence");
  }
  return { valid: true, text, sourceIds: Array.isArray(sourceIds) ? sourceIds : [], findings: [] };
}

module.exports = { MAX_LENGTH, validateResponse };
