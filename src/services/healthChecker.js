const { checkServices } = require("../utils/startup");
const healthService = require("./healthService");
const logger = require("../utils/logging/winston");

const performStartupChecks = async () => {
  await checkServices();
  logger.info("Startup health checks completed successfully");
};

const scheduleHealthChecks = (cron) => {
  cron.schedule("*/5 * * * *", healthService.checkVatsimHealth);
  logger.info("Scheduled periodic health checks for VATSIM");
};

module.exports = { performStartupChecks, scheduleHealthChecks };
