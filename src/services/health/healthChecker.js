const logger = require("../../utils/logging/winston");
const { checkServices } = require("../../utils/startup");
const healthService = require("./healthService");

/*
 *  healthChecker.js manages the startup and periodic checks for all external services.
 *  halthService.js is where all of the health logic for endpoints are stored.
 */

const performStartupChecks = async () => {
  await checkServices();
  logger.info("Startup health checks completed successfully");
};

const scheduleHealthChecks = (cron) => {
  cron.schedule("*/5 * * * *", healthService.checkVatsimHealth);
  logger.info("Scheduled periodic health checks for VATSIM");
};

module.exports = { performStartupChecks, scheduleHealthChecks };
