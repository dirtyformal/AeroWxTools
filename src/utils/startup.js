const axios = require("axios");
const pool = require("../db");
const { client: redisClient } = require("../cache/redisClient");
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
        serviceStatus.set({ service: "PostgreSQL" }, 1);
      } finally {
        client.release();
      }

      // Check Redis
      try {
        const pingResult = await redisClient.ping();
        logger.info("Redis connection successful", { ping: pingResult });
        serviceStatus.set({ service: "Redis" }, 1);
      } catch (redisError) {
        logger.error("Redis connection failed", {
          attempt,
          error: redisError.message,
        });
        serviceStatus.set({ service: "Redis" }, 0);
        throw redisError;
      }

      // Check VATSIM
      try {
        const response = await axios.get("https://metar.vatsim.net/metar.php");
        if (response.status === 200) {
          logger.info("VATSIM endpoint is healthy!");
          serviceStatus.set({ service: "VATSIM" }, 1); // Set VATSIM status to up
        } else {
          logger.warn("VATSIM endpoint returned non-200 status", {
            status: response.status,
          });
          serviceStatus.set({ service: "VATSIM" }, 0); // Set VATSIM status to down
          throw new Error(`VATSIM returned status ${response.status}`);
        }
      } catch (vatsimError) {
        logger.error("VATSIM connection failed", {
          attempt,
          error: vatsimError.message,
        });
        serviceStatus.set({ service: "VATSIM" }, 0); // Set VATSIM status to down
        throw vatsimError;
      }

      // If all checks pass, return true
      return true;
    } catch (error) {
      if (attempt === retries) {
        logger.error("Service check failed after retries", {
          attempts: retries,
          error: error.message,
          service: error.message.includes("Redis")
            ? "Redis"
            : error.message.includes("PostgreSQL")
            ? "PostgreSQL"
            : "VATSIM",
        });
        serviceStatus.set(
          {
            service: error.message.includes("Redis")
              ? "Redis"
              : error.message.includes("PostgreSQL")
              ? "PostgreSQL"
              : "VATSIM",
          },
          0
        ); // Set service status to down
        throw error;
      }
      await wait(delay);
    }
  }
}

module.exports = { checkServices };
