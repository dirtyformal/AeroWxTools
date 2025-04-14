const winston = require("winston");

// Custom format for consistent log structure
const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} ${level.toUpperCase()}: ${message} ${metaStr}`;
  }
);

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    // Info and above logs
    new winston.transports.File({
      filename: "info.log",
      level: "info",
    }),
    // Debug and above logs
    new winston.transports.File({
      filename: "debug.log",
      level: "debug",
    }),
    // Console output with colors (info level only)
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

module.exports = logger;
