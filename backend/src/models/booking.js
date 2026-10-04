const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    auditorium: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auditorium",
      required: true,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "confirmed", "cancelled"],
      default: "pending",
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    approvedAt: {
      type: Date,
    },

    paymentDeadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({
  auditorium: 1,
  status: 1,
  bookingDate: 1,
  startTime: 1,
  endTime: 1,
});

// Index for user Dashboard Query: getUserBookings
bookingSchema.index({ user: 1, createdAt: -1 });

// Index for Admin Dashboard Query: getAllBookings (sorted by newest)
bookingSchema.index({ createdAt: -1 });

// Index for payment auto-expiry queue worker query
bookingSchema.index({ status: 1, paymentDeadline: 1 });


module.exports = mongoose.model("Booking", bookingSchema);
