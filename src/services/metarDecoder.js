const { parseMetar } = require("metar-taf-parser");
const logger = require("../utils/logging/winston");

class MetarDecoder {
  static formatTimeComponent(num) {
    return num.toString().padStart(2, "0");
  }

  static formatTime(components) {
    return `${this.formatTimeComponent(
      components.day
    )}${this.formatTimeComponent(components.hour)}${this.formatTimeComponent(
      components.minute
    )}Z`;
  }

  static decode(rawMetar, icao) {
    try {
      // Parse time first
      const timeMatch = rawMetar.match(/(\d{2})(\d{2})(\d{2})Z/);
      if (!timeMatch) {
        throw new Error("Invalid METAR time format");
      }

      const timeComponents = {
        day: parseInt(timeMatch[1]),
        hour: parseInt(timeMatch[2]),
        minute: parseInt(timeMatch[3]),
      };

      const parsed = parseMetar(rawMetar);

      const decodedMetar = {
        icao,
        time: this.formatTime(timeComponents), // Will always be DDHHMMZ format
        wind: {
          direction: parsed.wind?.direction?.value ?? null,
          speed: parsed.wind?.speed?.value ?? null,
        },
        visibility: parsed.visibility?.value ?? null,
        temperature: parsed.temperature?.value ?? null,
        dewPoint: parsed.dewPoint?.value ?? null,
        altimeter: parsed.altimeter?.value ?? null,
      };

      return {
        raw: rawMetar,
        decoded: decodedMetar,
      };
    } catch (error) {
      logger.error("METAR decode failed", {
        action: "decode_failed",
        icao,
        error: error.message,
      });
      return null;
    }
  }
}
module.exports = MetarDecoder;
