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

// Register custom metrics
register.registerMetric(metarUpdateDuration);
register.registerMetric(metarUpdateCount);
register.registerMetric(serviceStatus);

module.exports = {
  register,
  metarUpdateDuration,
  metarUpdateCount,
  serviceStatus,
};
