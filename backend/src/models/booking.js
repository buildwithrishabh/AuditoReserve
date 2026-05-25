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
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({
  auditorium: 1,
  bookingDate: 1,
});

module.exports = mongoose.model("Booking", bookingSchema);
