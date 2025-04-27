const pool = require("../db");
const cacheService = require("../services/cacheService");
const logger = require("./logging/winston");
const { serviceStatus } = require("./monitoring/metrics");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkServices(retries = 10, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check PostgreSQL
      const client = await pool.connect();
      try {
        await client.query("SELECT NOW()");
        logger.info("PostgreSQL connection successful");
        serviceStatus.set({ service: "PostgreSQL" }, 1); // Set PostgreSQL status to up
      } finally {
        client.release();
      }

      // Check Redis
      try {
        await cacheService.client.connect();
        const pingResult = await cacheService.client.ping();
        logger.info("Redis connection successful", { ping: pingResult });
        serviceStatus.set({ service: "Redis" }, 1); // Set Redis status to up
        return true;
      } catch (redisError) {
        logger.error("Redis connection failed", {
          attempt,
          error: redisError.message,
        });
        serviceStatus.set({ service: "Redis" }, 0); // Set Redis status to down
        throw redisError;
      }
    } catch (error) {
      if (attempt === retries) {
        logger.error("Service check failed after retries", {
          attempts: retries,
          error: error.message,
          service: error.message.includes("Redis") ? "Redis" : "PostgreSQL",
        });
        serviceStatus.set(
          { service: error.message.includes("Redis") ? "Redis" : "PostgreSQL" },
          0
        ); // Set service status to down
        throw error;
      }
      await wait(delay);
    }
  }
}

module.exports = { checkServices };
