let capturedProcessor;

jest.mock("bullmq", () => ({
  ...jest.requireActual("bullmq"),
  Worker: jest.fn().mockImplementation((name, processor) => {
    capturedProcessor = processor;
    return {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };
  }),
}));

const Booking = require("../../../src/models/booking");
const Payment = require("../../../src/models/payment");
const Notification = require("../../../src/models/notification");
const emailQueue = require("../../../src/queue/emailQueue");
const { acquireLock, releaseLock } = require("../../../src/utils/lock");
const { createTestUser } = require("../../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture, createPaymentFixture } = require("../../helpers/fixtures");

describe("Unit: Booking Expiry Worker", () => {
  let user, auditorium;

  beforeAll(() => {
    require("../../../src/worker/bookingExpiryWorker");
  });

  beforeEach(async () => {
    const auth = await createTestUser();
    user = auth.user;
    auditorium = await createAuditoriumFixture();
  });

  it("should expire a pending booking that admin did not review in time", async () => {
    const booking = await createBookingFixture({
      user: user._id,
      auditorium: auditorium._id,
      status: "pending",
    });

    const job = { data: { bookingId: booking._id.toString() } };
    await capturedProcessor(job);

    const updated = await Booking.findById(booking._id);
    expect(updated.status).toBe("cancelled");

    const notification = await Notification.findOne({
      recipient: user._id,
      type: "BOOKING_CANCELLED",
    });
    expect(notification).not.toBeNull();
    expect(notification.title).toBe("Booking Request Expired");
  });

  it("should expire an approved booking whose payment deadline passed, mark payment expired, and enqueue cancellation email", async () => {
    const payment = await createPaymentFixture({
      user: user._id,
      amount: 2000,
    });

    const booking = await createBookingFixture({
      user: user._id,
      auditorium: auditorium._id,
      status: "approved",
      paymentId: payment._id,
      paymentDeadline: new Date(Date.now() - 1000), // in the past
    });

    payment.booking = booking._id;
    await payment.save();

    const job = { data: { bookingId: booking._id.toString() } };
    await capturedProcessor(job);

    // Verify booking is cancelled
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking.status).toBe("cancelled");

    // Verify payment record marked as expired
    const updatedPayment = await Payment.findById(payment._id);
    expect(updatedPayment.status).toBe("expired");
    expect(updatedPayment.failureReason).toContain("Payment deadline expired");

    // Verify cancellation email enqueued to BullMQ
    expect(emailQueue.add).toHaveBeenCalledWith(
      "booking-cancelled-email",
      expect.objectContaining({
        options: expect.objectContaining({
          to: user.email,
          subject: expect.stringContaining("Cancelled"),
        }),
      })
    );

    // Verify in-app notification
    const notification = await Notification.findOne({
      recipient: user._id,
      type: "BOOKING_CANCELLED",
      title: "Booking Expired",
    });
    expect(notification).not.toBeNull();
  });

  it("should skip cancellation if booking was already confirmed", async () => {
    const booking = await createBookingFixture({
      user: user._id,
      auditorium: auditorium._id,
      status: "confirmed",
    });

    const job = { data: { bookingId: booking._id.toString() } };
    await capturedProcessor(job);

    const checkBooking = await Booking.findById(booking._id);
    expect(checkBooking.status).toBe("confirmed"); // remains confirmed
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it("should throw error to trigger BullMQ retry when distributed lock is held by verifyPayment", async () => {
    const booking = await createBookingFixture({
      user: user._id,
      auditorium: auditorium._id,
      status: "approved",
    });

    // Acquire lock beforehand (simulating concurrent verifyPayment)
    const lockKey = `lock:booking:${booking._id}`;
    const preLock = await acquireLock(lockKey, 10000);

    const job = { data: { bookingId: booking._id.toString() } };

    await expect(capturedProcessor(job)).rejects.toThrow("currently being processed by another operation");

    // Release pre-acquired lock
    await releaseLock(preLock.key, preLock.value);
  });
});

