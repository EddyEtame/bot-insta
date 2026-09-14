"use strict";

require("dotenv").config();
const { createApp } = require("./app");
const { loadConfig, requiredValues } = require("./config");
const { log } = require("./logger");

const config = loadConfig();
const app = createApp(config);
app.listen(config.port, () => {
  const missing = requiredValues(config);
  log("server.started", {
    port: config.port,
    webhookPath: "/webhooks/instagram",
    status: missing.length ? "configuration_required" : "ready",
    missing,
  });
});
