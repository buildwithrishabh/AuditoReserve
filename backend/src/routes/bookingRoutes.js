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

const {
  protect,
  authorizeRole,
  isverified,
} = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");
const validate = require("../middlewares/validateMiddleware");
const {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
  calendarBookingSchema,
  listBookingsQuerySchema,
} = require("../validators/bookingValidators");

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
router.get(
  "/calendar",
  protect,
  isverified,
  calendarLimiter,
  validate(calendarBookingSchema),
  getCalendarBooking
);

// Create Booking
router.post(
  "/createBooking",
  protect,
  isverified,
  authorizeRole("student"),
  bookingCreateLimiter,
  validate(createBookingSchema),
  createBooking,
);

// Get Logged In User Bookings
router.get(
  "/my-bookings",
  protect,
  isverified,
  authorizeRole("student"),
  userBookingsLimiter,
  validate(listBookingsQuerySchema),
  getUserBookings,
);

// Cancel Booking
router.put(
  "/cancel/:id",
  protect,
  isverified,
  authorizeRole("student"),
  bookingCancelLimiter,
  validate(cancelBookingSchema),
  cancelBooking,
);

// ======================================
// Admin Routes
// ======================================

// Get All Bookings
router.get(
  "/all",
  protect,
  isverified,
  authorizeRole("admin"),
  validate(listBookingsQuerySchema),
  getAllBookings
);

// Update Booking Status
router.put(
  "/status/:id",
  protect,
  isverified,
  authorizeRole("admin"),
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);

module.exports = router;
