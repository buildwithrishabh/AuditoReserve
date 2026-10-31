const idempotency = require("../../../src/middlewares/idempotencyMiddleware");
const redisClient = require("../../../src/config/redis");

describe("Unit: Idempotency Middleware", () => {
  let req, res, next;

  beforeEach(async () => {
    await redisClient.flushall();
    req = {
      headers: {},
      user: { id: "user_123" },
    };
    res = {
      statusCode: 200,
      set: jest.fn(),
      get: jest.fn().mockReturnValue("application/json"),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => data),
    };
    next = jest.fn();
  });

  it("should proceed normally if no idempotency key is provided and required is false", async () => {
    const middleware = idempotency({ required: false });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 Bad Request if idempotency key is missing and required is true", async () => {
    const middleware = idempotency({ required: true });
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Idempotency key is required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should process the first request and store the response in Redis", async () => {
    const middleware = idempotency({ required: true, ttl: 60 });
    req.headers["idempotency-key"] = "test-key-001";

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    // Simulate controller sending response
    const payload = { success: true, bookingId: "bk_999" };
    res.statusCode = 201;
    res.json(payload);

    // Allow async redis set to complete
    await new Promise((r) => setTimeout(r, 50));

    const cached = await redisClient.get("idempotency:user_123:test-key-001");
    expect(cached).toBeDefined();
    const parsed = JSON.parse(cached);
    expect(parsed.statusCode).toBe(201);
    expect(parsed.body).toEqual(payload);
  });

  it("should return 409 Conflict if another request with the same key is currently PROCESSING", async () => {
    const middleware = idempotency({ required: true });
    req.headers["idempotency-key"] = "test-key-in-flight";

    // Pre-populate key as PROCESSING in Redis
    await redisClient.set("idempotency:user_123:test-key-in-flight", "PROCESSING");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("currently being processed"),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should replay the cached response with X-Idempotent-Replayed header on duplicate request", async () => {
    const middleware = idempotency({ required: true });
    req.headers["idempotency-key"] = "test-key-completed";

    // Pre-populate completed response in Redis
    const previousResponse = {
      statusCode: 200,
      body: { success: true, message: "Order placed" },
      headers: { "content-type": "application/json" },
    };
    await redisClient.set(
      "idempotency:user_123:test-key-completed",
      JSON.stringify(previousResponse)
    );

    await middleware(req, res, next);

    expect(res.set).toHaveBeenCalledWith("X-Idempotent-Replayed", "true");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Order placed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should clear Redis key if the controller response has status >= 500 so retries are allowed", async () => {
    const middleware = idempotency({ required: true });
    req.headers["idempotency-key"] = "test-key-server-error";

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Controller responds with 500 error
    res.statusCode = 500;
    res.json({ success: false, message: "Internal server error" });

    await new Promise((r) => setTimeout(r, 50));

    const redisRecord = await redisClient.get("idempotency:user_123:test-key-server-error");
    expect(redisRecord).toBeNull();
  });

  it("should isolate idempotency keys across different users", async () => {
    const middleware = idempotency({ required: true });

    // User A request
    const reqA = {
      headers: { "idempotency-key": "shared-key" },
      user: { id: "user_A" },
    };
    const resA = {
      statusCode: 200,
      set: jest.fn(),
      get: jest.fn().mockReturnValue("application/json"),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const nextA = jest.fn();

    await middleware(reqA, resA, nextA);
    expect(nextA).toHaveBeenCalledTimes(1);
    resA.json({ user: "A" });

    // User B request with the same idempotency key
    const reqB = {
      headers: { "idempotency-key": "shared-key" },
      user: { id: "user_B" },
    };
    const resB = {
      statusCode: 200,
      set: jest.fn(),
      get: jest.fn().mockReturnValue("application/json"),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const nextB = jest.fn();

    await middleware(reqB, resB, nextB);
    expect(nextB).toHaveBeenCalledTimes(1); // User B is not blocked by User A
  });
});

