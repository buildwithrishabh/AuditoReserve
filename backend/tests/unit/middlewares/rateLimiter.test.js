const { slidingWindowLimiter } = require("../../../src/middlewares/rateLimiter");
const redisClient = require("../../../src/config/redis");

describe("Unit: Sliding Window Rate Limiter Middleware", () => {
  beforeEach(async () => {
    await redisClient.flushall();
  });

  it("should allow requests under the limit and set rate limit headers", async () => {
    const limiter = slidingWindowLimiter({
      windowMs: 60000,
      max: 5,
      prefix: "rl:test:allow",
    });

    const req = { ip: "192.168.1.10", user: { id: "user_limit_1" } };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 5);
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 4);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block requests exceeding the limit and return 429 with Retry-After", async () => {
    const max = 3;
    const limiter = slidingWindowLimiter({
      windowMs: 10000,
      max,
      prefix: "rl:test:block",
    });

    const req = { ip: "10.0.0.1" };
    const next = jest.fn();

    // Consume all allowed slots
    for (let i = 0; i < max; i++) {
      const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      await limiter(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(max);

    // 4th request must be blocked
    const blockedRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const blockedNext = jest.fn();

    await limiter(req, blockedRes, blockedNext);

    expect(blockedNext).not.toHaveBeenCalled();
    expect(blockedRes.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(Number));
    expect(blockedRes.status).toHaveBeenCalledWith(429);
    expect(blockedRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Too many requests. Try again later.",
      })
    );
  });

  it("should fail open and call next() if Redis eval encounters an error", async () => {
    const limiter = slidingWindowLimiter({ prefix: "rl:test:error" });

    // Spy and make redisClient.eval reject
    const evalSpy = jest.spyOn(redisClient, "eval").mockRejectedValueOnce(new Error("Redis offline"));

    const req = { ip: "127.0.0.1" };
    const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    evalSpy.mockRestore();
  });
});

