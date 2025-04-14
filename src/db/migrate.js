const fs = require("fs");
const path = require("path");
const { pool } = require("./index");
const logger = require("../utils/logging/winston");

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "migrations", "001_add_observation_time.sql"),
      "utf8"
    );

    await client.query(sql);
    logger.info("Migration completed successfully");
  } catch (error) {
    logger.error("Migration failed", { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

console.log("Script Run");
