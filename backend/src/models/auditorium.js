const mongoose = require("mongoose");

const auditoriumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    amenities: [
      {
        type: String,
        required: true,
      },
    ],
    images: [
      {
        type: String,
        required: true,
      },
    ],
    basePrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Auditorium", auditoriumSchema);
