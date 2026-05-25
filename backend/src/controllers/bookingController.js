const Booking = require("../models/booking");
const Auditorium = require("../models/auditorium");
const User = require("../models/User");
const sendEmail = require("../service/email");
const { bookingUpdatedEmail } = require("../utils/EmailOptions");

exports.createBooking = async (req, res) => {
  try {
    const { auditoriumId, bookingDate, startTime, endTime, purpose } = req.body;

    const userId = req.user.id;

    // ===============================
    // Validation
    // ===============================

    if (!auditoriumId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // ===============================
    // Validate Time Format
    // ===============================

    const timePattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use 24-hour format like 09:30 or 14:00",
      });
    }

    // ===============================
    // Normalize Time
    // ===============================

    const normalizeTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":");

      return `${hours.padStart(2, "0")}:${minutes}`;
    };

    const formattedStartTime = normalizeTime(startTime);
    const formattedEndTime = normalizeTime(endTime);

    // ===============================
    // Validate Start & End Time
    // ===============================

    if (formattedStartTime >= formattedEndTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    // ===============================
    // Check Future Booking Date
    // ===============================

    const today = new Date();
    const selectedDate = new Date(bookingDate);

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date must be today or future",
      });
    }

    // ===============================
    // Find Auditorium
    // ===============================

    const auditorium = await Auditorium.findById(auditoriumId);

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    // ===============================
    // Check Overlapping Bookings
    // ===============================

    const overlappingBooking = await Booking.findOne({
      auditorium: auditoriumId,
      bookingDate: selectedDate,

      status: {
        $in: ["pending", "confirmed"],
      },

      startTime: {
        $lt: formattedEndTime,
      },

      endTime: {
        $gt: formattedStartTime,
      },
    });

    // If slot already booked
    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // ===============================
    // Calculate Total Price
    // ===============================

    const [startH, startM] = formattedStartTime.split(":").map(Number);

    const [endH, endM] = formattedEndTime.split(":").map(Number);

    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);

    const totalHours = totalMinutes / 60;

    const totalPrice = Math.round(totalHours * auditorium.basePrice);

    // ===============================
    // Create Booking
    // ===============================

    const booking = await Booking.create({
      user: userId,
      auditorium: auditoriumId,
      bookingDate: selectedDate,

      // Save normalized times
      startTime: formattedStartTime,
      endTime: formattedEndTime,

      purpose,
      totalPrice,
      status: "pending",
    });

    // ===============================
    // Response
    // ===============================

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ===============================
// Get Logged In User Bookings
// ===============================
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate("auditorium")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ===============================
// Get All Bookings (Admin)
// ===============================
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("auditorium")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ===============================
// Update Booking Status (Admin)
// ===============================
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Allowed status
    const allowedStatus = ["pending", "confirmed", "cancelled"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ===============================================================
    // Concurrency Check: Prevent double-booking on Admin Confirmation
    // ===============================================================
    if (status === "confirmed") {
      const overlappingConfirmed = await Booking.findOne({
        _id: { $ne: booking._id }, // Exclude this booking itself from the search
        auditorium: booking.auditorium,
        bookingDate: booking.bookingDate,
        status: "confirmed",
        startTime: {
          $lt: booking.endTime,
        },
        endTime: {
          $gt: booking.startTime,
        },
      });

      if (overlappingConfirmed) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot confirm. This time slot conflicts with an already confirmed booking.",
        });
      }
    }

    booking.status = status;

    await booking.save();

    try {
      const user = await User.findById(booking.user);

      const emailData = await bookingUpdatedEmail(
        user,
        booking.id,
        booking.status,
      );

      await sendEmail(emailData);
    } catch (error) {
      console.log("Email sending failed:", error.message);
    }

    res.status(200).json({
      success: true,
      message: `Booking ${booking.status} successfully`,
      booking,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ===============================
// Cancel User Booking
// ===============================
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Prevent cancelling confirmed booking
    if (booking.status === "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Confirmed booking cannot be cancelled",
      });
    }

    booking.status = "cancelled";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
