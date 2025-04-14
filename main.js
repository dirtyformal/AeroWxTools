const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const { fetchMetar } = require("./src/services/metarService");
const { AIRPORTS } = require("./src/config/config.js");

const updateAllMetars = async () => {
  const airports = [
    { name: "Auckland", icao: AIRPORTS.AUCKLAND },
    { name: "Wellington", icao: AIRPORTS.WELLINGTON },
    { name: "Christchurch", icao: AIRPORTS.CHRISTCHURCH },
  ];

  for (const { name, icao } of airports) {
    try {
      const metar = await fetchMetar(icao);
      if (metar) {
        logger.info("METAR update complete", {
          action: "update_complete",
          airport: name,
          icao,
        });
      }
    } catch (error) {
      logger.error("METAR update failed", {
        action: "update_failed",
        airport: name,
        icao,
        error: error.message,
      });
    }
  }
};

// Initial fetch on startup
const initializeMetars = async () => {
  logger.info("Initializing METAR service");
  await updateAllMetars();

  cron.schedule("*/1 * * * *", updateAllMetars);

  logger.info("METAR monitoring active", {
    airports: Object.values(AIRPORTS),
  });
};

// Start the service
initializeMetars().catch((error) => {
  logger.error("Service initialization failed", {
    action: "init_failed",
    error: error.message,
  });
  process.exit(1);
});
