const { z } = require("zod");
const { objectIdSchema } = require("./commonValidators");

const createPaymentOrderSchema = {
  params: z.object({
    bookingId: objectIdSchema,
  }),
};

const verifyPaymentSchema = {
  body: z.object({
    bookingId: objectIdSchema,
    razorpay_order_id: z
      .string({
        required_error: "Razorpay order ID is required",
        invalid_type_error: "Razorpay order ID must be a string",
      })
      .trim()
      .min(1, "Razorpay order ID is required"),
    razorpay_payment_id: z
      .string({
        required_error: "Razorpay payment ID is required",
        invalid_type_error: "Razorpay payment ID must be a string",
      })
      .trim()
      .min(1, "Razorpay payment ID is required"),
    razorpay_signature: z
      .string({
        required_error: "Razorpay signature is required",
        invalid_type_error: "Razorpay signature must be a string",
      })
      .trim()
      .min(1, "Razorpay signature is required"),
  }),
};

const receiptParamSchema = {
  params: z.object({
    bookingId: objectIdSchema,
  }),
  query: z.object({
    format: z.enum(["pdf", "json"]).optional(),
  }),
};

const downloadReceiptSchema = {
  params: z.object({
    bookingId: objectIdSchema,
  }),
};

module.exports = {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  receiptParamSchema,
  downloadReceiptSchema,
};

