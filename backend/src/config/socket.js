const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { parseCookie } = require("cookie");
const logger = require("./logger");
const redisClient = require("./redis");
const { createAdapter } = require("@socket.io/redis-adapter");

let io;
let pubClient;
let subClient;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://audito-reserve.vercel.app",
]
  .filter(Boolean)
  .flatMap((url) => url.split(",").map((s) => s.trim().replace(/\/$/, "")));

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch (err) {
    // invalid URL
  }
  return false;
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        logger.warn(`[Socket] CORS blocked request from origin: ${origin}`);
        return callback(new Error(`CORS policy does not allow socket access from ${origin}`));
      },
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Pub/Sub for scaling server
  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();

  pubClient.on("error", (err) => {
    logger.error("[Socket] Redis PubClient error:", err);
  });
  subClient.on("error", (err) => {
    logger.error("[Socket] Redis SubClient error:", err);
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const cookies = parseCookie(cookieHeader);
      let token =
        cookies.accessToken ||
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      if (typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id; // Attaching user Id to socket
      next();
    } catch (error) {
      logger.error("Socket authentication failed:", error.message || error);
      next(new Error("Authentication error: Invalid credentials"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(`user:${userId}`);
    logger.info(
      `[Socket] User connected: ${userId} joined room user:${userId}`,
    );

    socket.on("disconnect", () => {
      logger.info(
        `[Socket] User disconnected: ${userId} (Socket ID: ${socket.id})`,
      );
    });
  });
  return io;
};

const sendRealTimeNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId.toString()}`).emit("notification", notification);
    logger.info(
      `[Socket] Real-time notification routed to room user:${userId}`,
    );
  }
};

const closeSocket = async () => {
  try {
    if (io) {
      await new Promise((resolve) => io.close(resolve));
      logger.info("[Socket] Socket.io server closed.");
    }
    if (pubClient) {
      await pubClient.quit();
      logger.info("[Socket] Redis PubClient closed.");
    }
    if (subClient) {
      await subClient.quit();
      logger.info("[Socket] Redis SubClient closed.");
    }
  } catch (err) {
    logger.error("[Socket] Error closing socket/redis adapter:", err);
  }
};

module.exports = {
  initSocket,
  closeSocket,
  sendRealTimeNotification,
  getIo: () => io,
};
