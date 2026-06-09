const { ConnectOptions } = require("bullmq");

const queueconnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Critical for BullMQ compatibility
};

module.exports = queueconnection
