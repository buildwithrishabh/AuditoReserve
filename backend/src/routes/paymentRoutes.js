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

const paymentRouter = express.Router();

paymentRouter.post("/create-order/:bookingId" , protect , isverified , authorizeRole("student") , idempotency({ttl: 86400 , prefix: "idem:order"}), createPaymentOrder);


paymentRouter.post("/verify" , protect , isverified , authorizeRole("student") , idempotency({required: true , ttl: 86400 , prefix: "idem:verify"}), verifyPayment);

paymentRouter.get("/:bookingId/receipt", protect, isverified, getReceipt);
paymentRouter.get("/:bookingId/receipt/download", protect, isverified, downloadReceipt);


module.exports = paymentRouter;
