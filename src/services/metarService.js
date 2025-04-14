const https = require("https");
const { setCachedMetar, getCachedMetar } = require("./redisService");
const { decodeMetar } = require("./metarDecoder");
const logger = require("../utils/logging/winston");

const VATSIM_METAR_BASE_URL = "https://metar.vatsim.net";

const fetchMetar = async (icao) => {
  try {
    const metar = await new Promise((resolve, reject) => {
      https
        .get(`${VATSIM_METAR_BASE_URL}/${icao}`, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => resolve(data.trim()));
        })
        .on("error", (err) => reject(err));
    });

    // Only decode if METAR has changed
    const hasChanged = await setCachedMetar(icao, metar);

    if (hasChanged) {
      logger.info("New METAR retrieved", {
        action: "new_metar",
        icao,
      });
      return decodeMetar(metar, icao);
    } else {
      logger.debug("METAR unchanged", {
        action: "metar_unchanged",
        icao,
      });
      return null;
    }
  } catch (error) {
    logger.error("METAR fetch failed", {
      action: "fetch_error",
      icao,
      error: error.message,
    });
    throw error;
  }
};

module.exports = { fetchMetar };
