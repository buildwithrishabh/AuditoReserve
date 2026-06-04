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

authroutes.post("/register", register);
authroutes.get("/verify-email", verifyEmail);
authroutes.post("/resend-verification", resendVerificationEmail);
authroutes.post("/login", login);
authroutes.post("/refresh", refresh);
authroutes.post("/logout", logout);
authroutes.post("/forget-password", forgetPass);
authroutes.post("/reset-password/:token", resetPassword);
authroutes.get("/me", protect, getMe);

module.exports = authroutes;
