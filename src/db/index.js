const { Pool } = require("pg");
const { POSTGRES } = require("../config/config");

const pool = new Pool({
  connectionString: POSTGRES.url,
});

module.exports = pool;
