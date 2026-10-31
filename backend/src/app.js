const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { slidingWindowLimiter } = require("./middlewares/rateLimiter");

// Load env vars
dotenv.config();

const logger = require("./config/logger");

const app = express();

// Trust proxy (required behind reverse proxies like nginx, Cloudflare, etc.)
app.set("trust proxy", 1);

// General rate limiter for auth router (Redis sliding window)
const authLimiter = slidingWindowLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  prefix: "rl:auth:general",
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


app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined", { stream: logger.stream }));
} else {
  app.use(morgan("dev", { stream: logger.stream }));
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// routes
const authroutes = require("./routes/authRoutes");
const auditoriumRoutes = require("./routes/auditoriumRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const notificationRouter = require("./routes/notificationRoutes");

// Error handling middlewares
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

app.use("/api/auth", authLimiter, authroutes);
app.use("/api/auditoriums", auditoriumRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRouter);
app.use("/api/notifications", notificationRouter);

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
