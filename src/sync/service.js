"use strict";

const { isoDate } = require("../calendar");
const { loadGymRegistry } = require("../gyms");
const { createHttpClient } = require("./http");
const { createPipeline, STATUS } = require("./pipeline");
const { createRobotsGate } = require("./robots");
const { createStore } = require("./store");

function describeChange(change) {
  const detail = change.detail || {};
  if (change.docType === "planning") {
    const parts = [];
    if (detail.added?.length) parts.push(`+${detail.added.length} créneau(x)`);
    if (detail.removed?.length) parts.push(`-${detail.removed.length} créneau(x)`);
    if (detail.notesChanged) parts.push("note de planning modifiée");
    return `${change.sourceId} : ${parts.join(", ") || "contenu modifié"}`;
  }
  if (change.docType === "offer") {
    const parts = [];
    if (detail.added?.length) parts.push(`${detail.added.length} offre(s) ajoutée(s)`);
    if (detail.removed?.length) parts.push(`${detail.removed.length} offre(s) retirée(s)`);
    for (const repriced of detail.repriced || []) parts.push(`${repriced.id} : ${repriced.from} € → ${repriced.to} €`);
    return `${change.sourceId} : ${parts.join(", ") || "contenu modifié"}`;
  }
  return `${change.sourceId} : ${(detail.fields || []).join(", ") || "contenu modifié"}`;
}

/** The weekly note Eddy actually reads: what moved, what is missing, what broke. */
function summarizeReport(report) {
  const lines = [`Relevé Boxing Center du ${isoDate(report.startedAt)} — ${report.stats.updated} mis à jour, ${report.stats.unchanged} inchangés, ${report.stats.failed} en échec, ${report.stats.unresolved} sans URL.`];
  if (report.changes.length) {
    lines.push("", "Changements :");
    for (const change of report.changes) lines.push(`- ${describeChange(change)}`);
  }
  const unresolved = report.sources.filter((source) => source.status === STATUS.UNRESOLVED);
  if (unresolved.length) {
    lines.push("", "À renseigner dans knowledge/registry/gyms.json :");
    for (const source of unresolved) lines.push(`- ${source.sourceId}`);
  }
  const failed = report.sources.filter((source) => [STATUS.FAILED, STATUS.BLOCKED, STATUS.EMPTY].includes(source.status));
  if (failed.length) {
    lines.push("", "Échecs :");
    for (const source of failed) lines.push(`- ${source.sourceId} : ${source.error}`);
  }
  return lines.join("\n");
}

function createSyncService(config, { fetchImpl = fetch, logger = { log() {}, error() {} }, onComplete = null } = {}) {
  const store = createStore(config);

  function build() {
    const registry = loadGymRegistry(config);
    const http = createHttpClient({ config, allowlist: registry.hostAllowlist, fetchImpl });
    const robots = createRobotsGate({ http, userAgent: config.sync.userAgent });
    return { registry, pipeline: createPipeline({ config, registry, http, robots, store, logger }) };
  }

  async function run({ now = new Date(), dryRun = false, only = [], force = false } = {}) {
    const lock = dryRun ? { release() {} } : store.acquireLock();
    if (!lock) {
      logger.log("sync.skipped", { reason: "another sync holds the lock" });
      return { skipped: true, reason: "another sync holds the lock" };
    }
    try {
      // Rebuilt per run so an edit to the registry takes effect without a restart.
      const { pipeline } = build();
      const report = await pipeline.run({ now, dryRun, only, force });
      logger.log("sync.finished", { ok: report.ok, ...report.stats, changes: report.changes.length });
      if (onComplete) await onComplete(report);
      return report;
    } finally {
      lock.release();
    }
  }

  /** Posts the weekly note to the private owner webhook, when one is configured. */
  async function notify(report, { fetchImpl: post = fetchImpl } = {}) {
    if (!config.escalationWebhookUrl) return { delivered: false, destination: "local-log" };
    const response = await post(config.escalationWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "knowledge_sync",
        at: report.finishedAt || new Date().toISOString(),
        ok: report.ok,
        stats: report.stats,
        changes: report.changes,
        summary: summarizeReport(report),
      }),
    });
    if (!response.ok) throw new Error(`Sync notification webhook returned ${response.status}`);
    return { delivered: true, destination: "webhook" };
  }

  return { build, notify, run, store, summarizeReport };
}

module.exports = { createSyncService, describeChange, summarizeReport };
