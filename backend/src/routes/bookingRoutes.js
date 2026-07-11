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

// ======================================
// Student Routes
// ======================================

// Get Calendar Bookings (for availability checks)
router.get("/calendar", protect, isverified, getCalendarBooking);

// Create Booking
router.post("/createBooking", protect, isverified, authorizeRole("student"), createBooking);

// Get Logged In User Bookings
router.get("/my-bookings", protect, isverified, authorizeRole("student"), getUserBookings);

// Cancel Booking
router.put("/cancel/:id", protect, isverified, authorizeRole("student"), cancelBooking);

// ======================================
// Admin Routes
// ======================================

// Get All Bookings
router.get("/all", protect, isverified, authorizeRole("admin"), getAllBookings);

// Update Booking Status
router.put("/status/:id", protect, isverified, authorizeRole("admin"), updateBookingStatus);

module.exports = router;
