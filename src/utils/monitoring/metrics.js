const client = require("prom-client");

// Create a Registry to register metrics
const register = new client.Registry();

// Default metrics (e.g., memory usage, event loop lag)
client.collectDefaultMetrics({ register });

// Custom metrics
const metarUpdateDuration = new client.Histogram({
  name: "metar_update_duration_seconds",
  help: "Duration of METAR update process in seconds",
  labelNames: ["status"],
});

const metarUpdateCount = new client.Counter({
  name: "metar_update_total",
  help: "Total number of METAR updates",
  labelNames: ["status"],
});

const serviceStatus = new client.Gauge({
  name: "service_status",
  help: "Status of external services (1 = up, 0 = down)",
  labelNames: ["service"],
});

const lastDataFetch = new client.Gauge({
  name: "last_data_fetch_timestamp",
  help: "Timestamp of the last successful METAR data fetch (in seconds since epoch)",
});

const lastDataImport = new client.Gauge({
  name: "last_data_import_timestamp",
  help: "Timestamp of the last successful METAR data import (in seconds since epoch)",
});

// Register custom metrics
register.registerMetric(metarUpdateDuration);
register.registerMetric(metarUpdateCount);
register.registerMetric(serviceStatus);
register.registerMetric(lastDataFetch);
register.registerMetric(lastDataImport);

module.exports = {
  register,
  metarUpdateDuration,
  metarUpdateCount,
  serviceStatus,
  lastDataFetch,
  lastDataImport,
};
