const express = require("express");


const {
    createPaymentOrder,
    verifyPayment,
    getReceipt,
    downloadReceipt
} = require("../controllers/paymentController");


const {
  protect,
  authorizeRole,
  isverified,
} = require("../middlewares/authMiddleware");

const idempotency = require("../middlewares/idempotencyMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");

// Limiters for payment routes
const paymentOrderLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 6,
  prefix: "rl:payment:order",
});

const paymentVerifyLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 6,
  prefix: "rl:payment:verify",
});

const receiptLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 20,
  prefix: "rl:payment:receipt",
});

const pdfDownloadLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: "rl:payment:download",
});

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-order/:bookingId",
  protect,
  isverified,
  authorizeRole("student"),
  paymentOrderLimiter,
  idempotency({ ttl: 86400, prefix: "idem:order" }),
  createPaymentOrder
);

paymentRouter.post(
  "/verify",
  protect,
  isverified,
  authorizeRole("student"),
  paymentVerifyLimiter,
  idempotency({ required: true, ttl: 86400, prefix: "idem:verify" }),
  verifyPayment
);

paymentRouter.get("/:bookingId/receipt", protect, isverified, receiptLimiter, getReceipt);
paymentRouter.get("/:bookingId/receipt/download", protect, isverified, pdfDownloadLimiter, downloadReceipt);

module.exports = paymentRouter;
