const logger = require("../../utils/logging/winston");
const {
  metarUpdateDuration,
  metarUpdateCount,
  lastDataFetch,
  lastDataImport,
} = require("../../utils/monitoring/metrics");
const databaseService = require("../database/databaseService");
const metarService = require("./metarService");
const aerodromes = require("../../config/aerodromes.json").AERODROMES;

const updateAllMetars = async () => {
  const airports = Object.values(aerodromes);
  const timer = metarUpdateDuration.startTimer();

  const results = await Promise.allSettled(
    airports.map((icao) => metarService.processMetar(icao))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  metarUpdateCount.inc({ status: "succeeded" }, succeeded);
  metarUpdateCount.inc({ status: "failed" }, failed);
  timer({ status: failed > 0 ? "failed" : "succeeded" });

  if (failed === 0) {
    const now = Math.floor(Date.now() / 1000);
    lastDataFetch.set(now);

    const lastImportTime = await databaseService.getLastDataImportTime();
    if (lastImportTime) {
      const lastImportTimestamp = Math.floor(
        new Date(lastImportTime).getTime() / 1000
      );
      lastDataImport.set(lastImportTimestamp);
      logger.info("Last data import timestamp updated", { lastImportTime });
    }
  }

  logger.info("METAR update complete", {
    total: airports.length,
    succeeded,
    failed,
  });
};

module.exports = { updateAllMetars };
