const logger = require("./logging/winston");
const { client } = require("../cache/redisClient");

const handleShutdown = () => {
  process.on("SIGTERM", async () => {
    logger.info("Shutting down...");
    try {
      await client.quit();
      logger.info("Redis connection closed");
    } catch (error) {
      logger.error("Error closing Redis connection", { error: error.message });
    }
    process.exit(0);
  });
};

module.exports = { handleShutdown };
