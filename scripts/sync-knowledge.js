"use strict";

require("dotenv").config();

const { loadConfig } = require("../src/config");
const { error, log } = require("../src/logger");
const { createSyncService } = require("../src/sync/service");

function parseArguments(argv) {
  const options = { dryRun: false, force: false, strict: false, notify: false, only: [], json: false };
  for (const argument of argv) {
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--force") options.force = true;
    else if (argument === "--strict") options.strict = true;
    else if (argument === "--notify") options.notify = true;
    else if (argument === "--json") options.json = true;
    else if (argument.startsWith("--gym=")) options.only.push(argument.slice("--gym=".length));
    else if (argument.startsWith("--source=")) options.only.push(argument.slice("--source=".length));
    else if (argument.startsWith("--")) throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const config = loadConfig();
  const sync = createSyncService(config, { logger: { log, error } });
  const report = await sync.run({ dryRun: options.dryRun, only: options.only, force: options.force });

  if (report.skipped) {
    console.error(`Sync ignoré : ${report.reason}`);
    process.exitCode = 1;
    return;
  }
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else console.log(sync.summarizeReport(report));

  if (options.notify) {
    const delivery = await sync.notify(report).catch((err) => {
      error("sync.notify_failed", err);
      return { delivered: false };
    });
    console.error(delivery.delivered ? "Rapport envoyé au webhook privé." : "Aucun webhook de rapport configuré.");
  }

  const hardFailure = report.stats.failed > 0 || report.stats.blocked > 0 || report.registryErrors.length > 0;
  const softFailure = options.strict && (report.stats.unresolved > 0 || report.stats.empty > 0);
  if (hardFailure || softFailure) process.exitCode = 1;
}

// Guarded so importing this file (a test, a tool, an editor) never starts crawling.
if (require.main === module) {
  main().catch((err) => {
    error("sync.crashed", err);
    process.exitCode = 1;
  });
}

module.exports = { main, parseArguments };
