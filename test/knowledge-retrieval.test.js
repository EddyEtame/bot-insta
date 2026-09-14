"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { analyzeQuery, focusPlanningContent, loadKnowledgeBase } = require("../src/knowledge");
const { loadGymRegistry } = require("../src/gyms");
const { createWorkspace } = require("./fixtures/workspace");

function writeGenerated(workspace, document) {
  const directory = path.join(workspace.directory, "source", "generated");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${document.metadata.id}.json`), JSON.stringify(document, null, 2));
}

function planningDocument({ gymId, id, checkedAt, content, facts = [] }) {
  return {
    metadata: {
      id,
      title: `Planning ${gymId}`,
      sourceType: "web",
      sourceUrl: `https://www.boxingcenter.fr/salles/${gymId}/planning`,
      visibility: "public",
      verificationStatus: "verified_public",
      priority: 92,
      language: "fr",
      docType: "planning",
      gyms: [gymId],
      generated: true,
      checkedAt,
      capturedAt: checkedAt,
      maxAgeDays: 10,
      topics: [gymId, "planning", "horaires", "cours"],
      facts,
    },
    content,
  };
}

function seeded(now = "2026-09-14T04:30:00Z") {
  const workspace = createWorkspace();
  writeGenerated(workspace, planningDocument({
    gymId: "minimes",
    id: "bc-minimes-planning",
    checkedAt: now,
    content: "Planning Minimes\nMARDI : 18h30–20h Boxe anglaise\nSAMEDI : 10h–11h30 Boxe éducative · 7-12 ans\nPlanning aménagé fin juillet–mi-août",
    facts: [{ key: "planning_minimes_mardi", value: "18h30–20h Boxe anglaise" }],
  }));
  writeGenerated(workspace, planningDocument({
    gymId: "portet",
    id: "bc-portet-planning",
    checkedAt: now,
    content: "Planning Portet\nMARDI : 19h–20h30 MMA",
    facts: [{ key: "planning_portet_mardi", value: "19h–20h30 MMA" }],
  }));
  const registry = loadGymRegistry(workspace.config);
  return { workspace, knowledge: loadKnowledgeBase(workspace.config, { registry }) };
}

test("a question naming a club never retrieves another club's planning", () => {
  const { workspace, knowledge } = seeded();
  try {
    const result = knowledge.retrieve("le planning du mardi aux Minimes", { now: new Date("2026-09-14T09:00:00Z") });
    assert.deepEqual(result.sources, ["bc-minimes-planning"]);
    assert.ok(result.wrongGymSources.includes("bc-portet-planning"));
    assert.equal(result.chunks[0].content.includes("MMA"), false);
  } finally {
    workspace.cleanup();
  }
});

test("a planning answer is narrowed to the day the customer asked about", () => {
  const { workspace, knowledge } = seeded();
  try {
    const result = knowledge.retrieve("vous avez quoi le samedi aux Minimes ?", { now: new Date("2026-09-14T09:00:00Z") });
    assert.match(result.chunks[0].content, /SAMEDI/);
    assert.equal(result.chunks[0].content.includes("MARDI"), false);
    assert.match(result.chunks[0].content, /Planning aménagé/);
  } finally {
    workspace.cleanup();
  }
});

test("a planning past its freshness budget stops being evidence and is reported as stale", () => {
  const { workspace, knowledge } = seeded("2026-08-01T04:30:00Z");
  try {
    const result = knowledge.retrieve("le planning du mardi aux Minimes", { now: new Date("2026-09-14T09:00:00Z") });
    assert.equal(result.hasEvidence, false);
    assert.equal(result.staleSources.length >= 1, true);
    assert.equal(result.staleSources[0].maxAgeDays, 10);
    assert.equal(knowledge.freshnessReport(new Date("2026-09-14T09:00:00Z")).staleSourceCount, 2);
  } finally {
    workspace.cleanup();
  }
});

test("a club-less planning question is flagged so the bot asks which club instead of guessing", () => {
  const { workspace, knowledge } = seeded();
  try {
    assert.equal(knowledge.retrieve("c'est quoi le planning du mardi ?").needsGym, true);
    assert.equal(knowledge.retrieve("le planning du mardi aux Minimes").needsGym, false);
    assert.equal(knowledge.retrieve("quel est le prix de l'offre 29 ?").needsGym, false);
  } finally {
    workspace.cleanup();
  }
});

test("coverage and status say exactly which clubs are documented", () => {
  const { workspace, knowledge } = seeded();
  try {
    const status = knowledge.getStatus(new Date("2026-09-14T09:00:00Z"));
    assert.equal(status.gymCount, 5);
    assert.equal(status.gymsWithPlanning, 2);
    assert.equal(status.gymsWithProfile, 0);
    assert.equal(status.fetchedSourceCount, 2);
    const balma = knowledge.coverage().find((entry) => entry.gymId === "minimes");
    assert.deepEqual(balma.docTypes, ["planning"]);
  } finally {
    workspace.cleanup();
  }
});

test("query analysis reads club, day, discipline and intent out of one sentence", () => {
  const { workspace, knowledge } = seeded();
  try {
    const analysis = analyzeQuery("le cours de mma le mardi à Portet c'est à quelle heure ?", knowledge.registry);
    assert.deepEqual(analysis.gymIds, ["portet"]);
    assert.deepEqual(analysis.days, ["mardi"]);
    assert.deepEqual(analysis.disciplines, ["mma"]);
    assert.equal(analysis.wantsPlanning, true);
    assert.equal(analysis.wantsOffer, false);
  } finally {
    workspace.cleanup();
  }
});

test("focusing a planning keeps the header and notes even when the day is absent", () => {
  const content = "Planning Minimes\nMARDI : 18h30 MMA\nPlanning aménagé fin juillet";
  assert.equal(focusPlanningContent(content, ["dimanche"]), content);
  assert.match(focusPlanningContent(content, ["mardi"]), /MARDI/);
});
