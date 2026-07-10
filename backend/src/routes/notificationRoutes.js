const express = require("express");
const notificationRouter = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Apply auth middleware to protect all routes
notificationRouter.use(protect);

notificationRouter.get("/", getNotifications);
notificationRouter.get("/unread-count", getUnreadCount);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id", markAsRead);
notificationRouter.delete("/:id", deleteNotification);

module.exports = notificationRouter;

