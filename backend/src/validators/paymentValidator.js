const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const verifyPaymentSchema = z.object({
  bookingId: z
    .string({ required_error: "Booking ID is required" })
    .regex(objectIdRegex, "Invalid Booking ID"),
  razorpay_order_id: z
    .string({ required_error: "Razorpay order ID is required" })
    .trim()
    .min(1, "Razorpay order ID cannot be empty"),
  razorpay_payment_id: z
    .string({ required_error: "Razorpay payment ID is required" })
    .trim()
    .min(1, "Razorpay payment ID cannot be empty"),
  razorpay_signature: z
    .string({ required_error: "Razorpay signature is required" })
    .trim()
    .min(1, "Razorpay signature cannot be empty"),
});

module.exports = {
  verifyPaymentSchema,
};
