require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const queueConnection = require("./config/queueConnection");

// Dummy HTTP server to satisfy Render Web Service port check
const PORT = process.env.PORT || 10000;
const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Worker is active and running\n");
});

healthServer.listen(PORT, () => {
  logger.info(`Worker health server listening on port ${PORT}`);
});

connectDB();

const emailWorker = require("./worker/emailWorker");
const bookingExpiryWorker = require("./worker/bookingExpiryWorker");
const pdfWorker = require("./worker/pdfWorker");

logger.info(
  "🚀 Background Worker Process is running and listening for jobs...",
);

// GraceFull shutdown specifically for worker
const shutdownWorker = async (signal) => {
  logger.info(`${signal} received. Closing workers gracefully...`);

  try {
    healthServer.close();

    await Promise.all([
      emailWorker.close(),
      bookingExpiryWorker.close(),
      pdfWorker.close(),
    ]);
    logger.info("All BullMQ workers stopped.");

    await queueConnection.quit();
    await mongoose.connection.close();
    logger.info("Worker process DB & Redis closed. Exiting.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during worker shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdownWorker("SIGTERM"));
process.on("SIGINT", () => shutdownWorker("SIGINT"));
