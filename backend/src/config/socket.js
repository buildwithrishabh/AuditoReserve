const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { parseCookie } = require("cookie");
const logger = require("./logger");

let io;

const userSockets = new Map();

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
    pingTimeout: 5000
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = parseCookie(cookieHeader);
      const token = cookies.accessToken || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: NO Token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id; // Attaching user Id to socket;
      next();
    } catch (error) {
      logger.error("Socket authentication failed:", error);
      next(new Error("Authentication error: Invalid credentials"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info(`[socket] User connected: ${userId} (socket Id ${socket.id})`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.on("disconnect", () => {
      logger.info(
        `[Socket] User disconnected: ${userId} (Socket ID: ${socket.id})`,
      );
      const activeSockets = userSockets.get(userId);
      if (activeSockets) {
        activeSockets.delete(socket.id);
        if (activeSockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });
  return io;
};

const sendRealTimeNotification = (userId, notification) => {
  if (io && userSockets.has(userId)) {
    const activeSockets = userSockets.get(userId);
    activeSockets.forEach((socketId) => {
      io.to(socketId).emit("notification", notification);
    });
    logger.info(`[Socket] Real-time notification sent to user ${userId}`);
  }
};

module.exports = {
    initSocket,
    sendRealTimeNotification,
    getIo: () => io,
}
