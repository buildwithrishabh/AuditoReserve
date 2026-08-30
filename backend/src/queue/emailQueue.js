const { Queue } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const logger = require("../config/logger");

const emailQueue = new Queue("email-queue" , {
    connection: queueconnection,
    defaultJobOptions: {
        attempts: 5, 
        backoff: {
            type: "exponential",
            delay: 10000,
        },
        removeOnComplete: true
    }
});

emailQueue.on("error" , (err)=> {
    logger.error("BullMQ email queue error:", err);
})


module.exports = emailQueue;
