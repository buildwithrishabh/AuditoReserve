const crypto = require("crypto");
const https = require("https");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const razorpayClient = require("../config/razorPay");
const { createNotification } = require("../service/notificationService");
const bookingExpiryQueue = require("../queue/bookingExpiryQueue");
const logger = require("../config/logger");
const emailQueue = require("../queue/emailQueue");
const User = require("../models/User");
const { bookingUpdatedEmail } = require("../utils/EmailOptions");
const { buildReceiptPdf } = require("../utils/receiptGenerator");
const pdfQueue = require("../queue/pdfQueue");

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
      const receipt = `AR_${booking._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;
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

    // Idempotency check: if already confirmed and paid, return success directly
    if (booking.status === "confirmed") {
      const existingPayment = await Payment.findById(booking.paymentId);
      if (existingPayment && existingPayment.status === "paid") {
        return res.status(200).json({
          success: true,
          message: "Payment verified successfully (idempotent retry).",
          booking,
          payment: existingPayment,
        });
      }
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

    try {
      const user = await User.findById(booking.user);
      if (user) {
        const emailData = await bookingUpdatedEmail(
          user,
          booking._id,
          "confirmed",
        );
        await emailQueue.add("booking-confirmed-email", { options: emailData });
      }
    } catch (error) {
      logger.error("[Payment] failed to enqueue confirmation email:", error);
    }

    try {
      await pdfQueue.add(
        "generate-receipt",
        { bookingId: booking._id, paymentId: payment._id },
        { jobId: `receipt_${payment._id}` },
      );
    } catch (queueError) {
      logger.error("[Payment] Failed to enqueue PDF receipt job:", queueError);
    }

    // successfull payment -> remove the schedule job from the queue
    try {
      const jobId = `booking_expire_${booking._id}`;
      const job = await bookingExpiryQueue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(
          `[Payment] Expiry Job ${jobId} successfully removed from queue`,
        );
      }
    } catch (queueError) {
      logger.error(
        `[Payment] Failed to remove expiry job: ${queueError.message}`,
      );
    }

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

exports.getReceipt = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email")
      .populate("auditorium");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    if (booking.status !== "confirmed" || !booking.paymentId) {
      return res.status(400).json({
        success: false,
        message:
          "Receipt is available only for confirmed bookings with verified payment",
      });
    }

    const payment = await Payment.findById(booking.paymentId);
    if (!payment || payment.status !== "paid") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Receipt is available only after successful payment verification",
        });
    }

    // Ensure unique, clean receipt ID exists
    if (!payment.receipt) {
      const year = new Date(payment.paidAt || Date.now()).getFullYear();
      const code = String(payment._id || booking._id)
        .slice(-6)
        .toUpperCase();
      const rand = Math.floor(1000 + Math.random() * 9000);
      payment.receipt = `AR-${year}-${code}-${rand}`;
      await payment.save();
    }

    if (req.query.format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="receipt_${payment.receipt}.pdf"`,
      );
      return buildReceiptPdf(
        {
          booking,
          payment,
          user: booking.user,
          auditorium: booking.auditorium,
        },
        res,
      );
    }

    res.status(200).json({
      success: true,
      receipt: {
        receiptNumber: payment.receipt,
        paymentId: payment.gatewayPaymentId || "Confirmed",
        orderId: payment.gatewayOrderId,
        paidAt: payment.paidAt,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        user: {
          name: booking.user?.name || "Customer",
          email: booking.user?.email || "",
        },
        auditorium: {
          name: booking.auditorium?.name || "Auditorium Facility",
          capacity: booking.auditorium?.capacity || 0,
          amenities: booking.auditorium?.amenities || [],
          basePrice: booking.auditorium?.basePrice || 0,
          description: booking.auditorium?.description || "",
        },
        booking: {
          id: booking._id,
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          purpose: booking.purpose,
          totalPrice: booking.totalPrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadReceipt = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email")
      .populate("auditorium");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isOwner = booking.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    if (booking.status !== "confirmed" || !booking.paymentId) {
      return res.status(400).json({
        success: false,
        message:
          "Receipt is available only for confirmed bookings with verified payment",
      });
    }

    const payment = await Payment.findById(booking.paymentId);
    if (!payment || payment.status !== "paid") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Receipt is available only after successful payment verification",
        });
    }

    // 1. FAST PATH: Stream pre-generated PDF from Cloudinary directly to client (Zero CPU render cost & No CORS redirect)
    if (payment.receiptPdfUrl) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="receipt_${payment.receipt || booking._id}.pdf"`,
      );

      return https
        .get(payment.receiptPdfUrl, (cloudRes) => {
          if (cloudRes.statusCode === 200) {
            cloudRes.pipe(res);
          } else {
            // Fallback to on-the-fly rendering if Cloudinary fetch encounters an issue
            buildReceiptPdf(
              {
                booking,
                payment,
                user: booking.user,
                auditorium: booking.auditorium,
              },
              res,
            );
          }
        })
        .on("error", (err) => {
          logger.error("[Payment] Error piping Cloudinary PDF:", err);
          buildReceiptPdf(
            {
              booking,
              payment,
              user: booking.user,
              auditorium: booking.auditorium,
            },
            res,
          );
        });
    }

    // 2. Queue background upload to Cloudinary for future instant CDN delivery
    pdfQueue
      .add(
        "generate-receipt",
        { bookingId: booking._id, paymentId: payment._id },
        { jobId: `receipt_${payment._id}` },
      )
      .catch((err) =>
        logger.error("[PDF] Failed to queue Cloudinary upload:", err),
      );

    // 3. Fallback: Stream valid PDF immediately so the user ALWAYS gets a real, uncorrupted PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt_${payment.receipt || booking._id}.pdf"`,
    );

    return buildReceiptPdf(
      { booking, payment, user: booking.user, auditorium: booking.auditorium },
      res,
    );
  } catch (error) {
    next(error);
  }
};
