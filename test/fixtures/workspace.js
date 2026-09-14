"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { loadConfig } = require("../../src/config");

const PROJECT_KNOWLEDGE = path.resolve(__dirname, "..", "..", "knowledge");

/**
 * A throwaway knowledge base seeded with the real registry, persona and truth rules.
 * `webPlanningFor` turns one club's planning back into a web source, so the fetching
 * path stays covered now that every club's season planning is handed over as a file.
 */
function createWorkspace(env = {}, { webPlanningFor = null } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bc-knowledge-"));
  for (const folder of ["registry", "rules", "source", "metadata", "normalized"]) {
    fs.mkdirSync(path.join(directory, folder), { recursive: true });
  }
  fs.copyFileSync(path.join(PROJECT_KNOWLEDGE, "registry", "gyms.json"), path.join(directory, "registry", "gyms.json"));
  fs.copyFileSync(path.join(PROJECT_KNOWLEDGE, "rules", "persona.md"), path.join(directory, "rules", "persona.md"));
  fs.copyFileSync(path.join(PROJECT_KNOWLEDGE, "rules", "forbidden-claims.json"), path.join(directory, "rules", "forbidden-claims.json"));
  fs.copyFileSync(
    path.join(PROJECT_KNOWLEDGE, "source", "boxing-center-offer-29.json"),
    path.join(directory, "source", "boxing-center-offer-29.json"),
  );
  // The real planning exports come along: the bench then measures the corpus that ships,
  // not a corpus invented for the bench.
  const exports = path.join(PROJECT_KNOWLEDGE, "exports");
  if (fs.existsSync(exports)) fs.cpSync(exports, path.join(directory, "exports"), { recursive: true });
  if (webPlanningFor) {
    const registryPath = path.join(directory, "registry", "gyms.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    for (const gym of registry.gyms) {
      if (gym.id !== webPlanningFor) continue;
      for (const source of gym.sources) {
        if (source.docType !== "planning") continue;
        Object.assign(source, {
          kind: "url",
          file: null,
          url: null,
          maxAgeDays: null,
          candidates: [`https://www.boxingcenter.fr/salles/${webPlanningFor}/planning`],
        });
      }
    }
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    fs.rmSync(path.join(directory, "exports", "plannings", `${webPlanningFor}.json`), { force: true });
  }
  const config = loadConfig({ KNOWLEDGE_BASE_PATH: directory, KNOWLEDGE_SYNC_DELAY_MS: "0", ...env });
  return {
    directory,
    config,
    cleanup() {
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

module.exports = { createWorkspace };
