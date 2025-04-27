const express = require("express");
const logger = require("../utils/logging/winston");
const { register } = require("../utils/monitoring/metrics");

const startMetricsServer = () => {
  const app = express();

  // Metrics endpoint
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  // Server Start
  const PORT = 3001;
  app.listen(PORT, () => {
    logger.info(`Metrics server running on http://localhost:${PORT}/metrics`);
  });
};

module.exports = { startMetricsServer };
