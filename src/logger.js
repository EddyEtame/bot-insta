"use strict";

function mask(value) {
  const text = String(value || "");
  return text.length <= 6 ? "***" : `${text.slice(0, 3)}…${text.slice(-3)}`;
}

function log(event, details = {}) {
  console.log(JSON.stringify({ level: "info", event, at: new Date().toISOString(), ...details }));
}

function error(event, err, details = {}) {
  console.error(JSON.stringify({
    level: "error",
    event,
    at: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    ...details,
  }));
}

module.exports = { error, log, mask };
