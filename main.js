const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const metarService = require("./src/services/metarService");
const { checkServices } = require("./src/utils/startup");
const { AIRPORTS } = require("./src/config/config");
const cacheService = require("./src/services/cacheService");
const express = require("express");
const {
  register,
  metarUpdateDuration,
  metarUpdateCount,
  serviceStatus,
} = require("./src/utils/monitoring/metrics");

// Expose metrics endpoint
const app = express();
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
app.listen(3001, () => {
  logger.info("Metrics server running on http://localhost:3001/metrics");
});

const updateAllMetars = async () => {
  const airports = Object.values(AIRPORTS);
  const timer = metarUpdateDuration.startTimer(); // Start timer for update duration

  const results = await Promise.allSettled(
    airports.map((icao) => metarService.processMetar(icao))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Record metrics
  metarUpdateCount.inc({ status: "succeeded" }, succeeded);
  metarUpdateCount.inc({ status: "failed" }, failed);
  timer({ status: failed > 0 ? "failed" : "succeeded" }); // Stop timer with status label

  logger.info("METAR update complete", {
    total: airports.length,
    succeeded,
    failed,
  });
};

const startApplication = async () => {
  try {
    // Check services on startup
    await checkServices();

    // Update service status metrics
    serviceStatus.set({ service: "PostgreSQL" }, 1);
    serviceStatus.set({ service: "Redis" }, 1);

    logger.info("Starting METAR service", {
      airports: Object.values(AIRPORTS),
    });

    // Initial update
    await updateAllMetars();

    // Schedule updates every 2 minutes
    cron.schedule("*/2 * * * *", updateAllMetars);

    logger.info("METAR monitoring active");
  } catch (error) {
    logger.error("Application startup failed", {
      error: error.message,
    });

    // Update service status metrics on failure
    if (error.message.includes("PostgreSQL")) {
      serviceStatus.set({ service: "PostgreSQL" }, 0);
    }
    if (error.message.includes("Redis")) {
      serviceStatus.set({ service: "Redis" }, 0);
    }

    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  await cacheService.close();
  process.exit(0);
});

// Start the application
startApplication();
