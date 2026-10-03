const express = require("express");

const router = express.Router();

const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  getCalendarBooking,
} = require("../controllers/bookingController");

const { protect, authorizeRole, isverified } = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");

// Limiters for booking routes
const bookingCreateLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 5,
  prefix: "rl:booking:create",
});

const bookingCancelLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: "rl:booking:cancel",
});

const calendarLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: "rl:booking:calendar",
});

const userBookingsLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 30,
  prefix: "rl:booking:user",
});

// ======================================
// Student Routes
// ======================================

// Get Calendar Bookings (for availability checks)
router.get("/calendar", protect, isverified, calendarLimiter, getCalendarBooking);

// Create Booking
router.post(
  "/createBooking",
  protect,
  isverified,
  authorizeRole("student"),
  bookingCreateLimiter,
  createBooking
);

// Get Logged In User Bookings
router.get(
  "/my-bookings",
  protect,
  isverified,
  authorizeRole("student"),
  userBookingsLimiter,
  getUserBookings
);

// Cancel Booking
router.put(
  "/cancel/:id",
  protect,
  isverified,
  authorizeRole("student"),
  bookingCancelLimiter,
  cancelBooking
);

// ======================================
// Admin Routes
// ======================================

// Get All Bookings
router.get("/all", protect, isverified, authorizeRole("admin"), getAllBookings);

// Update Booking Status
router.put("/status/:id", protect, isverified, authorizeRole("admin"), updateBookingStatus);

module.exports = router;
