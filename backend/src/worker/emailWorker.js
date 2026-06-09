const { Worker } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const sendEmail = require("../service/email");

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { options } = job.data;
    console.log(`[Email worker]  Processing email dispatch to ${options.to}`);

    await sendEmail(options);

    console.log(`[Email worker] Email sent to ${options.to}`);
  },
  {
    connection: queueconnection,
  },
);

worker.on("failed", (job, err) => {
  console.error(
    `[Email worker]  failed to send email to ${job?.data?.options?.to}: ${err.message}`,
  );
});


module.exports = worker;

