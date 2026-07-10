const crypto = require("crypto");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const razorpayClient = require("../config/razorPay");
const { createNotification } = require("../service/notificationService");

exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("paymentId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay for this booking",
      });
    }

    if (booking.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Payment is available only for approved bookings",
      });
    }

    if (!booking.paymentDeadline || booking.paymentDeadline < new Date()) {
      booking.status = "cancelled";
      await booking.save();

      if (booking.paymentId) {
        await Payment.findByIdAndUpdate(booking.paymentId, {
          status: "expired",
          failureReason: "Payment deadline expired",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Payment deadline expired",
      });
    }

    let payment = await Payment.findById(booking.paymentId);

    if (!payment) {
      const receipt = `bk_${booking._id.toString().slice(-16)}_${Date.now()}`;
      const razorpayOrder = await razorpayClient.orders.create({
        amount: booking.totalPrice * 100,
        currency: "INR",
        receipt,
        notes: {
          bookingId: booking._id.toString(),
          userId: req.user.id,
        },
      });

      payment = await Payment.create({
        user: req.user.id,
        booking: booking._id,
        amount: booking.totalPrice,
        currency: "INR",
        gatewayOrderId: razorpayOrder.id,
        status: "created",
        receipt,
        expiresAt: booking.paymentDeadline,
      });

      booking.paymentId = payment._id;
      await booking.save();
    }

    res.status(200).json({
      success: true,
      order: {
        id: payment.gatewayOrderId,
        amount: payment.amount * 100,
        currency: payment.currency,
      },
      booking,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to verify this payment",
      });
    }
    if (booking.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "This booking is not awaiting payment",
      });
    }

    if (booking.paymentDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Payment deadline expired",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        {
          gatewayOrderId: razorpay_order_id,
        },
        {
          status: "failed",
          failureReason: "Invalid Razorpay signature",
        },
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: razorpay_order_id },
      {
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
        status: "paid",
        paidAt: new Date(),
      },
      { new: true },
    );

    booking.status = "confirmed";
    booking.paymentId = payment._id;
    await booking.save();

    await createNotification({
      recipient: booking.user,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed 🎉",
      message: `Payment successful! Your booking is now confirmed.`,
      data: { bookingId: booking._id, paymentId: payment._id },
    });

    res.status(200).json({
      success: true,
      message: "Payment successful. Booking confirmed.",
      booking,
      payment,
    });
  } catch (error) {
    next(error);
  }
};
