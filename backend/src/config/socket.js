const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { parseCookie } = require("cookie");
const logger = require("./logger");
const redisClient = require("./redis");
const { createAdapter } = require("@socket.io/redis-adapter");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(
        /\/$/,
        "",
      ),
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Pub/Sub for scaling server
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

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

module.exports = {
  initSocket,
  sendRealTimeNotification,
  getIo: () => io,
};
