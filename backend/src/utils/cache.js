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
          console.log("Redis Delete Error:", err.message);
        }
        stream.resume();
      }
    });

    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
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
