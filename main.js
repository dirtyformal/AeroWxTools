const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const metarService = require("./src/services/metarService");
const { checkServices } = require("./src/utils/startup");
const cacheService = require("./src/services/cacheService");
const express = require("express");
const {
  register,
  metarUpdateDuration,
  metarUpdateCount,
  serviceStatus,
  lastDataFetch,
  lastDataImport,
} = require("./src/utils/monitoring/metrics");
const databaseService = require("./src/services/databaseService");
const aerodromes = require("./src/config/aerodromes.json").AERODROMES;

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
  const airports = Object.values(aerodromes); // Fetch all aerodrome ICAO codes
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

  if (failed === 0) {
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    lastDataFetch.set(now); // Update the "last data fetch" metric
    logger.info("Last data fetch timestamp updated", { timestamp: now });

    // Fetch and log the last data import time
    const lastImportTime = await databaseService.getLastDataImportTime();
    if (lastImportTime) {
      const lastImportTimestamp = Math.floor(
        new Date(lastImportTime).getTime() / 1000
      );
      lastDataImport.set(lastImportTimestamp); // Update the "last data import" metric
      logger.info("Last data import timestamp updated", { lastImportTime });
    }
  }

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
      aerodromes: Object.keys(aerodromes), // Log aerodrome names
    });

    // Initial update
    await updateAllMetars();

    // Schedule updates every 2 minutes
    cron.schedule("*/5 * * * *", updateAllMetars);

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
