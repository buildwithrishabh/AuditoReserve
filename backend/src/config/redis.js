const Redis = require("ioredis");

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
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (error) => {
  console.log("❌ Redis Error:", error.message);
});

module.exports = redisClient;
