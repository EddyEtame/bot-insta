"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { loadConfig } = require("../src/config");
const { loadKnowledgeBase } = require("../src/knowledge");

const config = loadConfig();
const knowledge = loadKnowledgeBase(config);
const report = {
  generatedAt: new Date().toISOString(),
  ...knowledge.getStatus(),
  sources: knowledge.manifest(),
};

if (process.argv.includes("--write")) {
  const destination = path.join(config.knowledgeBasePath, "indexes", "manifest.json");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Knowledge manifest written for ${report.sourceCount} source(s).`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
