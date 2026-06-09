const { Queue } = require("bullmq");
const queueconnection = require("../config/queueConnection");

const bookingExpiryQueue = new Queue("booking-expiry", {
    connection : queueconnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000, // wait for 5s then 10s etc
        },
        removeOnComplete: true, // Auto-clean Redis memory
        removeOnFail: false ,  // Keep failed jobs for inspection
    }

});
bookingExpiryQueue.on("error" , (err)=> {
    console.error("BullMQ booking-expiry queue error:" , err);
})

module.exports = bookingExpiryQueue;