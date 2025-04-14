const { createClient } = require("redis");
const logger = require("../utils/logging/winston");
const { REDIS } = require("../config/config");

const client = createClient({
  url: REDIS.url,
  retry_strategy: (options) => {
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error("Redis retry time exhausted", {
        attempt: options.attempt,
      });
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      logger.error("Redis max retries reached", {
        attempt: options.attempt,
      });
      return undefined; // Stop retrying
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Initialize connection
const initRedis = async () => {
  try {
    await client.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error("Redis connection failed", { error: error.message });
    process.exit(1); // Exit if Redis can't connect
  }
};

// Call initialize
initRedis();

const METAR_EXPIRY = 300; // 5 minutes

const setCachedMetar = async (icao, metar) => {
  try {
    const currentMetar = await getCachedMetar(icao);
    if (currentMetar === metar) {
      logger.debug("METAR unchanged", { icao }); // Debug level for cache ops
      return false;
    }

    await client.setEx(icao, METAR_EXPIRY, metar);
    logger.debug("METAR cached", { icao });
    return true;
  } catch (error) {
    logger.error("Cache operation failed", {
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
