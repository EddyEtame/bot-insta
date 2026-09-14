"use strict";

class InMemorySessionStore {
  constructor({ maxMessages = 12, ttlMs = 24 * 60 * 60 * 1000 } = {}) {
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
    return session;
  }
}

module.exports = { InMemorySessionStore };
