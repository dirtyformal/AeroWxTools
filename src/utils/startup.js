const pool = require("../db");
const cacheService = require("../services/cacheService");
const logger = require("./logging/winston");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkServices(retries = 10, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check PostgreSQL
      const client = await pool.connect();
      try {
        await client.query("SELECT NOW()");
        logger.info("PostgreSQL connection successful");
      } finally {
        client.release();
      }

      // Check Redis with detailed error handling
      try {
        await cacheService.client.connect();
        const pingResult = await cacheService.client.ping();
        logger.info("Redis connection successful", { ping: pingResult });
        return true;
      } catch (redisError) {
        logger.error("Redis connection failed", {
          attempt,
          error: redisError.message,
        });
        throw redisError;
      }
    } catch (error) {
      if (attempt === retries) {
        logger.error("Service check failed after retries", {
          attempts: retries,
          error: error.message,
          service: error.message.includes("Redis") ? "Redis" : "PostgreSQL",
        });
        throw error;
      }

      logger.info("Waiting for services to be ready", {
        attempt,
        nextAttempt: `${delay / 1000}s`,
        failedService: error.message.includes("Redis") ? "Redis" : "PostgreSQL",
      });

      await wait(delay);
    }
  }
}

module.exports = { checkServices };
