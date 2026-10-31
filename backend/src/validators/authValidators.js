const { z } = require("zod");

// Register validation
const registerSchema = {
  body: z.object({
    name: z
      .string({ message: "Please fill all fields" })
      .trim()
      .min(1, "Please fill all fields"),
    email: z
      .string({ message: "Please fill all fields" })
      .trim()
      .min(1, "Please fill all fields")
      .email("Invalid email address"),
    password: z
      .string({ message: "Please fill all fields" })
      .min(1, "Please fill all fields"),
  }),
};

// Login validation
const loginSchema = {
  body: z.object({
    email: z
      .string({ message: "Please fill all fields" })
      .trim()
      .min(1, "Please fill all fields")
      .email("Invalid email address"),
    password: z
      .string({ message: "Please fill all fields" })
      .min(1, "Please fill all fields"),
  }),
};

// Verify email validation
const verifyEmailSchema = {
  query: z.object({
    token: z
      .string({ message: "Verification token is missing" })
      .trim()
      .min(1, "Verification token is missing"),
  }),
};

// Forget password validation
const forgetPassSchema = {
  body: z.object({
    email: z
      .string({ message: "Please provide email" })
      .trim()
      .min(1, "Please provide email")
      .email("Invalid email address"),
  }),
};

// Reset password validation
const resetPasswordSchema = {
  params: z.object({
    token: z
      .string({ message: "Reset token is required" })
      .trim()
      .min(1, "Reset token is required"),
  }),
  body: z.object({
    password: z
      .string({ message: "Password is required" })
      .min(1, "Password is required"),
  }),
};

// Resend verification email validation
const resendVerificationSchema = {
  body: z.object({
    email: z
      .string({ message: "Please provide an email address" })
      .trim()
      .min(1, "Please provide an email address")
      .email("Invalid email address"),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgetPassSchema,
  resetPasswordSchema,
  resendVerificationSchema,
};
