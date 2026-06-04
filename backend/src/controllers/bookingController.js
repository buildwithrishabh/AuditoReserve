const Booking = require("../models/booking");
const Auditorium = require("../models/auditorium");
const User = require("../models/User");
const sendEmail = require("../service/email");
const { bookingUpdatedEmail } = require("../utils/EmailOptions");

exports.createBooking = async (req, res, next) => {
  try {
    // Extract request body inputs
    const { auditoriumId, bookingDate, startTime, endTime, purpose } = req.body;

    // Retrieve user ID from req.user (typically populated by Auth middleware)
    const userId = req.user.id;

    // ===============================
    // Validation
    // ===============================

    // Ensure all mandatory fields are provided in the request body
    if (!auditoriumId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // ===============================
    // Validate Time Format
    // ===============================

    // Regex pattern matching 24-hour time format: H:MM or HH:MM (e.g. 09:30 or 23:59)
    const timePattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

    // Validate both start and end time formats
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use 24-hour format like 09:30 or 14:00",
      });
    }

    // ===============================
    // Normalize Time
    // ===============================

    // Function to add leading zero for single digit hours (e.g. "9:30" -> "09:30")
    // This allows accurate alphabetical string comparisons
    const normalizeTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":");

      return `${hours.padStart(2, "0")}:${minutes}`;
    };

    const formattedStartTime = normalizeTime(startTime);
    const formattedEndTime = normalizeTime(endTime);

    // ===============================
    // Validate Start & End Time
    // ===============================

    // Ensure start time is strictly before end time
    if (formattedStartTime >= formattedEndTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    // ===============================
    // Validate Booking Date & Time
    // ===============================

    const now = new Date();

    const selectedDate = new Date(bookingDate);

    // Normalize today's date to midnight (00:00:00) for a clean date comparison
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Normalize requested booking date to midnight (00:00:00)
    const bookingDay = new Date(selectedDate);
    bookingDay.setHours(0, 0, 0, 0);

    // Prevent bookings on dates in the past
    if (bookingDay < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date must be today or future",
      });
    }

    // Parse the start hours and minutes to build the precise start datetime
    const [startHour, startMinute] = formattedStartTime
      .split(":")
      .map(Number);

    const bookingStartDateTime = new Date(selectedDate);

    bookingStartDateTime.setHours(
      startHour,
      startMinute,
      0,
      0
    );

    // Prevent booking slots that have already passed today
    if (bookingStartDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Cannot book a past time slot",
      });
    }

    // ===============================
    // Find Auditorium
    // ===============================

    // Verify if the requested auditorium exists in the database
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

    // Query for any existing booking in the same auditorium, same day,
    // that overlaps with the requested time range.
    // Interval overlap logic: Start_A < End_B AND End_A > Start_B
    const overlappingBooking = await Booking.findOne({
      auditorium: auditoriumId,
      bookingDate: bookingDay,

      // Only check active (pending or confirmed) bookings
      status: {
        $in: ["pending", "confirmed"],
      },

      // Conflicted if existing booking starts before the new booking ends
      startTime: {
        $lt: formattedEndTime,
      },

      // Conflicted if existing booking ends after the new booking starts
      endTime: {
        $gt: formattedStartTime,
      },
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // ===============================
    // Calculate Total Price
    // ===============================

    // Calculate booking duration in minutes
    const [startH, startM] = formattedStartTime.split(":").map(Number);
    const [endH, endM] = formattedEndTime.split(":").map(Number);

    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);

    // Convert duration to hours
    const totalHours = totalMinutes / 60;

    // Multiply hours by auditorium's hourly rate and round to the nearest whole number
    const totalPrice = Math.round(totalHours * auditorium.basePrice);

    // ===============================
    // Create Booking
    // ===============================

    // Save the new booking document with 'pending' status
    const booking = await Booking.create({
      user: userId,
      auditorium: auditoriumId,
      bookingDate: bookingDay,

      startTime: formattedStartTime,
      endTime: formattedEndTime,

      purpose,
      totalPrice,
      status: "pending",
    });

    // ===============================
    // Response
    // ===============================

    // Return the created booking response to the user
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    // Log the error and hand over to the global error middleware
    console.log(error);
    next(error);
  }
};

// ===============================
// Get Logged In User Bookings
// ===============================
exports.getUserBookings = async (req, res, next) => {
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
    next(error);
  }
};

// ===============================
// Get All Bookings (Admin)
// ===============================
exports.getAllBookings = async (req, res, next) => {
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
    next(error);
  }
};

// ===============================
// Update Booking Status (Admin)
// ===============================
exports.updateBookingStatus = async (req, res, next) => {
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
    next(error);
  }
};

// ===============================
// Cancel User Booking
// ===============================
exports.cancelBooking = async (req, res, next) => {
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
    next(error);
  }
};
