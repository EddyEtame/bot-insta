"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { checkCorpus } = require("../scripts/check-corpus");
const { DAYS } = require("../src/calendar");
const { loadConfig } = require("../src/config");
const { loadGymRegistry } = require("../src/gyms");
const { loadKnowledgeBase } = require("../src/knowledge");
const { normalizePlanning } = require("../src/planning");

const config = loadConfig({ KNOWLEDGE_BASE_PATH: path.resolve(__dirname, "..", "knowledge") });
const EXPORTS = path.join(config.knowledgeBasePath, "exports", "plannings");
const DAY_IDS = new Set(DAYS.map((day) => day.id));

function exportFiles() {
  return fs.existsSync(EXPORTS) ? fs.readdirSync(EXPORTS).filter((name) => name.endsWith(".json")) : [];
}

/**
 * The plannings were transcribed by hand from the club's own posters. These checks are
 * the guard on that transcription: nothing silently dropped, no unknown club, no session
 * without a day, a time and a discipline, and a check date the corpus can be honest about.
 */
test("every handed-over planning is complete, dated, and belongs to a club in the registry", () => {
  const registry = loadGymRegistry(config);
  const files = exportFiles();
  assert.ok(files.length >= 3, "the season plannings should be in knowledge/exports/plannings");

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(EXPORTS, file), "utf8"));
    const label = `exports/plannings/${file}`;
    assert.ok(registry.get(raw.gymId), `${label}: unknown club ${raw.gymId}`);
    assert.ok(raw.verifiedAt && Number.isFinite(Date.parse(raw.verifiedAt)), `${label}: missing verifiedAt`);
    assert.ok(raw.provenance && raw.provenance.length > 20, `${label}: missing provenance`);
    assert.ok(Array.isArray(raw.sessions) && raw.sessions.length > 0, `${label}: no session`);

    for (const session of raw.sessions) {
      assert.ok(DAY_IDS.has(session.day), `${label}: unknown day ${session.day}`);
      assert.match(String(session.start), /^\d{1,2}h\d{0,2}$/, `${label}: unreadable start ${session.start}`);
      assert.ok(String(session.discipline || "").length > 2, `${label}: session without a discipline`);
    }

    const normalized = normalizePlanning(raw);
    assert.equal(
      normalized.sessions.length,
      raw.sessions.length,
      `${label}: ${raw.sessions.length - normalized.sessions.length} session(s) were dropped by normalization`,
    );
    assert.ok(normalized.sessions.every((session) => session.end), `${label}: every session should carry an end time`);
  }
});

test("the shipped corpus exposes those plannings, checked on the day a human verified them", () => {
  const registry = loadGymRegistry(config);
  const knowledge = loadKnowledgeBase(config, { registry });
  const now = new Date();

  for (const file of exportFiles()) {
    const raw = JSON.parse(fs.readFileSync(path.join(EXPORTS, file), "utf8"));
    const document = knowledge.documents.find((entry) => entry.id === `bc-${raw.gymId}-planning`);
    assert.ok(document, `bc-${raw.gymId}-planning is missing from the corpus — run npm run knowledge:sync`);
    assert.equal(document.checkedAt.slice(0, 10), raw.verifiedAt.slice(0, 10));
    assert.equal(document.verificationStatus, "verified_public");
    assert.deepEqual(document.gyms, [raw.gymId]);
    assert.equal(knowledge.stalenessOf(document, now).stale, false);
    for (const day of new Set(raw.sessions.map((session) => session.day))) {
      assert.match(document.content, new RegExp(`${day.toUpperCase()} :`), `${document.id}: ${day} is missing from the published planning`);
    }
  }
});

test("the shipped corpus passes its own build controls", () => {
  const result = checkCorpus({ config });
  assert.deepEqual(result.failures, []);
  assert.ok(result.status.gymsWithPlanning >= 3, "at least three clubs should have a published planning");
});

test("a club-specific question is answered from that club, or handed over — never from a club-wide page", () => {
  const registry = loadGymRegistry(config);
  const knowledge = loadKnowledgeBase(config, { registry });
  const now = new Date();

  const minimes = knowledge.retrieve("le planning du mercredi aux Minimes", { now });
  assert.equal(minimes.sources[0], "bc-minimes-planning");
  assert.match(minimes.chunks[0].content, /MERCREDI/);
  assert.equal(minimes.chunks[0].content.includes("LUNDI :"), false);

  const etatsUnis = knowledge.retrieve("vous avez du jiu-jitsu brésilien à États-Unis ?", { now });
  assert.equal(etatsUnis.sources[0], "bc-etats-unis-planning");
  assert.match(etatsUnis.chunks.map((chunk) => chunk.content).join("\n"), /Jiu-jitsu brésilien/);

  // Balma has no planning in the corpus yet: the offer page must not stand in for one.
  const balma = knowledge.retrieve("c'est quoi le planning du mardi à Balma ?", { now });
  assert.deepEqual(balma.missingForGym, [{ gymId: "balma", docType: "planning" }]);
});
