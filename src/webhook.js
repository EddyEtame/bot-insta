"use strict";

const crypto = require("node:crypto");
const { FALLBACK_REPLY } = require("./ai");
const { ACTIONS } = require("./decision-engine");
const { buildEscalationPayload } = require("./escalation");
const { error, log, mask } = require("./logger");

function verifySignature(rawBody, signature, appSecret) {
  if (!rawBody || !signature || !appSecret || !signature.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}

function createSessionId({ platform, accountId, senderId }) {
  const identity = `${platform}:${accountId}:${senderId}`;
  return `${platform}-${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
}

function extractMessages(payload) {
  const messages = [];
  for (const entry of payload?.entry || []) {
    for (const event of entry.messaging || []) {
      const text = String(event?.message?.text || "").trim();
      const accountId = event?.recipient?.id || entry?.id;
      const messageId = event?.message?.mid;
      if (event?.message?.is_echo || !event?.sender?.id || !accountId || !messageId || !text) continue;
      const timestamp = Number(event.timestamp);
      messages.push({
        platform: "instagram",
        accountId: String(accountId),
        senderId: String(event.sender.id),
        messageId: String(messageId),
        text,
        timestamp: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString(),
      });
    }
  }
  return messages;
}

/** Accepts either a ProcessedMessageLog or a plain Set, and answers a delivery once. */
function addProcessedId(processedMessages, messageId) {
  if (typeof processedMessages.add === "function" && typeof processedMessages.has === "function" && !(processedMessages instanceof Set)) {
    return processedMessages.add(messageId) !== false;
  }
  if (processedMessages.has(messageId)) return false;
  processedMessages.add(messageId);
  if (processedMessages.size > 1_000) processedMessages.delete(processedMessages.values().next().value);
  return true;
}

function fallbackDecision(decision, reason) {
  return {
    ...decision,
    action: ACTIONS.ESCALATE,
    reply: decision.language === "en" ? "I’m sorry, I can’t answer that safely right now. I’m passing your request to the team." : FALLBACK_REPLY,
    reason,
  };
}

function createMessageProcessor({
  config,
  sessions,
  ai,
  instagram,
  escalation,
  knowledge,
  decisionEngine,
  responseValidator,
  rateLimiter,
  claims = [],
  processedMessageIds = new Set(),
}) {
  return async function processWebhookPayload(payload) {
    for (const incoming of extractMessages(payload)) {
      if (!addProcessedId(processedMessageIds, incoming.messageId)) {
        log("message.duplicate_ignored", { messageId: mask(incoming.messageId) });
        continue;
      }

      const identity = { platform: incoming.platform, accountId: incoming.accountId, senderId: incoming.senderId };
      const sessionId = createSessionId(identity);
      const retrieval = knowledge.retrieve(incoming.text);
      const requestedGyms = retrieval.analysis?.gymIds || [];
      let decision = decisionEngine.decide({
        text: incoming.text,
        retrieval,
        rateLimited: !rateLimiter.consume(sessionId),
      });
      log("message.classified", {
        sender: mask(incoming.senderId),
        session: mask(sessionId),
        category: decision.category,
        action: decision.action,
        sources: retrieval.sources,
        gyms: requestedGyms,
        conflictCount: retrieval.conflicts.length,
        staleCount: retrieval.staleSources?.length || 0,
      });

      if ([ACTIONS.IGNORE, ACTIONS.NO_RESPONSE].includes(decision.action)) continue;

      const previousSession = sessions.get(sessionId, identity);
      sessions.add(sessionId, { role: "user", content: incoming.text }, identity);
      let reply = decision.reply;
      let sourceIds = [];

      if (decision.action === ACTIONS.ANSWER) {
        try {
          log("ai.request.started", { sender: mask(incoming.senderId), sourceCount: retrieval.sources.length });
          const aiResult = await ai.generateResponse({
            userMessage: incoming.text,
            history: previousSession.history,
            retrieval,
            decision,
            persona: knowledge.persona,
          });
          reply = aiResult?.reply;
          sourceIds = aiResult?.sourceIds || [];
          log("ai.response.received", { sender: mask(incoming.senderId), sourceIds });
        } catch (err) {
          error("ai.request.failed", err, { sender: mask(incoming.senderId) });
          decision = fallbackDecision(decision, "AI provider failure");
          reply = decision.reply;
        }
      }

      const validation = responseValidator({ reply, sourceIds, decision, retrieval, claims });
      if (!validation.valid) {
        log("response.rejected", { sender: mask(incoming.senderId), reason: validation.reason });
        decision = fallbackDecision(decision, `Response validation failed: ${validation.reason}`);
        reply = decision.reply;
        sourceIds = [];
      } else {
        reply = validation.text;
        sourceIds = validation.sourceIds;
      }

      sessions.add(sessionId, { role: "assistant", content: reply }, identity);
      const currentSession = sessions.get(sessionId, identity);
      if (decision.action === ACTIONS.ESCALATE) {
        const escalationPayload = buildEscalationPayload({ incoming, session: currentSession, decision, retrieval });
        try {
          const result = await escalation(config, escalationPayload);
          log("escalation.triggered", { sender: mask(incoming.senderId), destination: result.destination, topic: decision.category });
        } catch (err) {
          error("escalation.failed", err, { sender: mask(incoming.senderId) });
        }
      }

      try {
        log("instagram.reply.attempted", { sender: mask(incoming.senderId), action: decision.action, sourceIds });
        await instagram(config, incoming.senderId, reply);
        log("instagram.reply.sent", { sender: mask(incoming.senderId) });
      } catch (err) {
        error("instagram.reply.failed", err, { sender: mask(incoming.senderId) });
      }
    }
  };
}

module.exports = { addProcessedId, createMessageProcessor, createSessionId, extractMessages, verifySignature };
