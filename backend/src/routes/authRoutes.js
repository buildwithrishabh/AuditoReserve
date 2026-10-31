const express = require("express");
const authroutes = express.Router();

// routes
const {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgetPass,
  resetPassword,
  getMe,
  resendVerificationEmail,
} = require("../controllers/authController");

const {
  protect,
} = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");

// Limiters for auth routes
const registerLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: "rl:auth:register",
});

const loginLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: "rl:auth:login",
});

const passwordResetLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: "rl:auth:forget-password",
});

const resendVerifyLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  prefix: "rl:auth:resend-verify",
});

const refreshLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  prefix: "rl:auth:refresh",
});

authroutes.post("/register", registerLimiter, register);
authroutes.get("/verify-email", verifyEmail);
authroutes.post("/resend-verification", resendVerifyLimiter, resendVerificationEmail);
authroutes.post("/login", loginLimiter, login);
authroutes.post("/refresh", refreshLimiter, refresh);
authroutes.post("/logout", logout);
authroutes.post("/forget-password", passwordResetLimiter, forgetPass);
authroutes.post("/reset-password/:token", passwordResetLimiter, resetPassword);
authroutes.get("/me", protect, getMe);

module.exports = authroutes;

