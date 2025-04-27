const logger = require("./logging/winston");
const cacheService = require("../services/cacheService");

const handleShutdown = () => {
  process.on("SIGTERM", async () => {
    logger.info("Shutting down...");
    await cacheService.close();
    process.exit(0);
  });
};

module.exports = { handleShutdown };
