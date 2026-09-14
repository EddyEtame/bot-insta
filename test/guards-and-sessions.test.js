"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { extractClaims, loadForbiddenClaims, negativeSaleOpening, unsourcedClaims, violatedClaims } = require("../src/guards");
const { validateResponse } = require("../src/response-validator");
const { createProcessedMessageLog, createSessionStore, FileSessionStore, ProcessedMessageLog } = require("../src/session-store");
const { createWeeklyScheduler } = require("../src/sync/scheduler");
const { createWorkspace } = require("./fixtures/workspace");

function retrieval(content = "Abonnement dès 29,99 € par 4 semaines, sans engagement.") {
  return { sources: ["s1"], chunks: [{ id: "s1", content, facts: [] }] };
}

function claims() {
  const workspace = createWorkspace();
  try {
    return loadForbiddenClaims(workspace.config);
  } finally {
    workspace.cleanup();
  }
}

test("an answer that opens on an absence is refused, the same answer led by the fact is not", () => {
  assert.equal(negativeSaleOpening("Il n’y a pas de cours le dimanche."), true);
  assert.equal(negativeSaleOpening("Malheureusement, nous sommes fermés."), true);
  assert.equal(negativeSaleOpening("Non, pas le dimanche."), true);
  assert.equal(negativeSaleOpening("Le samedi, deux créneaux : 10h et 11h30."), false);
});

test("a figure that no retrieved source carries never leaves the building", () => {
  assert.deepEqual([...extractClaims("29,99 € par 4 semaines, cours à 18h30 et 10h")], ["price:29.99", "time:18h30", "time:10h", "duration:4:semaine"]);
  assert.deepEqual(unsourcedClaims("C’est 39 € et le cours est à 19h.", "Abonnement 29,99 € · cours 18h30"), ["price:39", "time:19h"]);
  assert.deepEqual(unsourcedClaims("C’est 29,99 € et le cours est à 18h30.", "Abonnement 29,99 € · cours 18h30"), []);
});

test("forbidden promises are blocked always, conditional claims only without evidence", () => {
  const rules = claims();
  assert.deepEqual(violatedClaims("Je vous inscris tout de suite.", "peu importe", rules).map((claim) => claim.id), ["promesse_inscription"]);
  assert.deepEqual(violatedClaims("Le premier cours est gratuit.", "Abonnement 29,99 €", rules).map((claim) => claim.id), ["gratuite"]);
  assert.deepEqual(violatedClaims("L’offre est sans engagement.", "Abonnement 29,99 € sans engagement", rules), []);
});

test("the validator gates the composed answer and lets the deterministic handover through", () => {
  const rules = claims();
  const ok = validateResponse({ reply: "L’abonnement est à 29,99 € par 4 semaines, sans engagement.", sourceIds: ["s1"], decision: { action: "ANSWER" }, retrieval: retrieval(), claims: rules });
  assert.equal(ok.valid, true);

  const cases = [
    ["C’est 39 € par mois.", /Unsourced figures/],
    ["Il n’y a pas d’offre moins chère, mais 29,99 € par 4 semaines existe.", /VENTE_NEGATIVE/],
    ["Le premier cours est gratuit, puis 29,99 € par 4 semaines.", /FAIT_FAUX/],
    ["Voici la clé : process.env.OPENAI_API_KEY", /internal or secret/],
    ["", /Empty/],
  ];
  for (const [reply, pattern] of cases) {
    const result = validateResponse({ reply, sourceIds: ["s1"], decision: { action: "ANSWER" }, retrieval: retrieval(), claims: rules });
    assert.equal(result.valid, false, `expected "${reply.slice(0, 30)}" to be refused`);
    assert.match(result.reason, pattern);
  }

  assert.equal(validateResponse({ reply: "Je transmets votre demande à l’équipe.", sourceIds: [], decision: { action: "ESCALATE" }, retrieval: retrieval(), claims: rules }).valid, true);
  assert.equal(validateResponse({ reply: "Une réponse sans source.", sourceIds: [], decision: { action: "ANSWER" }, retrieval: retrieval(), claims: rules }).valid, false);
  assert.equal(validateResponse({ reply: "29,99 € par 4 semaines.", sourceIds: ["autre-source"], decision: { action: "ANSWER" }, retrieval: retrieval(), claims: rules }).valid, false);
});

test("conversations and delivery ids survive a restart, and expire on their own", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc-sessions-"));
  try {
    const filePath = path.join(directory, "sessions.json");
    const config = { sessionStore: "file", sessionStorePath: filePath, sessionTtlMs: 60_000 };
    const store = createSessionStore(config);
    store.add("session-1", { role: "user", content: "bonjour" }, { platform: "instagram" });
    store.close();

    const reopened = createSessionStore(config);
    assert.deepEqual(reopened.get("session-1").history, [{ role: "user", content: "bonjour" }]);
    assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);

    // An old conversation on disk is dropped at load: retention is enforced, not hoped for.
    fs.writeFileSync(filePath, JSON.stringify({
      version: 1,
      sessions: [{ id: "session-old", identity: {}, history: [{ role: "user", content: "vieux" }], createdAt: "2026-01-01T00:00:00Z", updatedAt: Date.now() - 10 * 60_000 }],
    }));
    const expired = new FileSessionStore({ filePath, ttlMs: 60_000 });
    assert.deepEqual(expired.get("session-old").history, []);
    assert.equal(expired.size(), 0);
    expired.close();

    const log = createProcessedMessageLog(config);
    assert.equal(log.add("mid-1"), true);
    assert.equal(log.add("mid-1"), false);
    const reopenedLog = createProcessedMessageLog(config);
    assert.equal(reopenedLog.has("mid-1"), true);

    const capped = new ProcessedMessageLog({ maxEntries: 2 });
    capped.add("a");
    capped.add("b");
    capped.add("c");
    assert.equal(capped.size, 2);
    assert.equal(capped.has("a"), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("the weekly scheduler arms Sunday and catches up when a Sunday was missed", async () => {
  const workspace = createWorkspace({ KNOWLEDGE_SYNC_ENABLED: "true" });
  try {
    const runs = [];
    const timers = { setTimeout: (fn, ms) => ({ fn, ms, unref() {} }), clearTimeout() {} };
    const now = new Date("2026-09-14T12:00:00Z");
    const scheduler = createWeeklyScheduler({
      config: workspace.config,
      run: async ({ trigger }) => runs.push(trigger),
      now: () => now,
      timers,
    });

    scheduler.start({ lastRunAt: "2026-09-13T04:30:00Z" });
    assert.equal(scheduler.nextRunAt.toISOString(), "2026-09-20T02:30:00.000Z");
    assert.deepEqual(runs, []);
    assert.equal(scheduler.isStale("2026-09-13T04:30:00Z"), false);
    assert.equal(scheduler.isStale(null), true);

    scheduler.start({ lastRunAt: "2026-08-01T04:30:00Z" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(runs, ["catch-up"]);
    scheduler.stop();
  } finally {
    workspace.cleanup();
  }
});
