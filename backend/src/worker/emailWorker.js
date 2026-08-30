const { Worker } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const sendEmail = require("../service/email");
const logger = require("../config/logger");

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { options } = job.data;
    logger.info(`[Email worker] Processing email dispatch to ${options.to}`);

    await sendEmail(options);

    logger.info(`[Email worker] Email sent to ${options.to}`);
  },
  {
    connection: queueconnection,
  },
);

worker.on("failed", (job, err) => {
  logger.error(
    `[Email worker] failed to send email to ${job?.data?.options?.to}: ${err.message}`,
  );
});


module.exports = worker;

