const https = require("https");
const { setCachedMetar, getCachedMetar } = require("./redisService");
const logger = require("../utils/logging/winston");

const VATSIM_METAR_BASE_URL = "https://metar.vatsim.net";

const fetchMetar = async (icao) => {
  try {
    // First check cache
    const cachedMetar = await getCachedMetar(icao);
    if (cachedMetar) {
      logger.info("Retrieved METAR from cache", {
        action: "cache_hit",
        icao,
      });
      return cachedMetar;
    }

    // If not in cache, fetch from API
    const metar = await new Promise((resolve, reject) => {
      https
        .get(`${VATSIM_METAR_BASE_URL}/${icao}`, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => resolve(data.trim()));
        })
        .on("error", (err) => reject(err));
    });

    // Store in cache
    await setCachedMetar(icao, metar);
    logger.info("Retrieved METAR from API", {
      action: "api_fetch",
      icao,
    });

    return metar;
  } catch (error) {
    logger.error("Failed to fetch METAR", {
      action: "fetch_error",
      icao,
      error: error.message,
    });
    throw error;
  }
};

module.exports = { fetchMetar };
