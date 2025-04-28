const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const LokiTransport = require("winston-loki");

const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} ${level.toUpperCase()}: ${message} ${metaStr}`;
  }
);

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, "../../../logs/error-%DATE%.log"),
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, "../../../logs/info-%DATE%.log"),
      level: "info",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, "../../../logs/debug-%DATE%.log"),
      level: "debug",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    ...(isProduction
      ? []
      : [
          new winston.transports.Console({
            level: "debug",
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]),
    new LokiTransport({
      host: process.env.LOKI_HOST || "https://localhost:3100",
      json: true,
      labels: {
        job: "aerowx-tools",
        environment: process.env.NODE_ENV || "development",
      },
      batching: true,
      interval: 5,
      gracefulShutdown: true,
    }),
  ],
});

module.exports = logger;
