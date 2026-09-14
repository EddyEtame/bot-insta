"use strict";

const SECRET_OR_INTERNAL_PATTERN = /(?:api[_ -]?key|access[_ -]?token|meta app secret|system prompt|developer message|ignore previous instructions|process\.env)/i;

function validateResponse({ reply, sourceIds, decision, retrieval }) {
  const text = String(reply || "").trim();
  if (!text) return { valid: false, reason: "Empty response" };
  if (text.length > 1_000) return { valid: false, reason: "Response exceeds Instagram response limit" };
  if (SECRET_OR_INTERNAL_PATTERN.test(text)) return { valid: false, reason: "Response appears to expose internal or secret material" };
  if (decision.action === "ANSWER") {
    if (!Array.isArray(sourceIds) || !sourceIds.length) return { valid: false, reason: "Factual answer has no source trace" };
    const approved = new Set(retrieval.sources);
    if (sourceIds.some((id) => !approved.has(id))) return { valid: false, reason: "Response cites a source that was not retrieved" };
  }
  return { valid: true, text, sourceIds: Array.isArray(sourceIds) ? sourceIds : [] };
}

module.exports = { validateResponse };
