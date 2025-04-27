const { createClient } = require("redis");
const logger = require("../utils/logging/winston");
const { REDIS } = require("../config/config");

const client = createClient({
  url: REDIS.url,
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetryTime = 3000;
      if (retries > 10) {
        logger.error("Max Redis reconnect attempts reached", { retries });
        return null;
      }
      const wait = Math.min(retries * 100, maxRetryTime);
      logger.debug("Redis reconnect attempt", { retries, wait });
      return wait;
    },
  },
});

client.on("error", (err) =>
  logger.error("Redis client error", { error: err.message })
);
client.on("connect", () => logger.info("Redis client connected"));
client.on("end", () => logger.info("Redis connection closed"));

const initRedis = async () => {
  try {
    await client.connect();
    const ping = await client.ping();
  } catch (error) {
    logger.error("Failed to initialize Redis", { error: error.message });
    process.exit(1);
  }
};

module.exports = { client, initRedis };
