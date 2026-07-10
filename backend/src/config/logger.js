const winston = require("winston");

// Development Format: clean colorized string with optional stack trace
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // Automatically capture stack trace
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

// Production Format: raw JSON with timestamps and error stack traces
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  // Level is 'info' in production, 'debug' in development (can override via LOG_LEVEL env)
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: process.env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console()
  ],
});

// Stream wrapper for Morgan HTTP logging middleware
logger.stream = {
  write: (message) => logger.http(message.trim()), // log HTTP requests at 'http' level
};

module.exports = logger;
