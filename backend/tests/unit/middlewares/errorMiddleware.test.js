const { notFound, errorHandler } = require("../../../src/middlewares/errorMiddleware");

describe("Unit: Error Middleware", () => {
  describe("notFound handler", () => {
    it("should respond with 404 and method + originalUrl", () => {
      const req = { method: "POST", originalUrl: "/api/nonexistent" };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      notFound(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Route not found: POST /api/nonexistent",
      });
    });
  });

  describe("errorHandler handler", () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it("should handle Mongoose CastError with 400 status", () => {
      const err = {
        name: "CastError",
        value: "invalid_object_id_123",
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid resource identifier: invalid_object_id_123",
      });
    });

    it("should handle Mongoose ValidationError with 400 status and combined field messages", () => {
      const err = {
        name: "ValidationError",
        errors: {
          email: { message: "Please add an email" },
          password: { message: "Password must be at least 6 characters" },
        },
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please add an email, Password must be at least 6 characters",
      });
    });

    it("should handle Mongo duplicate key error (code 11000) with 409 status", () => {
      const err = {
        code: 11000,
        keyValue: { email: "duplicate@tmu.ac.in" },
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Duplicate entry for email. Already exists.",
      });
    });

    it("should handle Multer LIMIT_FILE_SIZE error with 400 status", () => {
      const err = { code: "LIMIT_FILE_SIZE" };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "File size exceeds the 5MB limit",
      });
    });

    it("should handle Multer LIMIT_UNEXPECTED_FILE error with 400 status", () => {
      const err = { code: "LIMIT_UNEXPECTED_FILE" };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Too many files uploaded. Maximum allowed is 5.",
      });
    });

    it("should respect custom error status code if provided", () => {
      const err = new Error("Custom forbidden action");
      err.status = 403;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Custom forbidden action",
      });
    });

    it("should default to 500 Internal server error for unhandled exceptions in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const err = new Error("Database crashed or secret leak");

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should show original error message in non-production environments", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const err = new Error("Detailed development debug error");

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Detailed development debug error",
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});

