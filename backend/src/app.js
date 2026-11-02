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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Dynamic CORS allowing FRONTEND_URL, localhost, and all Vercel deployments (*.vercel.app)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://audito-reserve.vercel.app",
]
  .filter(Boolean)
  .flatMap((url) => url.split(",").map((s) => s.trim().replace(/\/$/, "")));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Automatically permit any Vercel deployment (*.vercel.app)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch (err) {
        // invalid URL
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`CORS policy does not allow access from ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "idempotency-key"],
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
