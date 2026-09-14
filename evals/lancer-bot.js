"use strict";

require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const { createAiService, parseModelResponse } = require("../src/ai");
const { loadConfig } = require("../src/config");
const { ACTIONS, createDecisionEngine } = require("../src/decision-engine");
const { loadForbiddenClaims } = require("../src/guards");
const { loadGymRegistry } = require("../src/gyms");
const { loadKnowledgeBase } = require("../src/knowledge");
const { validateResponse } = require("../src/response-validator");
const { createHttpClient } = require("../src/sync/http");
const { createPipeline } = require("../src/sync/pipeline");
const { createRobotsGate } = require("../src/sync/robots");
const { createStore } = require("../src/sync/store");
const { createFakeFetch } = require("../test/fixtures/site");
const { createWorkspace } = require("../test/fixtures/workspace");

const CASES = JSON.parse(fs.readFileSync(path.join(__dirname, "cas-bot.json"), "utf8"));
const NOW = new Date("2026-09-14T09:00:00Z");

/** A bench that drifts lies better than it measures: everything here is the real code path. */
async function buildBench() {
  const workspace = createWorkspace();
  const registry = loadGymRegistry(workspace.config);
  const http = createHttpClient({ config: workspace.config, allowlist: registry.hostAllowlist, fetchImpl: createFakeFetch(), sleep: async () => {} });
  const robots = createRobotsGate({ http, userAgent: workspace.config.sync.userAgent });
  const store = createStore(workspace.config);
  await createPipeline({ config: workspace.config, registry, http, robots, store }).run({ now: new Date("2026-09-13T04:30:00Z") });
  const knowledge = loadKnowledgeBase(workspace.config, { registry });
  return {
    workspace,
    registry,
    knowledge,
    claims: loadForbiddenClaims(workspace.config),
    engine: createDecisionEngine({ registry }),
  };
}

/**
 * D0 — costs no API call and fails the second the prompt, the registry and the code
 * stop describing the same world.
 */
function antiDriftChecks({ registry, knowledge, claims }) {
  const findings = [];
  for (const gym of registry.gyms) {
    for (const alias of gym.aliases) {
      const detected = registry.detect(alias);
      if (!detected.includes(gym.id)) findings.push(`D0 alias : « ${alias} » ne ramène pas ${gym.id}`);
      if (detected.length > 1) findings.push(`D0 alias : « ${alias} » est ambigu (${detected.join(", ")})`);
    }
    for (const source of gym.sources) {
      if (!["planning", "profile", "offer"].includes(source.docType)) findings.push(`D0 registre : docType inconnu ${source.docType} (${source.id})`);
      if (source.kind === "url" && !source.url && !source.candidates.length) findings.push(`D0 registre : ${source.id} n'a ni URL ni candidat`);
    }
  }
  if (!claims.length) findings.push("D0 vérité : aucun contrôle FAIT_FAUX chargé");
  for (const claim of claims) {
    if (claim.kind === "forbidden" && claim.regexp.test(knowledge.persona)) {
      findings.push(`D0 vérité : la persona contient elle-même « ${claim.id} »`);
    }
  }
  if (!parseModelResponse('{"reply":"ok","sourceIds":["a"]}')) findings.push("D0 contrat : le format de sortie du prompt n'est plus lisible par le harnais");
  if (parseModelResponse("désolé, pas de JSON")) findings.push("D0 contrat : une sortie non conforme est acceptée");
  return findings;
}

function evaluateCase(bench, testCase, { live = false, ai = null } = {}) {
  const retrieval = bench.knowledge.retrieve(testCase.message, { now: NOW });
  const decision = bench.engine.decide({ text: testCase.message, retrieval });
  const expected = testCase.attendu || {};
  const problems = [];

  if (expected.action && decision.action !== expected.action) {
    problems.push(`action ${decision.action} au lieu de ${expected.action}`);
  }
  if (expected.noModelCall && decision.action === ACTIONS.ANSWER) problems.push("le modèle aurait été appelé");
  for (const sourceId of expected.sources || []) {
    if (!retrieval.sources.includes(sourceId)) problems.push(`source manquante : ${sourceId} (obtenu : ${retrieval.sources.join(", ") || "aucune"})`);
  }
  if (expected.noSourceFrom && retrieval.sources.some((id) => id.includes(expected.noSourceFrom))) {
    problems.push(`source d'une autre salle utilisée : ${expected.noSourceFrom}`);
  }
  if (expected.evidenceMatches && !retrieval.chunks.some((chunk) => chunk.content.includes(expected.evidenceMatches))) {
    problems.push(`preuve sans « ${expected.evidenceMatches} »`);
  }
  if (expected.replyMatches && !new RegExp(expected.replyMatches, "i").test(decision.reply || "")) {
    problems.push(`réponse sans « ${expected.replyMatches} »`);
  }
  if (expected.replyNotMatches && new RegExp(expected.replyNotMatches).test(decision.reply || "")) {
    problems.push(`la réponse contient « ${expected.replyNotMatches} », qui ne devait pas sortir`);
  }

  const canned = testCase.modelReply;
  if (canned || expected.validationFails) {
    const validation = validateResponse({ reply: canned?.reply, sourceIds: canned?.sourceIds, decision: { ...decision, action: ACTIONS.ANSWER }, retrieval, claims: bench.claims });
    if (expected.validationFails) {
      if (validation.valid) problems.push(`la réponse aurait dû être refusée (${expected.validationFails})`);
      else if (!validation.reason.includes(expected.validationFails)) problems.push(`refus pour « ${validation.reason} » au lieu de « ${expected.validationFails} »`);
    } else if (!validation.valid) {
      problems.push(`réponse refusée : ${validation.reason}`);
    }
  }

  return { id: testCase.id, famille: testCase.famille, problems, decision, retrieval, live: live && ai ? true : false };
}

async function evaluateLive(bench, testCase, result, ai) {
  if (result.decision.action !== ACTIONS.ANSWER) return result;
  const composed = await ai.generateResponse({
    userMessage: testCase.message,
    history: [],
    retrieval: result.retrieval,
    decision: result.decision,
    persona: bench.knowledge.persona,
  });
  if (!composed) {
    result.problems.push("le modèle n'a pas renvoyé le JSON attendu");
    return result;
  }
  const validation = validateResponse({ reply: composed.reply, sourceIds: composed.sourceIds, decision: result.decision, retrieval: result.retrieval, claims: bench.claims });
  if (!validation.valid) result.problems.push(`sortie modèle refusée : ${validation.reason}`);
  result.reply = composed.reply;
  return result;
}

async function main() {
  const only = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
  const live = process.argv.includes("--live");
  const bench = await buildBench();
  try {
    const drift = antiDriftChecks(bench);
    for (const finding of drift) console.error(`✗ ${finding}`);

    const config = loadConfig();
    const ai = live && config.openaiApiKey ? createAiService(config, null, { registry: bench.registry }) : null;
    if (live && !ai) console.error("--live demandé mais OPENAI_API_KEY est absent : passage en mode déterministe.");

    const cases = CASES.cases.filter((testCase) => !only.length || only.includes(testCase.id) || only.includes(testCase.famille));
    const results = [];
    for (const testCase of cases) {
      let result = evaluateCase(bench, testCase, { live, ai });
      if (ai) result = await evaluateLive(bench, testCase, result, ai);
      results.push(result);
      const status = result.problems.length ? "✗" : "✓";
      console.log(`${status} ${result.id} [${result.famille}] ${testCase.message}`);
      for (const problem of result.problems) console.log(`    ${problem}`);
      if (result.reply) console.log(`    → ${result.reply}`);
    }

    const passed = results.filter((result) => !result.problems.length).length;
    const byFamily = {};
    for (const result of results) {
      byFamily[result.famille] = byFamily[result.famille] || { pass: 0, total: 0 };
      byFamily[result.famille].total += 1;
      if (!result.problems.length) byFamily[result.famille].pass += 1;
    }
    console.log(`\n${passed}/${results.length} cas — ${Object.entries(byFamily).map(([family, score]) => `${family} ${score.pass}/${score.total}`).join(" · ")}${drift.length ? ` · D0 ${drift.length} dérive(s)` : " · D0 ok"}`);
    if (passed !== results.length || drift.length) process.exitCode = 1;
  } finally {
    bench.workspace.cleanup();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { antiDriftChecks, buildBench, evaluateCase };
