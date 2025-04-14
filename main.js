const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const { fetchMetar } = require("./src/services/metarService");
const { AIRPORTS } = require("./src/config/config.js");

async function fetchAirportMetar(airport, icao) {
  try {
    const metar = await fetchMetar(icao);
    logger.info("METAR fetch successful", {
      action: "fetch_complete",
      airport,
      icao,
    });
    return metar;
  } catch (error) {
    logger.error("METAR fetch failed", {
      action: "fetch_failed",
      airport,
      icao,
      error: error.message,
    });
    throw error;
  }
}

// Add a results processor
async function processMetarResults(results) {
  const [auckland, wellington, christchurch] = results;
  logger.info("METAR fetch cycle complete", {
    action: "cycle_complete",
    fetchedAirports: [
      AIRPORTS.AUCKLAND,
      AIRPORTS.WELLINGTON,
      AIRPORTS.CHRISTCHURCH,
    ],
  });
}

cron.schedule("* * * * *", async () => {
  try {
    const results = await Promise.all([
      fetchAirportMetar("Auckland", AIRPORTS.AUCKLAND),
      fetchAirportMetar("Wellington", AIRPORTS.WELLINGTON),
      fetchAirportMetar("Christchurch", AIRPORTS.CHRISTCHURCH),
    ]);

    await processMetarResults(results);
  } catch (error) {
    logger.error("METAR fetch cycle failed", {
      action: "cycle_failed",
      error: error.message,
    });
  }
});
