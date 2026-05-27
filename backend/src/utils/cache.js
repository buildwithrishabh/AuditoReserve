const redisClient = require("../config/redis");

exports.getOrSetCache = async (key, callback, ttl = 300) => {
  try {
    const cachedData = await redisClient.get(key);

    if (cachedData) return JSON.parse(cachedData);

    const freshData = await callback();
    await redisClient.set(key, JSON.stringify(freshData), "EX", ttl);

    return freshData;
  } catch (error) {
    console.log("Redis Error:", error.message);
    return callback();
  }
};

exports.delPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (error) {
    console.log("Redis Error:", error.message);
  }
};

exports.del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.log(error.message);
  }
};
