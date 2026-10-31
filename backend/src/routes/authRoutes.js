const express = require("express");
const authroutes = express.Router();

// controllers
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

const { protect } = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");
const validate = require("../middlewares/validateMiddleware");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgetPassSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} = require("../validators/authValidators");

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

authroutes.post("/register", registerLimiter, validate(registerSchema), register);
authroutes.get("/verify-email", validate(verifyEmailSchema), verifyEmail);
authroutes.post(
  "/resend-verification",
  resendVerifyLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmail
);
authroutes.post("/login", loginLimiter, validate(loginSchema), login);
authroutes.post("/refresh", refreshLimiter, refresh);
authroutes.post("/logout", logout);
authroutes.post(
  "/forget-password",
  passwordResetLimiter,
  validate(forgetPassSchema),
  forgetPass
);
authroutes.post(
  "/reset-password/:token",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPassword
);
authroutes.get("/me", protect, getMe);

module.exports = authroutes;
