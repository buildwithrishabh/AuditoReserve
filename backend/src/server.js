const mongoose = require("mongoose");
const http = require("http");
const logger = require("./config/logger");
const { initSocket } = require("./config/socket");
const app = require("./app");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const emailQueue = require("./queue/emailQueue");
const bookingExpiryQueue = require("./queue/bookingExpiryQueue");


// Connect to database
connectDB();

// Start Background Queue Workers
const emailWorker = require("./worker/emailWorker");
const bookingExpiryWorker = require("./worker/bookingExpiryWorker");

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initSocket(httpServer);

const server = httpServer.listen(PORT , () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
})




// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Force exit after a timeout if cleanup takes too long (e.g. 10 seconds)
  const forceExitTimeout = setTimeout(() => {
    logger.error("Forced shutdown: cleanup took too long.");
    process.exit(1);
  }, 10000);

  server.close(async (err) => {
    if (err) {
      logger.error("Error closing HTTP server:", err);
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
    logger.info("HTTP server closed.");

    try {
      // Close BullMQ workers (waits for active jobs to complete)
      logger.info("Closing BullMQ workers...");
      await Promise.all([
        emailWorker.close(),
        bookingExpiryWorker.close()
      ]);
      logger.info("BullMQ workers closed.");

      // Close BullMQ Queues
      logger.info("Closing BullMQ queues...");
      await Promise.all([
        emailQueue.close(),
        bookingExpiryQueue.close()
      ]);
      logger.info("BullMQ queues closed.");

      // Close standalone Redis client
      logger.info("Closing Redis connection...");
      await redisClient.quit();
      logger.info("Redis connection closed.");

      // Close MongoDB connection
      logger.info("Closing MongoDB connection...");
      await mongoose.connection.close();
      logger.info("MongoDB connection closed.");

      clearTimeout(forceExitTimeout);
      logger.info("Graceful shutdown complete. Exiting.");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
