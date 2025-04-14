const pool = require("../db");
const logger = require("./logging/winston");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkDatabase(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT NOW()");

        const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'metar_history'
                    )`);

        if (!tableCheck.rows[0].exists) {
          throw new Error("Required table 'metar_history' not found");
        }

        logger.info("Database check passed", { attempt });
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      if (attempt === retries) {
        logger.error("Database check failed after retries", {
          attempts: retries,
          error: error.message,
        });
        throw error;
      }

      logger.info("Waiting for database to be ready", {
        attempt,
        nextAttempt: `${delay / 1000}s`,
      });

      await wait(delay);
    }
  }
}

module.exports = { checkDatabase };
