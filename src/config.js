"use strict";

const path = require("node:path");

const DAY_IDS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const DAY_ALIASES = {
  sunday: 0, dimanche: 0, monday: 1, lundi: 1, tuesday: 2, mardi: 2, wednesday: 3, mercredi: 3,
  thursday: 4, jeudi: 4, friday: 5, vendredi: 5, saturday: 6, samedi: 6,
};

function resolveProjectPath(value, appRoot) {
  return path.isAbsolute(value) ? value : path.resolve(appRoot, value);
}

function readBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on", "oui"].includes(String(value).trim().toLowerCase());
}

function readNumber(name, value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = true } = {}) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed));
  if (!valid) throw new Error(`${name} must be a number between ${min} and ${max}.`);
  return parsed;
}

/**
 * A number when one is really there, null otherwise. `Number(null)` is 0, and a 0-day
 * freshness budget silently makes every document stale — so absence must stay absence.
 */
function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readList(value) {
  return String(value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function readWeekday(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const key = String(value).trim().toLowerCase();
  if (key in DAY_ALIASES) return DAY_ALIASES[key];
  const parsed = Number(key);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) return parsed;
  throw new Error("KNOWLEDGE_SYNC_DAY must be a weekday name or 0-6 (0 = dimanche).");
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
  const sessionStoreKind = String(env.SESSION_STORE || "memory").trim().toLowerCase();
  if (!["memory", "file"].includes(sessionStoreKind)) {
    throw new Error("SESSION_STORE must be memory or file.");
  }
  const knowledgeBasePath = resolveProjectPath(String(env.KNOWLEDGE_BASE_PATH || "./knowledge").trim(), appRoot);
  const timeZone = String(env.KNOWLEDGE_SYNC_TIMEZONE || "Europe/Paris").trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new Error(`KNOWLEDGE_SYNC_TIMEZONE is not a valid IANA time zone: ${timeZone}`);
  }

  const config = {
    appRoot,
    port: readNumber("PORT", env.PORT, 3000, { min: 1, max: 65535 }),
    metaVerifyToken: String(env.META_VERIFY_TOKEN || "").trim(),
    metaAppSecret: String(env.META_APP_SECRET || "").trim(),
    metaApiVersion: String(env.META_API_VERSION || "").trim(),
    instagramApiMode: mode,
    instagramAccountId: String(env.INSTAGRAM_ACCOUNT_ID || "").trim(),
    instagramAccessToken: String(env.INSTAGRAM_ACCESS_TOKEN || "").trim(),
    openaiApiKey: String(env.OPENAI_API_KEY || "").trim(),
    openaiModel: String(env.OPENAI_MODEL || "gpt-5-mini").trim(),
    knowledgeBasePath,
    escalationWebhookUrl: String(env.ESCALATION_WEBHOOK_URL || "").trim(),
    sessionStore: sessionStoreKind,
    sessionStorePath: resolveProjectPath(String(env.SESSION_STORE_PATH || "./.data/sessions.json").trim(), appRoot),
    sessionTtlMs: readNumber("SESSION_TTL_HOURS", env.SESSION_TTL_HOURS, 24, { min: 1, max: 8_760, integer: false }) * 60 * 60 * 1000,
    maxMessagesPerMinute: readNumber("MAX_MESSAGES_PER_MINUTE", env.MAX_MESSAGES_PER_MINUTE, 8, { min: 1, max: 600 }),
    sync: {
      enabled: readBoolean(env.KNOWLEDGE_SYNC_ENABLED, false),
      weekday: readWeekday(env.KNOWLEDGE_SYNC_DAY, 0),
      hour: readNumber("KNOWLEDGE_SYNC_HOUR", env.KNOWLEDGE_SYNC_HOUR, 4, { min: 0, max: 23 }),
      minute: readNumber("KNOWLEDGE_SYNC_MINUTE", env.KNOWLEDGE_SYNC_MINUTE, 30, { min: 0, max: 59 }),
      timeZone,
      runOnStartIfStale: readBoolean(env.KNOWLEDGE_SYNC_RUN_IF_STALE, true),
      userAgent: String(env.KNOWLEDGE_SYNC_USER_AGENT || "BoxingCenterSupportBot/1.0 (+https://www.boxingcenter.fr; contact: secretariat.boxingcenter@gmail.com)").trim(),
      extraAllowedHosts: readList(env.KNOWLEDGE_SYNC_ALLOWED_HOSTS),
      requestTimeoutMs: readNumber("KNOWLEDGE_SYNC_TIMEOUT_MS", env.KNOWLEDGE_SYNC_TIMEOUT_MS, 15_000, { min: 1_000, max: 120_000 }),
      // Probing a guess must never cost as much as reading a confirmed page.
      probeTimeoutMs: readNumber("KNOWLEDGE_SYNC_PROBE_TIMEOUT_MS", env.KNOWLEDGE_SYNC_PROBE_TIMEOUT_MS, 6_000, { min: 500, max: 60_000 }),
      hostFailureLimit: readNumber("KNOWLEDGE_SYNC_HOST_FAILURE_LIMIT", env.KNOWLEDGE_SYNC_HOST_FAILURE_LIMIT, 3, { min: 1, max: 20 }),
      maxBytes: readNumber("KNOWLEDGE_SYNC_MAX_BYTES", env.KNOWLEDGE_SYNC_MAX_BYTES, 2_000_000, { min: 10_000, max: 20_000_000 }),
      maxPagesPerGym: readNumber("KNOWLEDGE_SYNC_MAX_PAGES", env.KNOWLEDGE_SYNC_MAX_PAGES, 12, { min: 1, max: 200 }),
      politenessDelayMs: readNumber("KNOWLEDGE_SYNC_DELAY_MS", env.KNOWLEDGE_SYNC_DELAY_MS, 1_200, { min: 0, max: 60_000 }),
      maxRetries: readNumber("KNOWLEDGE_SYNC_RETRIES", env.KNOWLEDGE_SYNC_RETRIES, 2, { min: 0, max: 5 }),
      keepSnapshots: readNumber("KNOWLEDGE_SYNC_KEEP_SNAPSHOTS", env.KNOWLEDGE_SYNC_KEEP_SNAPSHOTS, 6, { min: 1, max: 100 }),
      probeCooldownDays: readNumber("KNOWLEDGE_SYNC_PROBE_COOLDOWN_DAYS", env.KNOWLEDGE_SYNC_PROBE_COOLDOWN_DAYS, 14, { min: 0, max: 365 }),
      // Defaults to the exports folder inside the corpus, so a planning handed over as a
      // file is ingested with no configuration at all.
      planningExportPath: env.BC_PLANNINGS_PATH
        ? resolveProjectPath(String(env.BC_PLANNINGS_PATH).trim(), appRoot)
        : path.join(knowledgeBasePath, "exports"),
    },
    freshness: {
      planning: readNumber("KNOWLEDGE_MAX_AGE_PLANNING_DAYS", env.KNOWLEDGE_MAX_AGE_PLANNING_DAYS, 10, { min: 1, max: 365 }),
      offer: readNumber("KNOWLEDGE_MAX_AGE_OFFER_DAYS", env.KNOWLEDGE_MAX_AGE_OFFER_DAYS, 21, { min: 1, max: 365 }),
      profile: readNumber("KNOWLEDGE_MAX_AGE_PROFILE_DAYS", env.KNOWLEDGE_MAX_AGE_PROFILE_DAYS, 120, { min: 1, max: 730 }),
    },
  };

  if (config.instagramApiMode === "facebook_login" && !config.instagramAccountId) {
    throw new Error("INSTAGRAM_ACCOUNT_ID is required when INSTAGRAM_API_MODE=facebook_login.");
  }
  return config;
}

module.exports = { DAY_IDS, loadConfig, optionalNumber, readBoolean, readList, readNumber, readWeekday, requiredValues };
