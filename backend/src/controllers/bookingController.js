const Booking = require("../models/booking");
const Auditorium = require("../models/auditorium");
const User = require("../models/User");
const { createNotification } = require("../service/notificationService");
const emailQueue = require("../queue/emailQueue");
const logger = require("../config/logger");

const {
  bookingUpdatedEmail,
  paymentRequestEmail,
} = require("../utils/EmailOptions");
const Payment = require("../models/payment");
const razorpayClient = require("../config/razorPay");

const bookingExpiryQueue = require("../queue/bookingExpiryQueue");

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
    const [startHour, startMinute] = formattedStartTime.split(":").map(Number);

    const bookingStartDateTime = new Date(selectedDate);

    bookingStartDateTime.setHours(startHour, startMinute, 0, 0);

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

      // Only check active bookings
      status: {
        $in: ["pending", "approved", "confirmed"],
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

    await createNotification({
      recipient: userId,
      type: "BOOKING_PENDING",
      title: "Booking Request Pending",
      message: `Your booking request for ${auditorium.name} on ${bookingDate} is pending approval.`,
      data: { bookingId: booking._id },
    });

    // Return the created booking response to the user
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    // Log the error and hand over to the global error middleware
    logger.error("Error creating booking:", error);
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
    logger.error("Error fetching user bookings:", error);
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
    logger.error("Error fetching all bookings for admin:", error);
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
    const allowedStatus = ["approved", "cancelled"];

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

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be approved or cancelled",
      });
    }

    if (status === "cancelled") {
      booking.status = "cancelled";

      await booking.save();

      try {
        const user = await User.findById(booking.user);

        if (user) {
          const emailData = await bookingUpdatedEmail(
            user,
            booking._id,
            "cancelled",
          );

          await emailQueue.add("booking-cancelled-email", {
            options: emailData,
          });
        }

        await createNotification({
          recipient: booking.user,
          type: "BOOKING_CANCELLED",
          title: "Booking Request Declined",
          message: `Your booking request has been cancelled by the admin.`,
          data: { bookingId: booking._id },
        });
      } catch (error) {
        logger.error("Email sending failed for cancellation:", error);
      }

      return res.status(200).json({
        success: true,
        message: "Booking request cancelled successfully.",
        booking,
      });
    }

    // ===============================================================
    // Concurrency Check: Prevent double-booking on Admin Confirmation
    // ===============================================================
    const overlappingConfirmed = await Booking.findOne({
      _id: { $ne: booking._id }, // Exclude this booking itself from the search
      auditorium: booking.auditorium,
      bookingDate: booking.bookingDate,
      status: {
        $in: ["approved", "confirmed"],
      },
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

    const approvedAt = new Date();
    const paymentDeadline = new Date(
      approvedAt.getTime() + 12 * 60 * 60 * 1000,
    ); // 12 hours in milliseconds

    const razorpayOrder = await razorpayClient.orders.create({
      amount: booking.totalPrice * 100, // Razorpay accepts amount in paise
      currency: "INR",
      receipt,
      notes: {
        bookingId: booking._id.toString(),
        userId: booking.user.toString(),
      },
    });

    const payment = await Payment.create({
      user: booking.user,
      booking: booking._id,
      amount: booking.totalPrice,
      currency: "INR",
      gatewayOrderId: razorpayOrder.id,
      receipt,
      status: "created",
      expiresAt: paymentDeadline,
    });

    booking.status = "approved";
    booking.approvedAt = approvedAt;
    booking.paymentDeadline = paymentDeadline;
    booking.paymentId = payment._id;

    await booking.save();

    const delayMs = 12 * 60 * 60 * 1000;

    await bookingExpiryQueue.add(
      `expire_${booking._id}`,
      { bookingId: booking._id },
      {
        delay: delayMs,
        jobId: `booking_expire_${booking._id}`,
      },
    );

    try {
      const user = await User.findById(booking.user);
      const auditorium = await Auditorium.findById(booking.auditorium);

      const emailData = await paymentRequestEmail(
        user,
        booking,
        auditorium,
        payment,
      );

      await emailQueue.add("payment-request-email", { options: emailData });
    } catch (error) {
      logger.error("Email sending failed for payment request:", error);
    }

    await createNotification({
      recipient: booking.user,
      type: "PAYMENT_REQUEST",
      title: "Booking Approved - Action Required",
      message: `Your booking for auditorium has been approved. Please make a payment of Rs. ${booking.totalPrice} within 12 hours.`,
      data: { bookingId: booking._id, paymentId: payment._id },
    });

    res.status(200).json({
      success: true,
      message: "Booking approved. Payment email sent to student.",
      booking,
    });
  } catch (error) {
    logger.error("Error updating booking status:", error);
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

    await createNotification({
      recipient: booking.user,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message: `You have successfully cancelled your booking request`,
      data: { bookingId: booking._id },
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    logger.error("Error cancelling booking:", error);
    next(error);
  }
};

// ===============================
// Get Bookings for Calendar
// ===============================
exports.getCalendarBooking = async (req, res, next) => {
  try {
    const { auditoriumId, month } = req.query;

    if (!auditoriumId || !month) {
      return res.status(400).json({
        success: false,
        message: "Auditorium ID and month (YYY-MM) are required",
      });
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
      23,
      59,
      999,
    );

    const bookings = await Booking.find({
      auditorium: auditoriumId,
      status: { $in: ["approved", "confirmed"] },
      bookingDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select("bookingDate startTime endTime purpose status")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};
