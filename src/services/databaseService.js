const pool = require("../db");
const logger = require("../utils/logging/winston");

const databaseService = {
  async storeMetar(icao, metarData) {
    const client = await pool.connect();
    try {
      const { raw, decoded } = metarData;

      await client.query("BEGIN");
      await client.query(
        `INSERT INTO metar_history (
          icao, time, observation_time, raw_metar, decoded
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (icao, observation_time) 
        DO UPDATE SET
          raw_metar = EXCLUDED.raw_metar,
          decoded = EXCLUDED.decoded,
          created_at = NOW()`,
        [icao, decoded.time, decoded.observationTime, raw, decoded]
      );
      await client.query("COMMIT");

      logger.debug("METAR stored in database", {
        icao,
        time: decoded.time,
        observationTime: decoded.observationTime,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Database operation failed", {
        error: error.message,
        icao,
      });
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = databaseService;
