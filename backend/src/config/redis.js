const Redis = require("ioredis");
const logger = require("./logger");

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,

  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

// ======================================
// EVENTS
// ======================================
redisClient.on("connect", () => {
  logger.info("Redis connected successfully");
});

redisClient.on("error", (error) => {
  logger.error("Redis Error:", error);
});

module.exports = redisClient;
