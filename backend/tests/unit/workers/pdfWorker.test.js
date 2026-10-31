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
const { createTestUser } = require("../../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture, createPaymentFixture } = require("../../helpers/fixtures");

describe("Unit: PDF Receipt Worker", () => {
  let user, auditorium;

  beforeAll(() => {
    require("../../../src/worker/pdfWorker");
  });

  beforeEach(async () => {
    const auth = await createTestUser();
    user = auth.user;
    auditorium = await createAuditoriumFixture();
  });

  it("should generate PDF, upload to Cloudinary directly, and persist receiptPdfUrl in payment record", async () => {
    const booking = await createBookingFixture({
      user: user._id,
      auditorium: auditorium._id,
      status: "confirmed",
    });

    const payment = await createPaymentFixture({
      user: user._id,
      booking: booking._id,
      status: "paid",
      receipt: "AR-2026-TEST-999",
    });

    booking.paymentId = payment._id;
    await booking.save();

    const job = {
      data: {
        bookingId: booking._id.toString(),
        paymentId: payment._id.toString(),
      },
    };

    const result = await capturedProcessor(job);

    expect(result).toBeDefined();
    expect(result.secureUrl).toContain("receipt_AR-2026-TEST-999.pdf");

    // Verify database document was updated
    const updatedPayment = await Payment.findById(payment._id);
    expect(updatedPayment.receiptPdfUrl).toBe(result.secureUrl);
  });

  it("should throw error if booking does not exist", async () => {
    const job = {
      data: {
        bookingId: "60c72b2f9b1d8b2bad000099",
        paymentId: "60c72b2f9b1d8b2bad000098",
      },
    };

    await expect(capturedProcessor(job)).rejects.toThrow("Booking not found");
  });
});

