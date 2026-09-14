"use strict";

require("dotenv").config();

const { createApp } = require("./app");
const { loadConfig, requiredValues } = require("./config");
const { error, log } = require("./logger");

const config = loadConfig();
const app = createApp(config);
const server = app.listen(config.port, () => {
  const missing = requiredValues(config);
  const knowledge = app.locals.knowledgeStore.getStatus();
  log("server.started", {
    port: config.port,
    webhookPath: "/webhooks/instagram",
    status: missing.length ? "configuration_required" : "ready",
    missing,
    knowledgeSources: knowledge.sourceCount,
    staleSources: knowledge.staleSourceCount,
    gymsWithPlanning: `${knowledge.gymsWithPlanning}/${knowledge.gymCount}`,
  });
  app.startWeeklySync();
});

function shutdown(signal) {
  log("server.stopping", { signal });
  app.locals.scheduler?.stop();
  server.close(() => {
    try {
      app.locals.sessions?.close?.();
    } catch (err) {
      error("server.session_flush_failed", err);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5_000).unref();
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => shutdown(signal));
