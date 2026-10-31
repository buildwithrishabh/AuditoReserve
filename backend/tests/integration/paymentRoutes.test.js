const request = require("supertest");
const crypto = require("crypto");
const app = require("../../src/app");
const Booking = require("../../src/models/booking");
const Payment = require("../../src/models/payment");
const Notification = require("../../src/models/notification");
const emailQueue = require("../../src/queue/emailQueue");
const pdfQueue = require("../../src/queue/pdfQueue");
const bookingExpiryQueue = require("../../src/queue/bookingExpiryQueue");
const { createTestUser, createTestAdmin } = require("../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture, createPaymentFixture } = require("../helpers/fixtures");

describe("Integration: Payment Routes (/api/payments)", () => {
  let studentAuth, adminAuth, otherStudentAuth, auditorium;

  beforeEach(async () => {
    studentAuth = await createTestUser();
    adminAuth = await createTestAdmin();
    otherStudentAuth = await createTestUser();
    auditorium = await createAuditoriumFixture({ basePrice: 1000 });
  });

  describe("POST /api/payments/create-order/:bookingId", () => {
    it("should return Razorpay order details for an approved booking within deadline", async () => {
      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        amount: 2000,
        gatewayOrderId: "order_approved_123",
        status: "created",
        expiresAt: deadline,
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
        totalPrice: 2000,
        paymentId: payment._id,
        paymentDeadline: deadline,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .post(`/api/payments/create-order/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.id).toBe("order_approved_123");
      expect(res.body.order.amount).toBe(2000 * 100);
      expect(res.body.key).toBe(process.env.RAZORPAY_KEY_ID);
    });

    it("should reject with 403 if user is not the owner of the booking", async () => {
      const booking = await createBookingFixture({
        user: otherStudentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
      });

      const res = await request(app)
        .post(`/api/payments/create-order/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("not allowed to pay for this booking");
    });

    it("should reject with 400 if booking is still pending (not approved)", async () => {
      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "pending",
      });

      const res = await request(app)
        .post(`/api/payments/create-order/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("available only for approved bookings");
    });

    it("should auto-cancel booking and expire payment with 400 if payment deadline has passed", async () => {
      const pastDeadline = new Date(Date.now() - 1000 * 60 * 30); // 30 mins ago
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        status: "created",
        expiresAt: pastDeadline,
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
        paymentId: payment._id,
        paymentDeadline: pastDeadline,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .post(`/api/payments/create-order/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Payment deadline expired");

      // Verify booking updated to cancelled
      const checkBooking = await Booking.findById(booking._id);
      expect(checkBooking.status).toBe("cancelled");

      // Verify payment updated to expired
      const checkPayment = await Payment.findById(payment._id);
      expect(checkPayment.status).toBe("expired");
    });
  });

  describe("POST /api/payments/verify", () => {
    it("should require Idempotency-Key header and reject with 400 if omitted", async () => {
      const res = await request(app)
        .post("/api/payments/verify")
        .set("Authorization", studentAuth.authHeader)
        .send({ bookingId: "60c72b2f9b1d8b2bad000001" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Idempotency key is required");
    });

    it("should verify valid payment, confirm booking atomically, queue email, queue PDF, and remove expiry job", async () => {
      const orderId = `order_test_${Date.now()}`;
      const paymentId = `pay_test_${Date.now()}`;

      // Generate valid HMAC signature
      const validSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        gatewayOrderId: orderId,
        status: "created",
        expiresAt: deadline,
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
        paymentId: payment._id,
        paymentDeadline: deadline,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .post("/api/payments/verify")
        .set("Authorization", studentAuth.authHeader)
        .set("Idempotency-Key", `idem_verify_${Date.now()}`)
        .send({
          bookingId: booking._id.toString(),
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe("confirmed");
      expect(res.body.payment.status).toBe("paid");

      // Verify Booking confirmed in DB
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe("confirmed");

      // Verify Payment marked paid in DB
      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment.status).toBe("paid");
      expect(updatedPayment.gatewayPaymentId).toBe(paymentId);
      expect(updatedPayment.paidAt).toBeDefined();

      // Verify confirmation email queued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "booking-confirmed-email",
        expect.objectContaining({
          options: expect.objectContaining({
            to: studentAuth.user.email,
            subject: expect.stringContaining("Confirmed"),
          }),
        })
      );

      // Verify receipt PDF generation queued
      expect(pdfQueue.add).toHaveBeenCalledWith(
        "generate-receipt",
        { bookingId: booking._id, paymentId: payment._id },
        expect.objectContaining({
          jobId: `receipt_${payment._id}`,
        })
      );

      // Verify 12h expiry job was removed from queue
      expect(bookingExpiryQueue.getJob).toHaveBeenCalledWith(`booking_expire_${booking._id}`);

      // Verify in-app notification created
      const notification = await Notification.findOne({
        recipient: studentAuth.user._id,
        type: "BOOKING_CONFIRMED",
      });
      expect(notification).not.toBeNull();
    });

    it("should reject with 400 and mark payment as failed if Razorpay signature is invalid", async () => {
      const orderId = `order_bad_${Date.now()}`;
      const paymentId = `pay_bad_${Date.now()}`;
      const invalidSignature = "invalid_hmac_signature_hex_value_1234567890abcdef1234567890abcdef";

      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        gatewayOrderId: orderId,
        status: "created",
        expiresAt: deadline,
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
        paymentId: payment._id,
        paymentDeadline: deadline,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .post("/api/payments/verify")
        .set("Authorization", studentAuth.authHeader)
        .set("Idempotency-Key", `idem_fail_${Date.now()}`)
        .send({
          bookingId: booking._id.toString(),
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: invalidSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid payment signature");

      // Verify payment marked as failed in DB
      const failedPayment = await Payment.findOne({ gatewayOrderId: orderId });
      expect(failedPayment.status).toBe("failed");
      expect(failedPayment.failureReason).toBe("Invalid Razorpay signature");

      // Verify booking remains approved (not confirmed)
      const bookingCheck = await Booking.findById(booking._id);
      expect(bookingCheck.status).toBe("approved");
    });

    it("should handle idempotent retries: return 200 directly if booking is already confirmed and paid", async () => {
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        status: "paid",
        paidAt: new Date(),
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
        paymentId: payment._id,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .post("/api/payments/verify")
        .set("Authorization", studentAuth.authHeader)
        .set("Idempotency-Key", `idem_already_confirmed_${Date.now()}`)
        .send({
          bookingId: booking._id.toString(),
          razorpay_order_id: "order_any",
          razorpay_payment_id: "pay_any",
          razorpay_signature: "sig_any",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("idempotent retry");
    });
  });

  describe("GET /api/payments/:bookingId/receipt", () => {
    it("should return receipt details in JSON for confirmed booking", async () => {
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        status: "paid",
        receipt: "AR-2026-TEST-RECEIPT",
        amount: 3000,
        paidAt: new Date(),
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
        paymentId: payment._id,
        totalPrice: 3000,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.receipt.receiptNumber).toBe("AR-2026-TEST-RECEIPT");
      expect(res.body.receipt.amount).toBe(3000);
    });

    it("should stream PDF when format=pdf query parameter is passed", async () => {
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        status: "paid",
        receipt: "AR-2026-PDF-RECEIPT",
        amount: 3000,
        paidAt: new Date(),
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
        paymentId: payment._id,
        totalPrice: 3000,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt`)
        .query({ format: "pdf" })
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      // Verify PDF buffer signature
      expect(res.body.toString("utf8", 0, 5)).toBe("%PDF-");
    });

    it("should reject with 400 if booking is not confirmed", async () => {
      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "approved",
      });

      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Receipt is available only for confirmed bookings");
    });

    it("should reject with 403 if requested by another non-admin student", async () => {
      const payment = await createPaymentFixture({
        user: otherStudentAuth.user._id,
        status: "paid",
      });

      const booking = await createBookingFixture({
        user: otherStudentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
        paymentId: payment._id,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Access Denied");
    });
  });

  describe("GET /api/payments/:bookingId/receipt/download", () => {
    it("should download PDF receipt for confirmed booking", async () => {
      const payment = await createPaymentFixture({
        user: studentAuth.user._id,
        status: "paid",
        receipt: "AR-2026-DOWNLOAD",
      });

      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
        paymentId: payment._id,
      });

      payment.booking = booking._id;
      await payment.save();

      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt/download`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain("attachment; filename=");
      expect(res.body.toString("utf8", 0, 5)).toBe("%PDF-");
    });
  });
});

