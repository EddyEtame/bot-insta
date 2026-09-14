"use strict";

require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const { loadConfig } = require("../src/config");
const { loadKnowledgeBase } = require("../src/knowledge");

function buildManifest(config) {
  const knowledge = loadKnowledgeBase(config);
  return {
    generatedAt: new Date().toISOString(),
    ...knowledge.getStatus(),
    coverage: knowledge.coverage(),
    sources: knowledge.manifest(),
  };
}

function writeManifest(config, report) {
  const destination = path.join(config.knowledgeBasePath, "indexes", "manifest.json");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
  return destination;
}

if (require.main === module) {
  const config = loadConfig();
  const report = buildManifest(config);
  if (process.argv.includes("--write")) {
    writeManifest(config, report);
    console.log(`Knowledge manifest written for ${report.sourceCount} source(s).`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

module.exports = { buildManifest, writeManifest };
