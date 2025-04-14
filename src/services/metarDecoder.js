const { parseMetar } = require("metar-taf-parser");
const logger = require("../utils/logging/winston");

const decodeMetar = (rawMetar, icao) => {
  try {
    const decoded = parseMetar(rawMetar);
    logger.debug("METAR decoded", {
      action: "metar_decoded",
      icao,
      station: icao,
      time: decoded.time,
    });

    return {
      raw: rawMetar,
      decoded,
    };
  } catch (error) {
    logger.error("METAR decode failed", {
      action: "decode_error",
      icao,
      error: error.message,
    });
    return null;
  }
};

module.exports = { decodeMetar };
