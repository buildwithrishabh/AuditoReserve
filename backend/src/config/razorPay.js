const Razorpay = require("razorpay");


const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

module.exports = razorpayClient;