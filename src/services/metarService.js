const https = require("https");
const { setCachedMetar, getCachedMetar } = require("./redisService");
const { decodeMetar } = require("./metarDecoder");
const logger = require("../utils/logging/winston");

const VATSIM_METAR_BASE_URL = "https://metar.vatsim.net";

const fetchFromVatsim = async (icao) => {
  return new Promise((resolve, reject) => {
    https
      .get(`${VATSIM_METAR_BASE_URL}/${icao}`, (resp) => {
        let data = "";
        resp.on("data", (chunk) => (data += chunk));
        resp.on("end", () => resolve(data.trim()));
      })
      .on("error", (err) => reject(err));
  });
};

const fetchMetar = async (icao) => {
  try {
    const cachedMetar = await getCachedMetar(icao);

    if (!cachedMetar) {
      logger.debug("Cache miss", { action: "cache_miss", icao });

      const metar = await fetchFromVatsim(icao);
      const hasChanged = await setCachedMetar(icao, metar);

      if (hasChanged) {
        logger.info("New METAR retrieved", { action: "new_metar", icao });
        return decodeMetar(metar, icao);
      }
    }

    logger.debug("METAR unchanged", { action: "metar_unchanged", icao });
    return null;
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
