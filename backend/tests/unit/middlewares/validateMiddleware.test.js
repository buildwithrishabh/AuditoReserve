const { z } = require("zod");
const validate = require("../../../src/middlewares/validateMiddleware");

describe("Unit: Validate Middleware (Zod)", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should call next() when request body matches schema", () => {
    const schema = {
      body: z.object({
        email: z.string().email(),
        count: z.coerce.number().positive(),
      }),
    };

    req.body = { email: "test@example.com", count: "5" };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    // Verify type coercion
    expect(req.body.count).toBe(5);
  });

  it("should return 400 with formatted error message and issues when validation fails", () => {
    const schema = {
      body: z.object({
        name: z.string({ message: "Name is required" }).min(1, "Name is required"),
        age: z.coerce.number({ message: "Age must be a number" }).positive("Age must be positive"),
      }),
    };

    req.body = { age: -5 };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
          }),
        ]),
      })
    );
  });

  it("should validate params and query independently", () => {
    const schema = {
      params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID"),
      }),
      query: z.object({
        page: z.coerce.number().int().min(1),
      }),
    };

    req.params = { id: "507f1f77bcf86cd799439011" };
    req.query = { page: "2" };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query.page).toBe(2);
  });

  it("should reject invalid params with 400", () => {
    const schema = {
      params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID"),
      }),
    };

    req.params = { id: "invalid-id" };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid ID",
      })
    );
  });

  it("should support passing a raw Zod schema directly for req.body", () => {
    const rawSchema = z.object({
      username: z.string().min(3),
    });

    req.body = { username: "alice" };

    const middleware = validate(rawSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should call next() if no schema is provided", () => {
    const middleware = validate(null);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

