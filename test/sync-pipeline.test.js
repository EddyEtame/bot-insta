"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadGymRegistry } = require("../src/gyms");
const { loadKnowledgeBase } = require("../src/knowledge");
const { createHttpClient } = require("../src/sync/http");
const { createPipeline, discoveryScore } = require("../src/sync/pipeline");
const { createRobotsGate } = require("../src/sync/robots");
const { createStore } = require("../src/sync/store");
const { createSyncService, summarizeReport } = require("../src/sync/service");
const { normalizeOffersDocument } = require("../src/sync/normalizers/offers");
const { normalizePlanningDocument } = require("../src/sync/normalizers/planning");
const { normalizeProfileDocument } = require("../src/sync/normalizers/profile");
const { RAMONVILLE_PLANNING, RAMONVILLE_PLANNING_V2, createFakeFetch, defaultPages } = require("./fixtures/site");
const { createWorkspace } = require("./fixtures/workspace");

const WEB_CLUB = "ramonville";

function harness({ pages = defaultPages(), env = {} } = {}) {
  const workspace = createWorkspace(env, { webPlanningFor: WEB_CLUB });
  const log = [];
  const fetchImpl = createFakeFetch({ pages, log });
  const registry = loadGymRegistry(workspace.config);
  const http = createHttpClient({ config: workspace.config, allowlist: registry.hostAllowlist, fetchImpl, sleep: async () => {} });
  const robots = createRobotsGate({ http, userAgent: workspace.config.sync.userAgent });
  const store = createStore(workspace.config);
  const pipeline = createPipeline({ config: workspace.config, registry, http, robots, store });
  return { workspace, pages, log, registry, store, pipeline };
}

test("a fetched club page becomes a normalized record, a source document and a snapshot", async () => {
  const { workspace, store, pipeline } = harness();
  try {
    const report = await pipeline.run({ now: new Date("2026-09-13T04:30:00Z") });
    // Four pages from the site, plus the season plannings handed over as files.
    assert.equal(report.stats.updated, 4 + 4);
    // Club-wide pages are keyed by their source, so two of them never overwrite each other.
    for (const id of ["bc-ramonville-planning", "bc-ramonville-profile", "bc-club-home", "bc-club-offers"]) {
      assert.ok(store.listGeneratedSources().includes(id), `${id} should have been generated`);
    }

    const planning = store.readNormalized("ramonville", "planning");
    assert.equal(planning.sessions.length, 5);
    assert.equal(planning.sourceUrl, "https://www.boxingcenter.fr/salles/ramonville/planning");
    assert.match(planning.checkedAt, /^2026-09-13/);

    const profile = store.readNormalized("ramonville", "profile");
    assert.equal(profile.address.full, "3 rue de la Fixture, 31520 Ramonville-Saint-Agne");
    assert.equal(profile.phone, "05 61 11 22 33");
    assert.equal(profile.hours.length, 6);

    const document = JSON.parse(fs.readFileSync(path.join(workspace.directory, "source", "generated", "bc-ramonville-planning.json"), "utf8"));
    assert.equal(document.metadata.verificationStatus, "verified_public");
    assert.deepEqual(document.metadata.gyms, ["ramonville"]);
    assert.match(document.content, /MARDI : 12h15–13h15 Cross training \| 18h30–20h MMA/);
    assert.ok(fs.existsSync(path.join(workspace.directory, "raw", "ramonville-planning")));
  } finally {
    workspace.cleanup();
  }
});

test("a second run revalidates without rewriting, and a changed planning is diffed and logged", async () => {
  const { workspace, pages, log, store, pipeline } = harness();
  try {
    await pipeline.run({ now: new Date("2026-09-13T04:30:00Z") });
    const callsAfterFirst = log.length;

    const unchanged = await pipeline.run({ now: new Date("2026-09-20T04:30:00Z") });
    assert.equal(unchanged.stats.updated, 0);
    assert.equal(unchanged.stats.unchanged, 4 + 4);
    assert.equal(unchanged.changes.length, 0);
    assert.ok(log.length - callsAfterFirst < callsAfterFirst, "revalidation must be cheaper than discovery");

    pages["https://www.boxingcenter.fr/salles/ramonville/planning"] = { type: "text/html", body: RAMONVILLE_PLANNING_V2 };
    const changed = await pipeline.run({ now: new Date("2026-09-27T04:30:00Z") });
    assert.equal(changed.stats.updated, 1);
    assert.equal(changed.changes.length, 1);
    assert.equal(changed.changes[0].sourceId, "ramonville-planning");
    // The edited row carries two clubs' columns: both Monday and Tuesday move to 19h.
    assert.deepEqual(changed.changes[0].detail.added, ["lundi|19:00|Boxe anglaise", "mardi|19:00|MMA"]);
    assert.deepEqual(changed.changes[0].detail.removed, ["lundi|18:30|Boxe anglaise", "mardi|18:30|MMA"]);
    assert.match(store.readChangelog().at(-1).detail.added[0], /lundi\|19:00/);
    assert.match(summarizeReport(changed), /ramonville-planning : \+2 créneau\(x\), -2 créneau\(x\)/);
  } finally {
    workspace.cleanup();
  }
});

test("a page that cannot be identified as the club's is never published", async () => {
  const pages = defaultPages();
  pages["https://www.boxingcenter.fr/salles/portet"] = { type: "text/html", body: "<html><body><h1>Autre chose</h1></body></html>" };
  const { workspace, store, pipeline } = harness({ pages });
  try {
    const report = await pipeline.run({ now: new Date("2026-09-13T04:30:00Z") });
    const portet = report.sources.find((source) => source.sourceId === "portet-profile");
    assert.equal(portet.status, "unresolved");
    assert.equal(store.listGeneratedSources().includes("bc-portet-profile"), false);
  } finally {
    workspace.cleanup();
  }
});

test("discovery refuses a page that belongs to another club", () => {
  const { workspace, registry } = harness();
  try {
    const ramonville = registry.get("ramonville");
    const minimes = registry.get("minimes");
    const others = registry.gyms.filter((gym) => gym.id !== ramonville.id);
    assert.equal(discoveryScore("https://www.boxingcenter.fr/horaires-minimes", { gym: ramonville, docType: "planning", otherGyms: others }), 0);
    assert.ok(discoveryScore("https://www.boxingcenter.fr/salles/minimes/planning", { gym: minimes, docType: "planning", otherGyms: registry.gyms.filter((gym) => gym.id !== "minimes") }) > 0);
    assert.equal(discoveryScore("https://www.boxingcenter.fr/salles/minimes/planning", { gym: minimes, docType: "profile", otherGyms: [] }), 0);
  } finally {
    workspace.cleanup();
  }
});

test("two syncs cannot write the corpus at the same time", async () => {
  const { workspace, store } = harness();
  try {
    const service = createSyncService(workspace.config, { fetchImpl: createFakeFetch() });
    const lock = store.acquireLock({ owner: "other-process" });
    const result = await service.run({ now: new Date("2026-09-13T04:30:00Z") });
    assert.equal(result.skipped, true);
    lock.release();
    const report = await service.run({ now: new Date("2026-09-13T04:30:00Z") });
    assert.equal(report.skipped, undefined);
    assert.ok(report.stats.updated > 0);
  } finally {
    workspace.cleanup();
  }
});

test("the corpus produced by a sync is what retrieval then answers from", async () => {
  const { workspace, pipeline } = harness();
  try {
    await pipeline.run({ now: new Date("2026-09-13T04:30:00Z") });
    const registry = loadGymRegistry(workspace.config);
    const knowledge = loadKnowledgeBase(workspace.config, { registry });
    const result = knowledge.retrieve("le planning du mardi à Ramonville", { now: new Date("2026-09-14T09:00:00Z") });
    assert.equal(result.sources[0], "bc-ramonville-planning");
    assert.equal(result.sources.some((id) => id.includes("portet")), false);
    assert.match(result.chunks[0].content, /MARDI/);
    // Ramonville from the site, plus the four clubs whose season planning is a file.
    assert.equal(knowledge.getStatus(new Date("2026-09-14T09:00:00Z")).gymsWithPlanning, 5);
  } finally {
    workspace.cleanup();
  }
});

test("a planning export file on disk is ingested without any network call", async () => {
  const workspace = createWorkspace();
  try {
    const exportDirectory = path.join(workspace.directory, "exports");
    fs.mkdirSync(exportDirectory, { recursive: true });
    fs.writeFileSync(path.join(exportDirectory, "portet.json"), JSON.stringify({
      gymId: "portet",
      season: "2026/2027",
      sessions: [{ day: "mercredi", start: "19h00", end: "20h30", discipline: "MMA", level: "tous niveaux" }],
      notes: ["Planning aménagé fin juillet–mi-août"],
    }));
    const registryPath = path.join(workspace.directory, "registry", "gyms.json");
    const registryFile = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const portet = registryFile.gyms.find((gym) => gym.id === "portet");
    portet.sources = [{ id: "portet-planning", docType: "planning", kind: "file", file: "portet.json" }];
    registryFile.gyms = [portet];
    registryFile.club.gymCount = 1;
    registryFile.clubSources = [];
    fs.writeFileSync(registryPath, JSON.stringify(registryFile, null, 2));

    const config = { ...workspace.config, sync: { ...workspace.config.sync, planningExportPath: exportDirectory } };
    const registry = loadGymRegistry(config);
    const store = createStore(config);
    const pipeline = createPipeline({
      config,
      registry,
      http: { get: async () => { throw new Error("the network must not be touched"); } },
      robots: { check: async () => ({ allowed: true }), sitemapsFor: async () => [] },
      store,
    });
    const report = await pipeline.run({ now: new Date("2026-09-13T04:30:00Z") });
    assert.equal(report.stats.updated, 1);
    const document = JSON.parse(fs.readFileSync(path.join(workspace.directory, "source", "generated", "bc-portet-planning.json"), "utf8"));
    assert.match(document.content, /MERCREDI : 19h–20h30 MMA/);
    assert.equal(document.metadata.verificationStatus, "verified_public");
  } finally {
    workspace.cleanup();
  }
});

test("normalizers read a real-shaped page: grid planning, JSON-LD profile, priced offers", () => {
  const planning = normalizePlanningDocument({ html: RAMONVILLE_PLANNING, gymId: "balma" });
  assert.equal(planning.season, "2026/2027");
  assert.deepEqual(planning.notes, ["Planning aménagé fin juillet–mi-août"]);
  assert.ok(planning.sessions.some((session) => session.day === "samedi" && session.audience === "7-12 ans"));

  const profile = normalizeProfileDocument({ html: defaultPages()["https://www.boxingcenter.fr/salles/ramonville"].body, gymId: "balma", knownDisciplines: ["Boxe anglaise", "MMA", "Cross training", "Hyrox"] });
  assert.equal(profile.hasStructuredData, true);
  assert.deepEqual(profile.disciplines, ["Boxe anglaise", "MMA", "Cross training"]);

  const offers = normalizeOffersDocument({ html: defaultPages()["https://boutique.boxingcenter.fr/offre/29"].body });
  assert.deepEqual(offers.offers.map((offer) => [offer.name, offer.priceText, offer.period?.id]), [
    ["Abonnement découverte", "29,99 €", "par_4_semaines"],
    ["Abonnement annuel", "259 €", "annuel"],
  ]);
  assert.equal(offers.offers[0].commitment.id, "sans_engagement");
});
