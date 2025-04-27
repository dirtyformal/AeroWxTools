const REDIS = {
  url: process.env.REDIS_URL || "redis://default:metar_password@localhost:6379",
  expiry: 300,
};

const POSTGRES = {
  url:
    process.env.DATABASE_URL ||
    "postgresql://metar_user:metar_password@localhost:5432/vatsim_metar",
};

module.exports = {
  REDIS,
  POSTGRES,
};
