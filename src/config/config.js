const AIRPORTS = {
  AUCKLAND: "NZAA",
  WELLINGTON: "NZWN",
  CHRISTCHURCH: "NZCH",
};

const REDIS = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  expiry: 300, // 5 minutes in seconds
};

const POSTGRES = {
  url:
    process.env.DATABASE_URL ||
    "postgresql://metar_user:metar_password@localhost:5432/vatsim_metar",
};

module.exports = {
  AIRPORTS,
  REDIS,
  POSTGRES,
};
