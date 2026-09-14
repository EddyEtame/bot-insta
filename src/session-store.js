"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_MAX_MESSAGES = 12;
const FLUSH_DELAY_MS = 750;

class InMemorySessionStore {
  constructor({ maxMessages = DEFAULT_MAX_MESSAGES, ttlMs = 24 * 60 * 60 * 1000 } = {}) {
    this.maxMessages = maxMessages;
    this.ttlMs = ttlMs;
    this.sessions = new Map();
  }

  get(sessionId, identity = {}) {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() - session.updatedAt > this.ttlMs) {
      this.sessions.delete(sessionId);
      return { id: sessionId, identity, history: [], createdAt: new Date().toISOString(), updatedAt: Date.now() };
    }
    return { ...session, identity: { ...session.identity }, history: [...session.history] };
  }

  add(sessionId, message, identity = {}) {
    const session = this.get(sessionId, identity);
    session.identity = { ...session.identity, ...identity };
    session.history = [...session.history, message].slice(-this.maxMessages);
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
    this.persist();
    return session;
  }

  /** Drops every session past its TTL. Called on write and by the retention sweep. */
  prune(now = Date.now()) {
    let removed = 0;
    for (const [sessionId, session] of this.sessions) {
      if (now - session.updatedAt > this.ttlMs) {
        this.sessions.delete(sessionId);
        removed += 1;
      }
    }
    return removed;
  }

  persist() {}

  close() {}

  size() {
    return this.sessions.size;
  }
}

/**
 * Same contract, but conversations survive a restart. Only the hashed session id,
 * the platform reference ids and the message texts are stored — never a token.
 */
class FileSessionStore extends InMemorySessionStore {
  constructor({ filePath, maxMessages = DEFAULT_MAX_MESSAGES, ttlMs = 24 * 60 * 60 * 1000, flushDelayMs = FLUSH_DELAY_MS } = {}) {
    super({ maxMessages, ttlMs });
    this.filePath = filePath;
    this.flushDelayMs = flushDelayMs;
    this.flushTimer = null;
    this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      for (const session of parsed.sessions || []) {
        if (!session?.id || !Number.isFinite(session.updatedAt)) continue;
        this.sessions.set(session.id, session);
      }
      this.prune();
    } catch {
      // A missing or unreadable file simply means an empty history.
    }
  }

  persist() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushDelayMs);
    if (typeof this.flushTimer.unref === "function") this.flushTimer.unref();
  }

  flush() {
    this.prune();
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.${process.pid}.tmp`;
      fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, savedAt: new Date().toISOString(), sessions: [...this.sessions.values()] }, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(temporary, this.filePath);
    } catch {
      // Persistence is a convenience: a failed write must never drop a live conversation.
    }
  }

  close() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
    this.flush();
  }
}

/** Delivery ids already handled, so a Meta retry never answers twice — across restarts too. */
class ProcessedMessageLog {
  constructor({ filePath = null, ttlMs = 48 * 60 * 60 * 1000, maxEntries = 5_000 } = {}) {
    this.filePath = filePath;
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
    if (filePath) this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      for (const [id, at] of parsed.entries || []) this.entries.set(id, at);
      this.prune();
    } catch {
      // No log yet.
    }
  }

  prune(now = Date.now()) {
    for (const [id, at] of this.entries) {
      if (now - at > this.ttlMs) this.entries.delete(id);
    }
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
  }

  has(messageId) {
    return this.entries.has(messageId);
  }

  /** Returns false when the id was already seen. */
  add(messageId, now = Date.now()) {
    if (this.entries.has(messageId)) return false;
    this.entries.set(messageId, now);
    this.prune(now);
    this.persist();
    return true;
  }

  persist() {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.${process.pid}.tmp`;
      fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, entries: [...this.entries.entries()] })}\n`, { mode: 0o600 });
      fs.renameSync(temporary, this.filePath);
    } catch {
      // Same policy as sessions: never fail a reply over a cache file.
    }
  }

  get size() {
    return this.entries.size;
  }
}

function createSessionStore(config) {
  if (config.sessionStore === "file") {
    return new FileSessionStore({ filePath: config.sessionStorePath, ttlMs: config.sessionTtlMs });
  }
  return new InMemorySessionStore({ ttlMs: config.sessionTtlMs });
}

function createProcessedMessageLog(config) {
  const filePath = config.sessionStore === "file"
    ? path.join(path.dirname(config.sessionStorePath), "processed-messages.json")
    : null;
  return new ProcessedMessageLog({ filePath });
}

module.exports = { FileSessionStore, InMemorySessionStore, ProcessedMessageLog, createProcessedMessageLog, createSessionStore };
