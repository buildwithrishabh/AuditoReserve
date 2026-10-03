const redisClient = require("../config/redis");
const logger = require("../config/logger");

// Atomic Sliding Window Log Lua script
const SLIDING_WINDOW_LUA = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowStart = tonumber(ARGV[2])
  local maxRequests = tonumber(ARGV[3])
  local windowMs = tonumber(ARGV[4])
  local member = ARGV[5]

  -- 1. Remove entries older than windowStart
  redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

  -- 2. Count active requests
  local count = redis.call('ZCARD', key)

  -- 3. If limit reached, return oldest timestamp for retry-after calculation
  if count >= maxRequests then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    return {0, count, oldest[2]}
  end

  -- 4. Record new hit and refresh TTL
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, windowMs)

  return {1, count + 1, 0}
`;

exports.slidingWindowLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 10;
  const prefix = options.prefix || "rl:sliding";

  return async (req, res, next) => {
    try {
      const clientId = req.user?.id || req.ip || "unknown";
      const key = `${prefix}:${clientId}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      const member = `${now}:${Math.random().toString(36).slice(2, 9)}`;

      // Execute atomically in Redis
      const [allowed, currentCount, oldestScore] = await redisClient.eval(
        SLIDING_WINDOW_LUA,
        1,
        key,
        now,
        windowStart,
        max,
        windowMs,
        member
      );

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - currentCount));

      if (!allowed) {
        const oldestTime = Number(oldestScore);
        const retryAfter = oldestTime
          ? Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000))
          : Math.ceil(windowMs / 1000);

        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({
          success: false,
          message: "Too many requests. Try again later.",
          retryAfter: `${retryAfter}s`,
        });
      }

      next();
    } catch (error) {
      logger.error("[RateLimiter]", error);
      next(); // Fail open
    }
  };
};
