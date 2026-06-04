const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// Load env vars
dotenv.config();

const app = express();

// Trust proxy (required behind reverse proxies like nginx, Cloudflare, etc.)
app.set("trust proxy", 1);

// Rate limiting for auth endpoints (prevents brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(
      /\/$/,
      "",
    ),
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// routes
const authroutes = require("./routes/authRoutes");
const auditoriumRoutes = require("./routes/auditoriumRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

app.use("/api/auth", authLimiter, authroutes);
app.use("/api/auditoriums", auditoriumRoutes);
app.use("/api/bookings", bookingRoutes);

// Global error handler (does not leak error details in production)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Catch Multer limit / field errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds the 5MB limit",
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Too many files uploaded. Maximum allowed is 5.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

module.exports = app;
