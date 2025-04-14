const pool = require("../db");
const logger = require("../utils/logging/winston");

const storeMetar = async (icao, { decoded, raw }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Use UPSERT to handle duplicates
    await client.query(
      `INSERT INTO metar_history (
        icao, raw_metar, time, wind_direction, wind_speed, 
        visibility, temperature, dewpoint, qnh
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (icao, time) DO UPDATE SET
        raw_metar = EXCLUDED.raw_metar,
        wind_direction = EXCLUDED.wind_direction,
        wind_speed = EXCLUDED.wind_speed,
        visibility = EXCLUDED.visibility,
        temperature = EXCLUDED.temperature,
        dewpoint = EXCLUDED.dewpoint,
        qnh = EXCLUDED.qnh,
        created_at = NOW()`,
      [
        icao,
        raw,
        decoded.time,
        decoded.wind?.direction || null,
        decoded.wind?.speed || null,
        decoded.visibility || null,
        decoded.temperature || null,
        decoded.dewPoint || null,
        decoded.altimeter || null,
      ]
    );

    await client.query("COMMIT");
    logger.debug("METAR stored/updated in database", {
      icao,
      time: decoded.time,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Database storage failed", {
      icao,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { storeMetar };
