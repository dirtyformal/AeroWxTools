const pool = require("../db");
const logger = require("../utils/logging/winston");

const databaseService = {
  async storeMetar(icao, metarData) {
    const client = await pool.connect();
    try {
      const { raw, decoded } = metarData;

      await client.query("BEGIN");

      // First try to update existing record
      const updateResult = await client.query(
        `UPDATE metar_history 
         SET raw_metar = $1,
             decoded = $2,
             created_at = NOW()
         WHERE icao = $3 AND observation_time = $4
         RETURNING id`,
        [raw, decoded, icao, decoded.observationTime]
      );

      // If no row was updated, then insert new record
      if (updateResult.rowCount === 0) {
        await client.query(
          `INSERT INTO metar_history (
            icao, time, observation_time, raw_metar, decoded
          ) VALUES ($1, $2, $3, $4, $5)`,
          [icao, decoded.time, decoded.observationTime, raw, decoded]
        );
      }

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

  async getLastDataImportTime() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT MAX(created_at) AS last_import_time FROM metar_history`
      );
      return result.rows[0]?.last_import_time || null;
    } catch (error) {
      logger.error("Failed to fetch last data import time", {
        error: error.message,
      });
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = databaseService;
