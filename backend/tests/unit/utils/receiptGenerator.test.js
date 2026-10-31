const { Writable } = require("stream");
const { buildReceiptPdf } = require("../../../src/utils/receiptGenerator");

describe("Unit: Receipt Generator (PDFKit Stream)", () => {
  it("should stream a valid PDF document with complete booking data", async () => {
    const chunks = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const sampleData = {
      booking: {
        _id: "60c72b2f9b1d8b2bad000001",
        purpose: "Convocation Rehearsal",
        bookingDate: new Date("2026-11-15T00:00:00.000Z"),
        startTime: "10:00",
        endTime: "13:00",
        totalPrice: 3000,
      },
      payment: {
        receipt: "AR-2026-000001-1234",
        gatewayPaymentId: "pay_test_9999",
        amount: 3000,
        paidAt: new Date("2026-11-10T14:30:00.000Z"),
      },
      user: {
        name: "Deepak Verma",
        email: "deepak@tmu.ac.in",
      },
      auditorium: {
        name: "Sir Visvesvaraya Hall",
        capacity: 800,
        amenities: ["Surround Sound", "Dual Projectors"],
        basePrice: 1000,
      },
    };

    await new Promise((resolve, reject) => {
      writable.on("finish", resolve);
      writable.on("error", reject);
      buildReceiptPdf(sampleData, writable);
    });

    const fullBuffer = Buffer.concat(chunks);
    expect(fullBuffer.length).toBeGreaterThan(1000);
    // Standard PDF header signature
    expect(fullBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
  });

  it("should handle empty or partial data gracefully without throwing unhandled exceptions", async () => {
    const chunks = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    await new Promise((resolve, reject) => {
      writable.on("finish", resolve);
      writable.on("error", reject);
      buildReceiptPdf({}, writable);
    });

    const fullBuffer = Buffer.concat(chunks);
    expect(fullBuffer.length).toBeGreaterThan(500);
    expect(fullBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
  });
});

