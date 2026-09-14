"use strict";

const { loadGymRegistry } = require("./gyms");
const { loadForbiddenClaims } = require("./guards");
const { loadKnowledgeBase } = require("./knowledge");

/**
 * Holds the live corpus and swaps it atomically after a sync, so a weekly refresh
 * reaches the next DM without restarting the server.
 */
class KnowledgeStore {
  constructor(config, { knowledge = null, registry = null, claims = null } = {}) {
    this.config = config;
    this.reloadCount = 0;
    if (knowledge) {
      this.registry = registry || knowledge.registry || loadGymRegistry(config);
      this.knowledge = knowledge;
      this.claims = claims || loadForbiddenClaims(config);
      this.reloadedAt = new Date();
    } else {
      this.reload();
    }
  }

  reload() {
    const registry = loadGymRegistry(this.config);
    const knowledge = loadKnowledgeBase(this.config, { registry });
    const claims = loadForbiddenClaims(this.config);
    this.registry = registry;
    this.knowledge = knowledge;
    this.claims = claims;
    this.reloadedAt = new Date();
    this.reloadCount += 1;
    return knowledge.getStatus();
  }

  retrieve(query, options) {
    return this.knowledge.retrieve(query, options);
  }

  get persona() {
    return this.knowledge.persona;
  }

  getStatus(now) {
    const status = typeof this.knowledge.getStatus === "function" ? this.knowledge.getStatus(now) : {};
    return { ...status, reloadCount: this.reloadCount, reloadedAt: this.reloadedAt.toISOString() };
  }

  // Tolerant of an injected test double that only implements retrieve().
  coverage() {
    return typeof this.knowledge.coverage === "function" ? this.knowledge.coverage() : [];
  }
}

module.exports = { KnowledgeStore };
