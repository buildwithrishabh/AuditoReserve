const crypto = require("crypto");
const redisClient = require("../config/redis");

/**
 * Acquire distributed lock
 */
const acquireLock = async (key, ttlMs = 30000) => {
  const lockValue = crypto.randomUUID();

  const result = await redisClient.set(key, lockValue, "NX", "PX", ttlMs);

  if (result !== "OK") {
    return null;
  }

  return {
    key,
    value: lockValue,
  };
};

/**
 * Release lock safely
 * Only lock owner can release it
 */
const releaseLock = async (key, value) => {
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1]
    then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redisClient.eval(script, 1, key, value);

  return result === 1;
};

module.exports = {
  acquireLock,
  releaseLock,
};
