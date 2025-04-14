const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const MetarService = require("./src/services/metarService");
const { AIRPORTS } = require("./src/config/config");
const { checkDatabase } = require("./src/utils/startup");

const updateAllMetars = async () => {
  const airports = Object.values(AIRPORTS);
  await Promise.all(airports.map((icao) => MetarService.processMetar(icao)));
};

const startApplication = async () => {
  try {
    // Check database connection on startup
    await checkDatabase();

    logger.info("Initializing METAR service");

    // Initial update
    await updateAllMetars();

    // Schedule updates every 5 minutes
    cron.schedule("*/1 * * * *", updateAllMetars);

    logger.info("METAR monitoring active", {
      airports: Object.values(AIRPORTS),
    });
  } catch (error) {
    logger.error("Application startup failed", {
      error: error.message,
    });
    process.exit(1);
  }
};

// Start the application
startApplication();
