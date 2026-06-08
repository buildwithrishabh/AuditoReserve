const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    gateway: {
      type: String,
      default: "razorpay",
    },

    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    gatewayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gatewaySignature: {
      type: String,
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "expired", "refunded"],
      default: "created",
    },

    receipt: {
      type: String,
      unique: true,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    paidAt: {
      type: Date,
    },

    failureReason: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
