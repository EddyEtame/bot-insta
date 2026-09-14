"use strict";

function buildEscalationPayload({ incoming, session, decision, retrieval }) {
  return {
    sessionId: session.id,
    platform: incoming.platform,
    instagramAccountRef: incoming.accountId,
    instagramUserRef: incoming.senderId,
    latestUserMessage: incoming.text,
    recentHistory: session.history.slice(-8),
    topic: decision.category,
    action: decision.action,
    reason: decision.reason,
    confidenceSignal: decision.confidence,
    retrievedSources: retrieval.chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      sourceFile: chunk.sourceFile,
      sourceUrl: chunk.sourceUrl,
    })),
    knowledgeConflicts: retrieval.conflicts,
    timestamp: new Date().toISOString(),
  };
}

async function escalate(config, payload, fetchImpl = fetch) {
  if (!config.escalationWebhookUrl) return { delivered: false, destination: "local-log" };
  const response = await fetchImpl(config.escalationWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Escalation webhook returned ${response.status}`);
  return { delivered: true, destination: "webhook" };
}

module.exports = { buildEscalationPayload, escalate };
