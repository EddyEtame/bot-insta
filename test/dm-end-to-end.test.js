"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { checkCorpus } = require("../scripts/check-corpus");
const { createDecisionEngine, ACTIONS } = require("../src/decision-engine");
const { loadForbiddenClaims } = require("../src/guards");
const { loadGymRegistry } = require("../src/gyms");
const { loadKnowledgeBase } = require("../src/knowledge");
const { InMemoryRateLimiter } = require("../src/rate-limiter");
const { validateResponse } = require("../src/response-validator");
const { InMemorySessionStore } = require("../src/session-store");
const { createHttpClient } = require("../src/sync/http");
const { createPipeline } = require("../src/sync/pipeline");
const { createRobotsGate } = require("../src/sync/robots");
const { createStore } = require("../src/sync/store");
const { createMessageProcessor } = require("../src/webhook");
const { createFakeFetch } = require("./fixtures/site");
const { createWorkspace } = require("./fixtures/workspace");

const NOW = new Date("2026-09-14T09:00:00Z");

async function syncedWorkspace() {
  const workspace = createWorkspace({}, { webPlanningFor: "ramonville" });
  const registry = loadGymRegistry(workspace.config);
  const http = createHttpClient({ config: workspace.config, allowlist: registry.hostAllowlist, fetchImpl: createFakeFetch(), sleep: async () => {} });
  const robots = createRobotsGate({ http, userAgent: workspace.config.sync.userAgent });
  const store = createStore(workspace.config);
  await createPipeline({ config: workspace.config, registry, http, robots, store }).run({ now: new Date("2026-09-13T04:30:00Z") });
  return { workspace, registry, knowledge: loadKnowledgeBase(workspace.config, { registry }) };
}

function payload(text, messageId = "mid-1") {
  return {
    object: "instagram",
    entry: [{ id: "account-1", messaging: [{ sender: { id: "sender-1" }, recipient: { id: "account-1" }, timestamp: Date.parse(NOW), message: { mid: messageId, text } }] }],
  };
}

function harness({ workspace, knowledge, registry, aiReply }) {
  const sent = [];
  const escalations = [];
  const processor = createMessageProcessor({
    config: workspace.config,
    sessions: new InMemorySessionStore({ ttlMs: workspace.config.sessionTtlMs }),
    ai: { generateResponse: async (request) => aiReply(request) },
    instagram: async (config, recipientId, text) => sent.push({ recipientId, text }),
    escalation: async (config, escalation) => {
      escalations.push(escalation);
      return { delivered: false, destination: "local-log" };
    },
    knowledge: { retrieve: (query) => knowledge.retrieve(query, { now: NOW }), persona: knowledge.persona },
    decisionEngine: createDecisionEngine({ registry }),
    responseValidator: validateResponse,
    rateLimiter: new InMemoryRateLimiter({ limit: 8 }),
    claims: loadForbiddenClaims(workspace.config),
  });
  return { processor, sent, escalations };
}

test("a planning question for one club is answered from that club's fetched planning", async () => {
  const { workspace, knowledge, registry } = await syncedWorkspace();
  try {
    const seen = [];
    const { processor, sent } = harness({
      workspace,
      knowledge,
      registry,
      aiReply: async (request) => {
        seen.push(request);
        return { reply: "Mardi à Ramonville : Cross training à 12h15 et MMA à 18h30. Passez quand vous voulez, sans réserver.", sourceIds: ["bc-ramonville-planning"] };
      },
    });
    await processor(payload("Bonjour, c'est quoi le planning du mardi à Ramonville ?"));
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /12h15/);
    assert.equal(seen[0].retrieval.analysis.gymIds[0], "ramonville");
    assert.equal(seen[0].decision.action, ACTIONS.ANSWER);
  } finally {
    workspace.cleanup();
  }
});

test("the same question without a club asks which club instead of guessing, and never calls the model", async () => {
  const { workspace, knowledge, registry } = await syncedWorkspace();
  try {
    let modelCalls = 0;
    const { processor, sent } = harness({
      workspace,
      knowledge,
      registry,
      aiReply: async () => {
        modelCalls += 1;
        return { reply: "…", sourceIds: [] };
      },
    });
    await processor(payload("c'est quoi le planning du mardi ?"));
    assert.equal(modelCalls, 0);
    assert.match(sent[0].text, /quelle salle/i);
    assert.match(sent[0].text, /Saint-Cyprien, États-Unis, Minimes, Ramonville ou Portet/);
  } finally {
    workspace.cleanup();
  }
});

test("a question about a club the corpus does not cover hands over instead of borrowing another club's", async () => {
  const { workspace, knowledge, registry } = await syncedWorkspace();
  try {
    const { processor, sent, escalations } = harness({
      workspace,
      knowledge,
      registry,
      aiReply: async () => ({ reply: "Mardi : MMA à 18h30.", sourceIds: ["bc-ramonville-planning"] }),
    });
    await processor(payload("c'est quoi l'adresse de la salle des Minimes ?"));
    assert.equal(escalations.length, 1);
    assert.equal(sent[0].text.includes("18h30"), false);
    assert.match(sent[0].text, /vérifier cela avec l’équipe/);
  } finally {
    workspace.cleanup();
  }
});

test("an invented figure is caught after the model and turned into a handover", async () => {
  const { workspace, knowledge, registry } = await syncedWorkspace();
  try {
    const { processor, sent, escalations } = harness({
      workspace,
      knowledge,
      registry,
      aiReply: async () => ({ reply: "Mardi à Ramonville : MMA à 20h45.", sourceIds: ["bc-ramonville-planning"] }),
    });
    await processor(payload("le mardi à Ramonville, le MMA c'est à quelle heure ?"));
    assert.equal(sent[0].text.includes("20h45"), false);
    assert.equal(escalations.length, 1);
    assert.match(escalations[0].reason, /Unsourced figures/);
  } finally {
    workspace.cleanup();
  }
});

test("the build controls pass on a synced corpus and catch a contradiction the moment it appears", async () => {
  const { workspace, knowledge } = await syncedWorkspace();
  try {
    const clean = checkCorpus({ config: workspace.config, now: new Date("2026-09-14T09:00:00Z") });
    assert.deepEqual(clean.failures, []);
    assert.equal(clean.coverage.find((gym) => gym.gymId === "ramonville").hasPlanning, true);

    const fs = require("node:fs");
    const path = require("node:path");
    const existing = JSON.parse(fs.readFileSync(path.join(workspace.directory, "source", "generated", "bc-ramonville-planning.json"), "utf8"));
    fs.writeFileSync(path.join(workspace.directory, "source", "generated", "bc-ramonville-planning-copy.json"), JSON.stringify({
      metadata: { ...existing.metadata, id: "bc-ramonville-planning-copy", facts: [{ key: "planning_ramonville_mardi", value: "autre chose" }] },
      content: "Planning Ramonville\n\nMARDI : 19h Autre chose",
    }));
    fs.writeFileSync(path.join(workspace.directory, "source", "generated", "bc-ramonville-broken.json"), JSON.stringify({
      metadata: { ...existing.metadata, id: "bc-ramonville-broken", facts: [] },
      content: "Il n’y a pas de cours le dimanche à Ramonville.",
    }));
    const dirty = checkCorpus({ config: workspace.config, now: new Date("2026-09-14T09:00:00Z") });
    assert.ok(dirty.failures.some((failure) => failure.startsWith("CONTRADICTION")));
    assert.ok(dirty.failures.some((failure) => failure.startsWith("VENTE_NEGATIVE")));
    assert.ok(dirty.failures.some((failure) => failure.startsWith("FAITS")));
    assert.equal(knowledge.getStatus().registryErrors, 0);
  } finally {
    workspace.cleanup();
  }
});
