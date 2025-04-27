# Future

## Configuration Management:

Current State: Configuration values (e.g., Redis URL, PostgreSQL URL) are stored in .env and hardcoded in config.js.
Improvement: Use a library like dotenv-safe to validate required environment variables and prevent missing configurations.

## Enhanced Error Handling

Current State: Errors are logged, but there is no retry mechanism for critical operations like fetching METARs or database writes.
Improvement: Implement retry logic with exponential backoff for critical operations. For example, in metarService.js:

```javascript
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      logger.warn("Retrying operation", { attempt, error: error.message });
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

// Usage in fetchFromVatsim
static async fetchFromVatsim(icao) {
  return retry(() => {
    return new Promise((resolve, reject) => {
      https
        .get(`https://metar.vatsim.net/${icao}`, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => resolve(data.trim()));
        })
        .on("error", reject);
    });
  });
}
```

## Configuration Management

Current State: Configuration values (e.g., Redis URL, PostgreSQL URL) are stored in .env and hardcoded in config.js.
Improvement: Use a library like dotenv-safe to validate required environment variables and prevent missing configurations.

```javascript
require("dotenv-safe").config();

const REDIS = {
  url: process.env.REDIS_URL,
  expiry: parseInt(process.env.REDIS_EXPIRY || "300", 10),
};

const POSTGRES = {
  url: process.env.DATABASE_URL,
};

module.exports = { REDIS, POSTGRES };
```

## Unit and Integration Testing

Current State: There is no mention of tests in the workspace.
Improvement: Add unit tests for critical services like metarService and cacheService. Use a library like jest for testing.

```javascript
const metarService = require("../src/services/metarService");

test("fetchFromVatsim should return METAR data", async () => {
  const data = await metarService.fetchFromVatsim("NZAA");
  expect(data).toBeDefined();
});
const metarService = require("../src/services/metarService");

test("fetchFromVatsim should return METAR data", async () => {
  const data = await metarService.fetchFromVatsim("NZAA");
  expect(data).toBeDefined();
});
```

## Add documentation

## Performance Optimisations

Current State: METAR updates are processed sequentially for each airport.
Improvement: Use a worker pool or parallel processing to handle multiple airports concurrently.

```javascript
const { Worker } = require("worker_threads");

const updateMetarWorker = (icao) =>
  new Promise((resolve, reject) => {
    const worker = new Worker("./src/workers/updateMetarWorker.js", {
      workerData: { icao },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

const updateAllMetars = async () => {
  const airports = Object.values(AIRPORTS);
  await Promise.all(airports.map((icao) => updateMetarWorker(icao)));
};
```

## Monitoring and Alerts

**Current State**: Logs provide information, but there is no real-time monitoring or alerting for critical issues.
**Improvement**: Integrate a monitoring tool like Prometheus or Grafana to track metrics such as:

- Redis connection status
- PostgreSQL query performance
- METAR fetch success/failure rates
  Use tools like PagerDuty or Slack integrations to send alerts for critical failures.
