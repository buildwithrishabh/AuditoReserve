const Redis = require("ioredis");

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

redisClient.on("connect", () => {
  console.log("Redis connected successfully.");
});

redisClient.on("error", (error) => {
  console.log("error connecting to redis : ", error);
});

exports.redisConnect = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log("error connecting to redis : ", error);
  }
};

module.exports = { redisClient, redisConnect };
