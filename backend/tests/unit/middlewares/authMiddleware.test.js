const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { protect, authorizeRole, isverified } = require("../../../src/middlewares/authMiddleware");
const User = require("../../../src/models/User");
const { createTestUser, createUnverifiedUser } = require("../../helpers/authHelper");

describe("Unit: Auth Middleware", () => {
  describe("protect middleware", () => {
    it("should reject with 401 when no token is provided in headers or cookies", async () => {
      const req = { cookies: {}, headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized, no token",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should accept valid bearer token in Authorization header and attach user without password", async () => {
      const { user, accessToken } = await createTestUser();
      const req = {
        headers: { authorization: `Bearer ${accessToken}` },
        cookies: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.password).toBeUndefined();
    });

    it("should accept valid token in req.cookies.accessToken", async () => {
      const { user, accessToken } = await createTestUser();
      const req = {
        cookies: { accessToken },
        headers: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it("should reject with 401 if JWT token is invalid or tampered", async () => {
      const req = {
        headers: { authorization: "Bearer invalid.jwt.token" },
        cookies: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized, token failed",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject with 401 if token was signed with a different secret", async () => {
      const fakeToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        "wrong_secret_key_123"
      );
      const req = {
        headers: { authorization: `Bearer ${fakeToken}` },
        cookies: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized, token failed",
        })
      );
    });

    it("should reject with 401 if token is valid but the user was deleted from the database", async () => {
      const { user, accessToken } = await createTestUser();
      await User.findByIdAndDelete(user._id);

      const req = {
        headers: { authorization: `Bearer ${accessToken}` },
        cookies: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "User no longer exists",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("authorizeRole middleware", () => {
    it("should allow request if user has one of the allowed roles", () => {
      const req = { user: { role: "admin" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorizeRole("admin", "superadmin");
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject with 403 Forbidden if user role is not authorized", () => {
      const req = { user: { role: "student" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorizeRole("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized to perform this action",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isverified middleware", () => {
    it("should allow request if user isVerified is true", () => {
      const req = { user: { isVerified: true } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      isverified(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject with 401 if user isVerified is false", () => {
      const req = { user: { isVerified: false } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      isverified(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Please verify your email to access this feature",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

