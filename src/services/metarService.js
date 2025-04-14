const https = require("https");
const logger = require("../utils/logging/winston");
const metarDecoder = require("./metarDecoder");
const cacheService = require("./cacheService");
const databaseService = require("./databaseService");

class MetarService {
  static async fetchFromVatsim(icao) {
    return new Promise((resolve, reject) => {
      https
        .get(`https://metar.vatsim.net/${icao}`, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => resolve(data.trim()));
        })
        .on("error", reject);
    });
  }

  static async processMetar(icao) {
    try {
      // Check cache first
      const cached = await cacheService.getLatestMetar(icao);
      if (cached) {
        logger.debug("METAR cache hit", { icao });
        return cached;
      }

      // Fetch new METAR
      const rawMetar = await this.fetchFromVatsim(icao);
      if (!rawMetar) {
        throw new Error("No METAR data received");
      }

      // Decode METAR
      const result = metarDecoder.decode(rawMetar, icao);
      if (!result?.decoded) {
        throw new Error("Failed to decode METAR");
      }

      // Store in cache and database
      await Promise.all([
        cacheService.setMetar(icao, result),
        databaseService.storeMetar(icao, result),
      ]);

      logger.info("METAR processed successfully", {
        action: "metar_processed",
        icao,
        time: result.decoded.time,
      });

      return result;
    } catch (error) {
      logger.error("METAR processing failed", {
        action: "process_failed",
        icao,
        error: error.message,
      });
      return null;
    }
  }
}

module.exports = MetarService;
