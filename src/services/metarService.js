const https = require("https");
const { setCachedMetar } = require("./redisService");
const { storeMetar } = require("./databaseService");
const logger = require("../utils/logging/winston");
const MetarDecoder = require("./metarDecoder");

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
      const rawMetar = await this.fetchFromVatsim(icao);
      if (!rawMetar) {
        throw new Error("No METAR data received");
      }

      const decodedResult = MetarDecoder.decode(rawMetar, icao);
      if (!decodedResult?.decoded) {
        throw new Error("Failed to decode METAR");
      }

      // Explicitly destructure for clarity
      const { decoded, raw } = decodedResult;

      await Promise.all([
        setCachedMetar(icao, raw),
        storeMetar(icao, decodedResult), // Pass the entire result object
      ]);

      logger.info("METAR processed successfully", {
        action: "metar_processed",
        icao,
        time: decoded.time,
      });

      return decodedResult;
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
