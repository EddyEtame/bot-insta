"use strict";

const express = require("express");
const { createAiService } = require("./ai");
const { requiredValues } = require("./config");
const { createDecisionEngine } = require("./decision-engine");
const { escalate } = require("./escalation");
const { sendInstagramText } = require("./instagram");
const { loadKnowledgeBase } = require("./knowledge");
const { InMemoryRateLimiter } = require("./rate-limiter");
const { validateResponse } = require("./response-validator");
const { InMemorySessionStore } = require("./session-store");
const { createMessageProcessor, verifySignature } = require("./webhook");
const { error, log } = require("./logger");

function createApp(config, dependencies = {}) {
  const app = express();
  const knowledge = dependencies.knowledge || loadKnowledgeBase(config);
  const sessions = dependencies.sessions || new InMemorySessionStore({ ttlMs: config.sessionTtlMs });
  const ai = dependencies.ai || createAiService(config);
  const processor = dependencies.processor || createMessageProcessor({
    config,
    sessions,
    ai,
    instagram: dependencies.instagram || sendInstagramText,
    escalation: dependencies.escalation || escalate,
    knowledge,
    decisionEngine: dependencies.decisionEngine || createDecisionEngine(),
    responseValidator: dependencies.responseValidator || validateResponse,
    rateLimiter: dependencies.rateLimiter || new InMemoryRateLimiter({ limit: config.maxMessagesPerMinute }),
  });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb", verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); } }));

  app.get("/health", (req, res) => {
    const missing = requiredValues(config);
    const knowledgeStatus = knowledge.getStatus();
    const knowledgeReady = knowledgeStatus.publicSourceCount > 0 && knowledgeStatus.loadErrors === 0;
    const status = !missing.length && knowledgeReady ? "ok" : "configuration_required";
    res.status(status === "ok" ? 200 : 503).json({
      status,
      missing,
      knowledge: {
        sourceCount: knowledgeStatus.sourceCount,
        publicSourceCount: knowledgeStatus.publicSourceCount,
        loadErrors: knowledgeStatus.loadErrors,
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
  return app;
}

module.exports = { createApp };
