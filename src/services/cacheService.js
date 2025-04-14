const { createClient } = require("redis");
const logger = require("../utils/logging/winston");
const { REDIS } = require("../config/config");

class CacheService {
  constructor() {
    this.client = createClient({
      url: REDIS.url,
      socket: {
        reconnectStrategy: (retries) => {
          const maxRetryTime = 3000;
          const wait = Math.min(retries * 100, maxRetryTime);
          logger.debug("Redis reconnect attempt", {
            retries,
            wait,
          });
          return wait;
        },
      },
    });

    this.isConnected = false;

    this.client.on("error", (err) => {
      this.isConnected = false;
      logger.error("Redis client error", { error: err.message });
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis client connected");
    });

    this.client.on("end", () => {
      this.isConnected = false;
      logger.info("Redis connection closed");
    });
  }

  async ensureConnection() {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error("Redis connection failed", { error: error.message });
        throw error;
      }
    }
  }

  async setMetar(icao, data, ttl = 24 * 60 * 60) {
    await this.ensureConnection();
    try {
      const key = `metar:${icao}:${data.decoded.time}`;
      await this.client.json.set(key, "$", data);
      await this.client.expire(key, ttl);
    } catch (error) {
      logger.error("Redis set failed", {
        error: error.message,
        icao,
      });
      throw error;
    }
  }

  async getLatestMetar(icao) {
    await this.ensureConnection();
    try {
      const keys = await this.client.keys(`metar:${icao}:*`);
      if (!keys.length) return null;
      const latestKey = keys.sort().pop();
      return this.client.json.get(latestKey);
    } catch (error) {
      logger.error("Redis get failed", {
        error: error.message,
        icao,
      });
      return null;
    }
  }

  async close() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService();
