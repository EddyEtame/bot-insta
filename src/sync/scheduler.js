"use strict";

const { MS_PER_DAY, nextWeeklyRun } = require("../calendar");

const MAX_TIMER_MS = 2_147_483_000;

/**
 * Weekly poll, wall-clock in the club's own time zone: every Sunday at 04:30 Europe/Paris
 * whatever daylight saving does. The timer is re-armed after each run, never drifting.
 */
function createWeeklyScheduler({ config, run, logger = { log() {}, error() {} }, now = () => new Date(), timers = { setTimeout, clearTimeout } }) {
  const settings = config.sync;
  let timer = null;
  let stopped = false;
  let nextRunAt = null;
  let running = false;

  function computeNextRun(from = now()) {
    return nextWeeklyRun(from, {
      weekday: settings.weekday,
      hour: settings.hour,
      minute: settings.minute,
      timeZone: settings.timeZone,
    });
  }

  function arm() {
    if (stopped) return;
    nextRunAt = computeNextRun();
    const delay = Math.max(0, nextRunAt.getTime() - now().getTime());
    timer = timers.setTimeout(fire, Math.min(delay, MAX_TIMER_MS));
    if (typeof timer?.unref === "function") timer.unref();
    logger.log("sync.scheduled", { nextRunAt: nextRunAt.toISOString(), timeZone: settings.timeZone });
  }

  async function fire() {
    if (stopped) return;
    // A long wait is split into chunks; only fire once the target time is actually reached.
    if (nextRunAt && now().getTime() < nextRunAt.getTime() - 1_000) {
      const delay = Math.max(0, nextRunAt.getTime() - now().getTime());
      timer = timers.setTimeout(fire, Math.min(delay, MAX_TIMER_MS));
      if (typeof timer?.unref === "function") timer.unref();
      return;
    }
    running = true;
    try {
      await run({ now: now(), trigger: "schedule" });
    } catch (err) {
      logger.error("sync.run_failed", err);
    } finally {
      running = false;
      arm();
    }
  }

  /** True when the last successful run is older than a week plus a grace day. */
  function isStale(lastRunAt) {
    if (!lastRunAt) return true;
    const age = now().getTime() - Date.parse(lastRunAt);
    return !Number.isFinite(age) || age > 8 * MS_PER_DAY;
  }

  return {
    computeNextRun,
    isStale,
    get nextRunAt() {
      return nextRunAt;
    },
    get running() {
      return running;
    },
    start({ lastRunAt = null } = {}) {
      stopped = false;
      arm();
      if (settings.runOnStartIfStale && isStale(lastRunAt)) {
        logger.log("sync.catch_up", { lastRunAt });
        Promise.resolve(run({ now: now(), trigger: "catch-up" })).catch((err) => logger.error("sync.run_failed", err));
      }
      return this;
    },
    stop() {
      stopped = true;
      if (timer) timers.clearTimeout(timer);
      timer = null;
    },
  };
}

module.exports = { MAX_TIMER_MS, createWeeklyScheduler };
