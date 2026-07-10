const { Worker } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const emailQueue = require("../queue/emailQueue");
const { bookingUpdatedEmail } = require("../utils/EmailOptions");
const User = require("../models/User");
const { createNotification } = require("../service/notificationService");

const worker = new Worker(
  "booking-expiry",
  async (job) => {
    const { bookingId } = job.data;

    console.log(`[Expiry Worker] Checking expiration for booking ${bookingId}`);

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log(`[Expiry Worker] Booking ${bookingId} not found. Skipping.`);
      return;
    }

    if (booking.status !== "approved") {
      console.log(
        `[Expiry Worker] Booking ${bookingId} has status '${booking.status}'. Skipping cancellation.`,
      );
      return;
    }

    booking.status = "cancelled";
    await booking.save();

    await createNotification({
      recipient: booking.user,
      type: "BOOKING_CANCELLED",
      title: "Booking Expired",
      message: `Your booking request was cancelled because the payment deadline expired.`,
      data: { bookingId: booking._id },
    });

    if (booking.paymentId) {
      await Payment.findByIdAndUpdate(booking.paymentId, {
        status: "expired",
        failureReason: "Payment deadline expired (12 hours passed)",
      });
    }

    try {
      const user = await User.findById(booking.user);

      if (user) {
        const emailData = await bookingUpdatedEmail(
          user,
          booking._id,
          "cancelled",
        );
        await emailQueue.add("booking-cancelled-email", { options: emailData });
        console.log(`[Expiry Worker] Sent cancellation email to ${user.email}`);
      }
    } catch (error) {
      console.log(
        `[Expiry Worker] Failed to send cancellation email: ${error}`,
      );
    }
    console.log(`[Expiry worker] Successfully expired booking ${bookingId}`);
  },
  {
    connection: queueconnection,
  },
);
worker.on("completed", (job) => {
  console.log(`[Expiry Worker] Job ${job.id} completed successfully`);
});
worker.on("failed", (job, err) => {
  console.error(`[Expiry Worker] Job ${job?.id} failed: ${err.message}`);
});

module.exports = worker;
