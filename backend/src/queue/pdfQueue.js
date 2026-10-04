const { Queue } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const logger = require("../config/logger");

const pdfQueue = new Queue("pdf-generation-queue", {
  connection: queueconnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

pdfQueue.on("error", (err) => {
  logger.error("BullMQ PDF queue error:", err);
});

module.exports = pdfQueue;
