"use strict";

const path = require("node:path");

function resolveProjectPath(value, appRoot) {
  return path.isAbsolute(value) ? value : path.resolve(appRoot, value);
}

function requiredValues(config) {
  return [
    ["META_VERIFY_TOKEN", config.metaVerifyToken],
    ["META_APP_SECRET", config.metaAppSecret],
    ["META_API_VERSION", config.metaApiVersion],
    ["INSTAGRAM_ACCESS_TOKEN", config.instagramAccessToken],
    ["OPENAI_API_KEY", config.openaiApiKey],
  ].filter(([, value]) => !value).map(([name]) => name);
}

function loadConfig(env = process.env) {
  const appRoot = path.resolve(__dirname, "..");
  const mode = String(env.INSTAGRAM_API_MODE || "instagram_login").trim();
  if (!["instagram_login", "facebook_login"].includes(mode)) {
    throw new Error("INSTAGRAM_API_MODE must be instagram_login or facebook_login.");
  }

  const config = {
    appRoot,
    port: Number(env.PORT || 3000),
    metaVerifyToken: String(env.META_VERIFY_TOKEN || "").trim(),
    metaAppSecret: String(env.META_APP_SECRET || "").trim(),
    metaApiVersion: String(env.META_API_VERSION || "").trim(),
    instagramApiMode: mode,
    instagramAccountId: String(env.INSTAGRAM_ACCOUNT_ID || "").trim(),
    instagramAccessToken: String(env.INSTAGRAM_ACCESS_TOKEN || "").trim(),
    openaiApiKey: String(env.OPENAI_API_KEY || "").trim(),
    openaiModel: String(env.OPENAI_MODEL || "gpt-5-mini").trim(),
    knowledgeBasePath: resolveProjectPath(String(env.KNOWLEDGE_BASE_PATH || "./knowledge").trim(), appRoot),
    escalationWebhookUrl: String(env.ESCALATION_WEBHOOK_URL || "").trim(),
    sessionTtlMs: Number(env.SESSION_TTL_HOURS || 24) * 60 * 60 * 1000,
    maxMessagesPerMinute: Number(env.MAX_MESSAGES_PER_MINUTE || 8),
  };

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }
  if (!Number.isFinite(config.sessionTtlMs) || config.sessionTtlMs <= 0) {
    throw new Error("SESSION_TTL_HOURS must be a positive number.");
  }
  if (!Number.isInteger(config.maxMessagesPerMinute) || config.maxMessagesPerMinute < 1) {
    throw new Error("MAX_MESSAGES_PER_MINUTE must be a positive integer.");
  }
  if (config.instagramApiMode === "facebook_login" && !config.instagramAccountId) {
    throw new Error("INSTAGRAM_ACCOUNT_ID is required when INSTAGRAM_API_MODE=facebook_login.");
  }
  return config;
}

module.exports = { loadConfig, requiredValues };
