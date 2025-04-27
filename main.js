const cron = require("node-cron");
const logger = require("./src/utils/logging/winston");
const { startMetricsServer } = require("./src/server/metricsServer");
const { updateAllMetars } = require("./src/services/metarUpdater");
const {
  performStartupChecks,
  scheduleHealthChecks,
} = require("./src/services/healthChecker");
const { handleShutdown } = require("./src/utils/lifecycle");

const startApplication = async () => {
  try {
    startMetricsServer();
    await performStartupChecks();
    await updateAllMetars();
    cron.schedule("*/5 * * * *", updateAllMetars);
    scheduleHealthChecks(cron);
    logger.info("METAR monitoring active");
  } catch (error) {
    logger.error("Application startup failed", { error: error.message });
    process.exit(1);
  }
};

// Handle application shutdown
handleShutdown();

// Start the application
startApplication();
