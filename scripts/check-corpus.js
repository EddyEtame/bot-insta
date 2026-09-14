"use strict";

require("dotenv").config();

const { ageInDays } = require("../src/calendar");
const { loadConfig } = require("../src/config");
const { loadGymRegistry } = require("../src/gyms");
const { loadForbiddenClaims, negativeSaleOpening, violatedClaims } = require("../src/guards");
const { loadKnowledgeBase } = require("../src/knowledge");
const { createStore } = require("../src/sync/store");

const REQUIRED_FACT_TYPES = new Set(["planning", "offer"]);

/**
 * Build controls. Every mistake that has already cost something becomes a check here,
 * so it can only happen once: unverifiable facts, absence-led sales copy, forbidden
 * claims, contradictions between two sources, and a corpus that has gone stale.
 */
function checkCorpus({ config, now = new Date(), strict = false }) {
  const registry = loadGymRegistry(config);
  const knowledge = loadKnowledgeBase(config, { registry });
  const claims = loadForbiddenClaims(config);
  const store = createStore(config);
  const failures = [];
  const warnings = [];

  for (const message of registry.errors) failures.push(`REGISTRE : ${message}`);
  for (const loadError of knowledge.loadErrors) failures.push(`SOURCE ILLISIBLE : ${loadError.file} — ${loadError.message}`);
  if (!claims.length) warnings.push("FAIT_FAUX : aucun contrôle de vérité chargé (knowledge/rules/forbidden-claims.json)");
  if (!knowledge.persona) failures.push("PERSONA : knowledge/rules/persona.md est vide ou absent");

  const seenIds = new Map();
  const factValues = new Map();

  for (const document of knowledge.documents) {
    const label = `${document.id} (${document.sourceFile})`;
    if (seenIds.has(document.id)) failures.push(`ID EN DOUBLE : ${document.id} — ${seenIds.get(document.id)} et ${document.sourceFile}`);
    seenIds.set(document.id, document.sourceFile);

    if (document.visibility === "public") {
      if (!document.sourceUrl && !document.generated) warnings.push(`PROVENANCE : ${label} n'indique aucune source`);
      if (document.generated && !document.checkedAt) failures.push(`FRAÎCHEUR : ${label} est généré sans date de vérification`);
      if (REQUIRED_FACT_TYPES.has(document.docType) && !document.facts.length) {
        failures.push(`FAITS : ${label} publie du ${document.docType} sans aucun fait clé`);
      }
      if (document.docType && document.docType !== "offer" && document.gyms.length === 0 && document.id.startsWith("bc-") && !document.id.includes("club")) {
        warnings.push(`PORTÉE : ${label} n'est rattaché à aucune salle`);
      }
      if (negativeSaleOpening(document.content)) {
        failures.push(`VENTE_NEGATIVE : ${label} ouvre sur une absence — « ${document.content.split("\n")[0].slice(0, 80)} »`);
      }
      const violations = violatedClaims(document.content, document.content, claims.filter((claim) => claim.kind === "forbidden"));
      for (const violation of violations) failures.push(`FAIT_FAUX : ${label} contient « ${violation.id} » — ${violation.why}`);

      const freshness = knowledge.stalenessOf(document, now);
      if (freshness.stale) {
        const message = `PÉRIMÉ : ${label} vérifié il y a ${Math.round(freshness.ageDays)} j (budget ${freshness.maxAgeDays} j)`;
        if (strict) failures.push(message);
        else warnings.push(message);
      }
    }

    for (const fact of document.facts) {
      if (!factValues.has(fact.key)) factValues.set(fact.key, new Map());
      factValues.get(fact.key).set(String(fact.value), document.id);
    }
  }

  // One page, one source of prices. A page legitimately lists several tariffs, but two
  // different documents pricing the same page means one of them is a copy going stale —
  // exactly how a bot ends up quoting last season's price.
  const pricedDocumentsByUrl = new Map();
  for (const document of knowledge.documents) {
    if (document.visibility !== "public" || !document.sourceUrl) continue;
    const prices = document.facts
      .filter((fact) => /price|prix|tarif/i.test(fact.key) && /\d\s*€/.test(String(fact.value)))
      .map((fact) => String(fact.value));
    if (!prices.length) continue;
    if (!pricedDocumentsByUrl.has(document.sourceUrl)) pricedDocumentsByUrl.set(document.sourceUrl, new Map());
    pricedDocumentsByUrl.get(document.sourceUrl).set(document.id, prices);
  }
  for (const [url, documents] of pricedDocumentsByUrl) {
    if (documents.size > 1) {
      const detail = [...documents.entries()].map(([id, prices]) => `${id} (${prices.join(", ")})`).join(" et ");
      failures.push(`PRIX DIVERGENT : ${url} est tarifé par deux sources — ${detail}`);
    }
  }

  for (const [key, values] of factValues) {
    if (values.size > 1) {
      failures.push(`CONTRADICTION : « ${key} » vaut ${[...values.entries()].map(([value, id]) => `« ${value} » (${id})`).join(" et ")}`);
    }
  }

  const coverage = knowledge.coverage();
  for (const gym of coverage) {
    if (!gym.hasPlanning) warnings.push(`COUVERTURE : aucun planning publié pour ${gym.displayName}`);
    if (!gym.hasProfile) warnings.push(`COUVERTURE : aucune fiche pratique publiée pour ${gym.displayName}`);
  }

  const report = store.readReport();
  if (!report) {
    warnings.push("RELEVÉ : aucun relevé hebdomadaire enregistré (npm run knowledge:sync)");
  } else {
    const age = ageInDays(report.finishedAt, now);
    if (age !== null && age > 8) {
      const message = `RELEVÉ : dernier relevé il y a ${Math.round(age)} j — le dimanche n'est pas passé`;
      if (strict) failures.push(message);
      else warnings.push(message);
    }
  }

  return { failures, warnings, coverage, status: knowledge.getStatus(now) };
}

if (require.main === module) {
  const strict = process.argv.includes("--strict");
  const result = checkCorpus({ config: loadConfig(), strict });
  for (const warning of result.warnings) console.warn(`avertissement · ${warning}`);
  for (const failure of result.failures) console.error(`ÉCHEC · ${failure}`);
  console.log(`${result.status.sourceCount} source(s), ${result.status.publicSourceCount} publique(s), ${result.status.gymsWithPlanning}/${result.status.gymCount} salle(s) avec planning, ${result.failures.length} échec(s), ${result.warnings.length} avertissement(s).`);
  if (result.failures.length) process.exitCode = 1;
}

module.exports = { checkCorpus };
