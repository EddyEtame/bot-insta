"use strict";

const express = require("express");

const { createAiService } = require("./ai");
const { requiredValues } = require("./config");
const { createDecisionEngine } = require("./decision-engine");
const { escalate } = require("./escalation");
const { sendInstagramText } = require("./instagram");
const { KnowledgeStore } = require("./knowledge-store");
const { InMemoryRateLimiter } = require("./rate-limiter");
const { validateResponse } = require("./response-validator");
const { createProcessedMessageLog, createSessionStore } = require("./session-store");
const { createSyncService } = require("./sync/service");
const { createWeeklyScheduler } = require("./sync/scheduler");
const { createMessageProcessor, verifySignature } = require("./webhook");
const { error, log } = require("./logger");

function createApp(config, dependencies = {}) {
  const app = express();
  const knowledgeStore = dependencies.knowledgeStore
    || new KnowledgeStore(config, { knowledge: dependencies.knowledge, registry: dependencies.registry });
  const sessions = dependencies.sessions || createSessionStore(config);
  const processedMessageIds = dependencies.processedMessageIds || createProcessedMessageLog(config);
  const ai = dependencies.ai || createAiService(config, null, { registry: knowledgeStore.registry });

  const sync = dependencies.sync || createSyncService(config, {
    logger: { log, error },
    onComplete: (report) => {
      // A fresh corpus must reach the next DM without a restart.
      const status = knowledgeStore.reload();
      log("knowledge.reloaded", { sourceCount: status.sourceCount, staleSourceCount: status.staleSourceCount, changes: report.changes.length });
    },
  });

  const processor = dependencies.processor || createMessageProcessor({
    config,
    sessions,
    ai,
    instagram: dependencies.instagram || sendInstagramText,
    escalation: dependencies.escalation || escalate,
    knowledge: knowledgeStore,
    decisionEngine: dependencies.decisionEngine || createDecisionEngine({ registry: knowledgeStore.registry }),
    responseValidator: dependencies.responseValidator || validateResponse,
    rateLimiter: dependencies.rateLimiter || new InMemoryRateLimiter({ limit: config.maxMessagesPerMinute }),
    claims: knowledgeStore.claims,
    processedMessageIds,
  });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb", verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); } }));

  app.get("/health", (req, res) => {
    const missing = requiredValues(config);
    const knowledgeStatus = knowledgeStore.getStatus();
    const lastSync = sync.store.readReport();
    const knowledgeReady = knowledgeStatus.publicSourceCount > 0 && knowledgeStatus.loadErrors === 0;
    const status = !missing.length && knowledgeReady ? "ok" : "configuration_required";
    res.status(status === "ok" ? 200 : 503).json({
      status,
      missing,
      knowledge: {
        sourceCount: knowledgeStatus.sourceCount,
        publicSourceCount: knowledgeStatus.publicSourceCount,
        loadErrors: knowledgeStatus.loadErrors,
        registryErrors: knowledgeStatus.registryErrors,
        gymCount: knowledgeStatus.gymCount,
        gymsWithPlanning: knowledgeStatus.gymsWithPlanning,
        gymsWithProfile: knowledgeStatus.gymsWithProfile,
        staleSourceCount: knowledgeStatus.staleSourceCount,
        staleSourceIds: knowledgeStatus.staleSourceIds,
        oldestCheckedAt: knowledgeStatus.oldestCheckedAt,
        reloadedAt: knowledgeStatus.reloadedAt,
      },
      coverage: knowledgeStore.coverage(),
      sync: {
        enabled: config.sync.enabled,
        timeZone: config.sync.timeZone,
        nextRunAt: app.locals.scheduler?.nextRunAt?.toISOString() || null,
        lastRunAt: lastSync?.finishedAt || null,
        lastRunOk: lastSync?.ok ?? null,
        lastRunStats: lastSync?.stats || null,
      },
    });
  });

  app.get("/webhooks/instagram", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token && token === config.metaVerifyToken) {
      log("webhook.verified");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  });

  app.post("/webhooks/instagram", (req, res) => {
    const signature = req.get("x-hub-signature-256");
    if (!verifySignature(req.rawBody, signature, config.metaAppSecret)) {
      log("webhook.signature_rejected");
      return res.sendStatus(401);
    }
    if (!req.body || !Array.isArray(req.body.entry) || !["instagram", "page"].includes(req.body.object)) {
      return res.sendStatus(400);
    }
    res.sendStatus(200);
    Promise.resolve(processor(req.body)).catch((err) => error("webhook.processing_failed", err));
  });

  app.use((err, req, res, next) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON payload" });
    error("http.unhandled_error", err);
    return res.status(500).json({ error: "Internal server error" });
  });

  app.locals.knowledgeStore = knowledgeStore;
  app.locals.sessions = sessions;
  app.locals.sync = sync;

  /** Started by the server, not by createApp, so tests never arm a timer. */
  app.startWeeklySync = () => {
    if (!config.sync.enabled) {
      log("sync.disabled", { hint: "set KNOWLEDGE_SYNC_ENABLED=true to poll every Sunday" });
      return null;
    }
    const scheduler = createWeeklyScheduler({
      config,
      logger: { log, error },
      run: async ({ now, trigger }) => {
        log("sync.started", { trigger });
        const report = await sync.run({ now });
        if (!report.skipped) {
          await sync.notify(report).catch((err) => error("sync.notify_failed", err));
        }
        return report;
      },
    });
    app.locals.scheduler = scheduler.start({ lastRunAt: sync.store.readReport()?.finishedAt || null });
    return scheduler;
  };

  return app;
}

module.exports = { createApp };
