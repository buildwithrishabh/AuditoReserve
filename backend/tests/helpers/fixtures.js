const mongoose = require("mongoose");
const Auditorium = require("../../src/models/auditorium");
const Booking = require("../../src/models/booking");
const Payment = require("../../src/models/payment");
const Notification = require("../../src/models/notification");

const createAuditoriumFixture = async (overrides = {}) => {
  const defaultAuditorium = {
    name: `Main Auditorium ${Date.now()}`,
    capacity: 500,
    amenities: ["Projector", "Sound System", "AC", "Stage Lighting"],
    images: ["https://res.cloudinary.com/demo/image/upload/sample1.jpg"],
    basePrice: 1000, // INR 1000 per hour
    description: "State-of-the-art auditorium with premier acoustic treatment.",
  };

  return await Auditorium.create({ ...defaultAuditorium, ...overrides });
};

const createBookingFixture = async (overrides = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const defaultBooking = {
    bookingDate: tomorrow,
    startTime: "10:00",
    endTime: "12:00",
    purpose: "Annual University Tech Fest",
    totalPrice: 2000,
    status: "pending",
  };

  return await Booking.create({ ...defaultBooking, ...overrides });
};

const createPaymentFixture = async (overrides = {}) => {
  const defaultPayment = {
    booking: new mongoose.Types.ObjectId(),
    amount: 2000,
    currency: "INR",
    gateway: "razorpay",
    gatewayOrderId: `order_fixture_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: "created",
    receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  };

  return await Payment.create({ ...defaultPayment, ...overrides });
};

module.exports = {
  createAuditoriumFixture,
  createBookingFixture,
  createPaymentFixture,
};
