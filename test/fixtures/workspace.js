"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { loadConfig } = require("../../src/config");

const PROJECT_KNOWLEDGE = path.resolve(__dirname, "..", "..", "knowledge");

/** A throwaway knowledge base seeded with the real registry, persona and truth rules. */
function createWorkspace(env = {}) {
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
