const commonValidators = require("./commonValidators");
const authValidators = require("./authValidators");
const auditoriumValidators = require("./auditoriumValidators");
const bookingValidators = require("./bookingValidators");
const paymentValidators = require("./paymentValidators");
const notificationValidators = require("./notificationValidators");

module.exports = {
  ...commonValidators,
  ...authValidators,
  ...auditoriumValidators,
  ...bookingValidators,
  ...paymentValidators,
  ...notificationValidators,
};

