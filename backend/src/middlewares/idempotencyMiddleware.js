const redisClient = require("../config/redis");
const logger = require("../config/logger");

const idempotency = (options = {}) => {
  const {
    ttl = 86400, // 24 ghante tak response cache rahega
    lockTimeout = 30, // 30 seconds tak processing request lock
    required = false, // true hone par header na aane par 400 error dega
    prefix = "idempotency",
  } = options;

  return async (req, res, next) => {
    // 1. Idempotency key header check kar rha hai
    let idempotencyKey =
      req.headers["idempotency-key"] || req.headers["x-idempotency-key"];

    if (!idempotencyKey) {
      if (required) {
        return res.status(400).json({
          success: false,
          message: "Idempotency key is required",
        });
      }
      return next();
    }

    // Key for specific user so that another user cannot replay another user's response
    const userId = req.user?.id || req.user?._id || "anonymous";
    const redisKey = `${prefix}:${userId}:${idempotencyKey}`;

    try {
      const cachedRecord = await redisClient.get(redisKey);

      if (cachedRecord) {
        // Case A: Request abhi process ho rahi hain
        if (cachedRecord === "PROCESSING") {
          return res.status(409).json({
            success: false,
            message:
              "A request with this Idempotency-Key is currently being processed. Please wait.",
          });
        }

        // Case B: Request pehle complete ho chuki hai -> cached response replay karein
        const { statusCode, body, headers } = JSON.parse(cachedRecord);

        // Client ko batana hai ki ye cached idempotent response hai
        res.set("X-Idempotent-Replayed", "true");
        if (headers && headers["content-type"]) {
          res.set("Content-Type", headers["content-type"]);
        }

        return res.status(statusCode).json(body);
      }

      // First time request aayi hai -> "PROCESSING" lock acquire karna hai
      const lockAcquired = await redisClient.set(
        redisKey,
        "PROCESSING",
        "NX",
        "EX",
        lockTimeout,
      );

      // Agar race condition mein lock nahi mila -> duplicate request is already in progress
      if (!lockAcquired) {
        return res.status(409).json({
          success: false,
          message: "A duplicate request is already in progress.",
        });
      }

      // res.json ko intercept karo taaki response capture karke Redis mein save kar sakein
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        const statusCode = res.statusCode || 200;

        // Sirf successful/valid response cache karne hain, 500 server error par lock release karna hoga
        if (statusCode < 500) {
          const responsePayload = JSON.stringify({
            statusCode,
            body,
            headers: {
              "content-type": res.get("Content-Type") || "application/json",
            },
          });

          redisClient
            .set(redisKey, responsePayload, "EX", ttl)
            .catch((error) => {
              logger.error(
                `Idempotency cache set failed for key: ${redisKey}`,
                error,
              );
            });
        } else {
          // Server error par lock release karna hai
          redisClient.del(redisKey).catch(() => {});
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`Idempotency middleware error for key: ${redisKey}`, error);
      next();
    }
  };
};

module.exports = idempotency;
