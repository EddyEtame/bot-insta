"use strict";

class InMemoryRateLimiter {
  constructor({ limit = 8, windowMs = 60_000 } = {}) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.events = new Map();
  }

  consume(key, now = Date.now()) {
    const fresh = (this.events.get(key) || []).filter((timestamp) => now - timestamp < this.windowMs);
    if (fresh.length >= this.limit) {
      this.events.set(key, fresh);
      return false;
    }
    fresh.push(now);
    this.events.set(key, fresh);
    return true;
  }
}

module.exports = { InMemoryRateLimiter };
