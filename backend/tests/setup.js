const mongoose = require("mongoose");
// Global Redis mock
jest.mock("ioredis", () => {
  const RedisMock = require("ioredis-mock");
  return RedisMock;
});

// Mock ESM cookie module for Jest CommonJS runtime
jest.mock("cookie", () => ({
  parseCookie: jest.fn().mockImplementation((str) => {
    if (!str) return {};
    const res = {};
    str.split(";").forEach((pair) => {
      const [k, v] = pair.trim().split("=");
      if (k) res[k] = decodeURIComponent(v || "");
    });
    return res;
  }),
  parseSetCookie: jest.fn().mockReturnValue({}),
  stringifyCookie: jest.fn().mockReturnValue(""),
  stringifySetCookie: jest.fn().mockReturnValue(""),
}));

// Mock external queues
jest.mock("../src/queue/emailQueue", () => ({
  add: jest.fn().mockResolvedValue({ id: "mock-email-job-id" }),
  close: jest.fn().mockResolvedValue(),
  on: jest.fn(),
}));

jest.mock("../src/queue/bookingExpiryQueue", () => ({
  add: jest.fn().mockResolvedValue({ id: "mock-expiry-job-id" }),
  getJob: jest.fn().mockImplementation(async (jobId) => ({
    id: jobId,
    remove: jest.fn().mockResolvedValue(),
  })),
  close: jest.fn().mockResolvedValue(),
  on: jest.fn(),
}));

jest.mock("../src/queue/pdfQueue", () => ({
  add: jest.fn().mockResolvedValue({ id: "mock-pdf-job-id" }),
  close: jest.fn().mockResolvedValue(),
  on: jest.fn(),
}));

// Mock external payment gateway
jest.mock("../src/config/razorPay", () => ({
  orders: {
    create: jest.fn().mockImplementation(async (opts) => ({
      id: `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entity: "order",
      amount: opts.amount,
      currency: opts.currency || "INR",
      receipt: opts.receipt,
      status: "created",
      notes: opts.notes,
    })),
  },
}));

// Mock Cloudinary SDK
jest.mock("../src/config/cloudinary", () => {
  const { PassThrough } = require("stream");
  return {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
      upload_stream: jest.fn().mockImplementation((options, callback) => {
        const stream = new PassThrough();
        process.nextTick(() => {
          if (callback) {
            callback(null, {
              secure_url: `https://res.cloudinary.com/demo/raw/upload/${options.public_id || "sample.pdf"}`,
              public_id: options.public_id || "sample",
            });
          }
        });
        return stream;
      }),
    },
  };
});

let isReplicaSet = false;

// Connect to test database before all tests
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ replSetGetStatus: 1 });
    isReplicaSet = !!status.set;
  } catch {
    isReplicaSet = false;
  }

  const originalStartSession = mongoose.startSession.bind(mongoose);
  mongoose.startSession = async function (...args) {
    const session = await originalStartSession(...args);
    if (!isReplicaSet) {
      session.startTransaction = () => {};
      session.commitTransaction = () => {};
      session.abortTransaction = () => {};
    }
    return session;
  };
});

// Clean up DB collections & Redis between tests
beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  // Clear mock calls
  const emailQueue = require("../src/queue/emailQueue");
  const bookingExpiryQueue = require("../src/queue/bookingExpiryQueue");
  const pdfQueue = require("../src/queue/pdfQueue");
  const razorpayClient = require("../src/config/razorPay");
  const cloudinary = require("../src/config/cloudinary");

  emailQueue.add.mockClear();
  bookingExpiryQueue.add.mockClear();
  bookingExpiryQueue.getJob.mockClear();
  pdfQueue.add.mockClear();
  razorpayClient.orders.create.mockClear();
  cloudinary.uploader.destroy.mockClear();
  cloudinary.uploader.upload_stream.mockClear();

  // Reset Redis Mock data
  const redisClient = require("../src/config/redis");
  if (redisClient && typeof redisClient.flushall === "function") {
    await redisClient.flushall();
  }
});

// Disconnect from database after all tests complete
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  const redisClient = require("../src/config/redis");
  if (redisClient && typeof redisClient.quit === "function") {
    await redisClient.quit();
  }
});
