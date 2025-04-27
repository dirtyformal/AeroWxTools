const logger = require("../utils/logging/winston");
const { client } = require("./redisClient");

class CacheService {
  async setMetar(icao, data, ttl = 240) {
    try {
      const key = `metar:${icao}:current`;
      const currentData = await this.getLatestMetar(icao);

      // Only log and update if the data has changed
      if (
        !currentData ||
        JSON.stringify(currentData) !== JSON.stringify(data)
      ) {
        await client.set(key, JSON.stringify(data));
        await client.expire(key, ttl);
        logger.debug("Cache updated", {
          action: "cache_set",
          icao,
          time: data.decoded.time,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Cache set failed", {
        action: "cache_error",
        icao,
        error: error.message,
      });
      throw error;
    }
  }

  async getLatestMetar(icao) {
    try {
      const key = `metar:${icao}:current`;
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Cache get failed", {
        action: "cache_error",
        icao,
        error: error.message,
      });
      return null;
    }
  }
}

module.exports = new CacheService();
