const AIRPORTS = {
  AUCKLAND: "NZAA",
  WELLINGTON: "NZWN",
  CHRISTCHURCH: "NZCH",
};

const REDIS = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  expiry: 300, // 5 minutes in seconds
};

module.exports = {
  AIRPORTS,
  REDIS,
};
