const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const metarService = require("./src/services/metarService");
const { checkServices } = require("./src/utils/startup");
const { AIRPORTS } = require("./src/config/config");
const cacheService = require("./src/services/cacheService");

const updateAllMetars = async () => {
  const airports = Object.values(AIRPORTS);
  const results = await Promise.allSettled(
    airports.map((icao) => metarService.processMetar(icao))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

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

    logger.info("Starting METAR service", {
      airports: Object.values(AIRPORTS),
    });

    // Initial update
    await updateAllMetars();

    // Schedule updates every minute
    cron.schedule("*/2 * * * *", updateAllMetars);

    logger.info("METAR monitoring active");
  } catch (error) {
    logger.error("Application startup failed", {
      error: error.message,
    });
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
