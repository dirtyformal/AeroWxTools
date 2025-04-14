const { createClient } = require("redis");
const logger = require("../utils/logging/winston");

const client = createClient({
  url: "redis://localhost:6379",
  retry_strategy: (options) => {
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error("Redis retry time exhausted", {
        action: "redis_retry_exhausted",
      });
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      logger.error("Redis max retries reached", {
        action: "redis_max_retries",
      });
      return new Error("Max retries reached");
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

client.on("error", (err) => logger.error("Redis Client Error", { error: err }));
client.on("connect", () => logger.info("Redis Client Connected"));

//Connect to Redis
client.connect();

const METAR_EXPIRY = 300; // 5 Min

const setCachedMetar = async (icao, metar) => {
  try {
    await client.setEx(icao, METAR_EXPIRY, metar);
  } catch (error) {
    logger.error("Redis Set Error", { error: error.message });
  }
};

const getCachedMetar = async (icao) => {
  try {
    return await client.get(icao);
  } catch (error) {
    logger.error("Redis Get Error", { error: error.message });
    return null;
  }
};

module.exports = {
  setCachedMetar,
  getCachedMetar,
};
