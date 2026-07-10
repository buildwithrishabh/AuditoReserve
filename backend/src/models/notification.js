const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "BOOKING_PENDING",
      "BOOKING_APPROVED",
      "BOOKING_CANCELLED",
      "BOOKING_CONFIRMED",
      "PAYMENT_REQUEST",
      "PAYMENT_SUCCESS",
      "SYSTEM",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  data: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({recipient: 1 , createdAt: -1});

module.exports = mongoose.model("Notification" , notificationSchema);
