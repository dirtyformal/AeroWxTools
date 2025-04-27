const https = require("https");
const logger = require("../../utils/logging/winston");
const metarDecoder = require("./metarDecoder");
const databaseService = require("../database/databaseService");
const cacheService = require("../../cache/cacheService");

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
      // Fetch new METAR first
      const rawMetar = await this.fetchFromVatsim(icao);
      if (!rawMetar) {
        throw new Error("No METAR data received");
      }

      // Decode new METAR
      const result = metarDecoder.decode(rawMetar, icao);
      if (!result?.decoded) {
        throw new Error("Failed to decode METAR");
      }

      // Compare with cache and update if needed
      const cached = await cacheService.getLatestMetar(icao);
      if (!cached || cached.raw !== rawMetar) {
        await Promise.all([
          cacheService.setMetar(icao, result),
          databaseService.storeMetar(icao, result),
        ]);

        logger.info("New METAR processed", {
          action: "metar_updated",
          icao,
          time: result.decoded.time,
        });
        return result;
      }

      logger.debug("METAR unchanged", {
        action: "metar_unchanged",
        icao,
      });
      return cached;
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
