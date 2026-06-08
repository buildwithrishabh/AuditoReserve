const express = require("express");


const {
    createPaymentOrder,
    verifyPayment
} = require("../controllers/paymentController");


const {
  protect,
  authorizeRole,
  isverified,
} = require("../middlewares/authMiddleware");

const paymentRouter = express.Router();

paymentRouter.post("/create-order/:bookingId" , protect , isverified , authorizeRole("student") , createPaymentOrder);


paymentRouter.post("/verify" , protect , isverified , authorizeRole("student") , verifyPayment);


module.exports = paymentRouter;
