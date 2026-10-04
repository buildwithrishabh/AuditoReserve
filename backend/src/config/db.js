const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 50,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
