const express = require("express");
const notificationRouter = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Limiters for notifications
const notificationReadLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: "rl:notification:read",
});

const notificationMutateLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 30,
  prefix: "rl:notification:mutate",
});

// Apply auth middleware to protect all routes
notificationRouter.use(protect);

notificationRouter.get("/", notificationReadLimiter, getNotifications);
notificationRouter.get("/unread-count", notificationReadLimiter, getUnreadCount);
notificationRouter.patch("/read-all", notificationMutateLimiter, markAllAsRead);
notificationRouter.patch("/:id", notificationMutateLimiter, markAsRead);
notificationRouter.delete("/:id", notificationMutateLimiter, deleteNotification);

module.exports = notificationRouter;

