const redisClient = require("../config/redis");
const logger = require("../config/logger");

exports.getOrSetCache = async (key, callback, ttl = 300) => {
  try {
    const cachedData = await redisClient.get(key);

    if (cachedData) return JSON.parse(cachedData);

    const freshData = await callback();
    await redisClient.set(key, JSON.stringify(freshData), "EX", ttl);

    return freshData;
  } catch (error) {
    logger.error("Redis Error:", error);
    return callback();
  }
};

exports.delPattern = async (pattern) => {
  try {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on("data", async (keys) => {
      if (keys.length > 0) {
        stream.pause();
        try {
          await redisClient.del(...keys);
        } catch (err) {
          logger.error("Redis Delete Error:", err);
        }
        stream.resume();
      }
    });

    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  } catch (error) {
    logger.error("Redis Error:", error);
  }
};


exports.del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error("Redis Delete Error:", error);
  }
};
