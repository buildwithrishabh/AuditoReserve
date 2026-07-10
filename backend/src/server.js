const mongoose = require("mongoose");
const http = require("http");
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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})




// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  // Force exit after a timeout if cleanup takes too long (e.g. 10 seconds)
  const forceExitTimeout = setTimeout(() => {
    console.error("☠ Forced shutdown: cleanup took too long.");
    process.exit(1);
  }, 10000);

  server.close(async (err) => {
    if (err) {
      console.error("Error closing HTTP server:", err);
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
    console.log("✔ HTTP server closed.");

    try {
      // Close BullMQ workers (waits for active jobs to complete)
      console.log("Closing BullMQ workers...");
      await Promise.all([
        emailWorker.close(),
        bookingExpiryWorker.close()
      ]);
      console.log("✔ BullMQ workers closed.");

      // Close BullMQ Queues
      console.log("Closing BullMQ queues...");
      await Promise.all([
        emailQueue.close(),
        bookingExpiryQueue.close()
      ]);
      console.log("✔ BullMQ queues closed.");

      // Close standalone Redis client
      console.log("Closing Redis connection...");
      await redisClient.quit();
      console.log("✔ Redis connection closed.");

      // Close MongoDB connection
      console.log("Closing MongoDB connection...");
      await mongoose.connection.close();
      console.log("✔ MongoDB connection closed.");

      clearTimeout(forceExitTimeout);
      console.log("👋 Graceful shutdown complete. Exiting.");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during graceful shutdown:", error);
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
