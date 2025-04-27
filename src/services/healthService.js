const axios = require("axios");
const logger = require("../utils/logging/winston");
const { serviceStatus } = require("../utils/monitoring/metrics");

const healthService = {
  async checkVatsimHealth() {
    try {
      const response = await axios.get("https://metar.vatsim.net/metar.php");
      if (response.status === 200) {
        serviceStatus.set({ service: "VATSIM" }, 1); // Pass healthy status to Prom
        logger.info("VATSIM endpoint is healthy!");
      } else {
        serviceStatus.set({ service: "VATSIM" }, 0); // Pass unhealthy status to Prom
        logger.warn("VATSIM endpoint returned non-200 status", {
          status: response.status,
        });
      }
    } catch (error) {
      serviceStatus.set({ service: "VATSIM" }, 0);
      logger.error("Failed to reach VATSIM endpoint", { error: error.message });
    }
  },
};

module.exports = healthService;
