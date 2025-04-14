const { createClient } = require("redis");
const { parseMetar } = require("metar-taf-parser");
const logger = require("../utils/logging/winston");

const client = createClient({
  url: "redis://localhost:6379",
  retry_strategy: (options) => {
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error("Redis connection retry time exceeded", {
        attempt: options.attempt,
      });
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      logger.error("Redis connection max retries reached", {
        attempt: options.attempt,
      });
      return new Error("Max retries reached");
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

client.on("error", (err) =>
  logger.error("Redis connection failed", { reason: err.message })
);
client.on("connect", () => logger.info("Redis connected successfully"));

client.connect();

const METAR_EXPIRY = 300; // 5 minutes

const setCachedMetar = async (icao, metar) => {
  try {
    const currentMetar = await getCachedMetar(icao);
    if (currentMetar === metar) {
      return false; // No change
    }

    await client.setEx(icao, METAR_EXPIRY, metar);
    logger.debug("METAR cached", {
      action: "cache_set",
      icao,
    });
    return true; // METAR changed
  } catch (error) {
    logger.error("Cache set failed", {
      action: "cache_error",
      icao,
      error: error.message,
    });
    return false;
  }
};

const getCachedMetar = async (icao) => {
  try {
    const rawMetar = await client.get(icao);
    if (!rawMetar) {
      // Remove the cache miss log from here since metarService will handle it
      return null;
    }
    return rawMetar;
  } catch (error) {
    logger.error("Cache get failed", {
      action: "cache_error",
      icao,
      error: error.message,
    });
    return null;
  }
};

module.exports = {
  setCachedMetar,
  getCachedMetar,
};
