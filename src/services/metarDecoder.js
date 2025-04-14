const { parseMetar } = require("metar-taf-parser");
const logger = require("../utils/logging/winston");

const metarDecoder = {
  decode(rawMetar, icao) {
    try {
      const parsed = parseMetar(rawMetar);

      // Get current date components
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth() + 1;

      // Handle day rollover
      const metarMonth =
        parsed.day > now.getUTCDate() ? currentMonth - 1 : currentMonth;

      // Create observation timestamp
      const observationTime = new Date(
        Date.UTC(
          currentYear,
          metarMonth - 1,
          parsed.day,
          parsed.hour,
          parsed.minute
        )
      );

      return {
        raw: rawMetar,
        decoded: {
          ...parsed,
          icao,
          time: `${parsed.day.toString().padStart(2, "0")}${parsed.hour
            .toString()
            .padStart(2, "0")}${parsed.minute.toString().padStart(2, "0")}Z`,
          observationTime: observationTime.toISOString(),
        },
      };
    } catch (error) {
      logger.error("METAR decode failed", {
        action: "decode_failed",
        icao,
        error: error.message,
        raw: rawMetar,
      });
      return null;
    }
  },
};

module.exports = metarDecoder;
