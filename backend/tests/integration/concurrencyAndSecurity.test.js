const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = require("../../src/app");
const Booking = require("../../src/models/booking");
const Payment = require("../../src/models/payment");
const User = require("../../src/models/User");
const redisClient = require("../../src/config/redis");
const { createTestUser, createTestAdmin } = require("../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture, createPaymentFixture } = require("../helpers/fixtures");

describe("Integration: Concurrency, Locking & Security Controls", () => {
  let student1, student2, admin, auditorium;

  beforeEach(async () => {
    student1 = await createTestUser();
    student2 = await createTestUser();
    admin = await createTestAdmin();
    auditorium = await createAuditoriumFixture({ basePrice: 1000 });
  });

  describe("Distributed Locking & Concurrency Race Conditions", () => {
    it("should prevent double-approval race condition when two admin requests concurrently attempt to approve overlapping bookings", async () => {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 5);
      bookingDate.setHours(0, 0, 0, 0);

      // Two overlapping pending bookings for the same day
      const bookingA = await createBookingFixture({
        user: student1.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "10:00",
        endTime: "13:00",
        status: "pending",
      });

      const bookingB = await createBookingFixture({
        user: student2.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "12:00",
        endTime: "15:00",
        status: "pending",
      });

      // Fire both approval requests simultaneously
      const [resA, resB] = await Promise.all([
        request(app)
          .put(`/api/bookings/status/${bookingA._id}`)
          .set("Authorization", admin.authHeader)
          .send({ status: "approved" }),
        request(app)
          .put(`/api/bookings/status/${bookingB._id}`)
          .set("Authorization", admin.authHeader)
          .send({ status: "approved" }),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly ONE must succeed (200) and the other must be rejected (400 or 409)
      expect(statuses).toContain(200);
      const successCount = statuses.filter((s) => s === 200).length;
      expect(successCount).toBe(1);

      // Verify in DB that only one booking is approved, and the conflicting one was cancelled or remained pending
      const checkA = await Booking.findById(bookingA._id);
      const checkB = await Booking.findById(bookingB._id);

      const approvedCount = [checkA.status, checkB.status].filter((s) => s === "approved").length;
      expect(approvedCount).toBe(1);
    });

    it("should reject concurrent payment verification requests with 409 when submitted simultaneously with the same Idempotency-Key", async () => {
      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const booking = await createBookingFixture({
        user: student1.user._id,
        auditorium: auditorium._id,
        status: "approved",
        paymentDeadline: deadline,
      });

      const orderId = `order_race_${Date.now()}`;
      const paymentId = `pay_race_${Date.now()}`;
      const signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const sharedIdempotencyKey = `idem_race_key_${Date.now()}`;

      // First request sets PROCESSING lock
      await redisClient.set(
        `idem:verify:${student1.user._id}:${sharedIdempotencyKey}`,
        "PROCESSING",
        "EX",
        30
      );

      // Concurrent request with same key should be blocked with 409
      const res = await request(app)
        .post("/api/payments/verify")
        .set("Authorization", student1.authHeader)
        .set("Idempotency-Key", sharedIdempotencyKey)
        .send({
          bookingId: booking._id.toString(),
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("currently being processed");
    });
  });

  describe("Security, Tampering & Privilege Escalation", () => {
    it("should prevent role escalation during user registration (body role: 'admin' ignored)", async () => {
      const email = `hacker_${Date.now()}@tmu.ac.in`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Attacker",
          email,
          password: "Password123",
          role: "admin", // attempt privilege escalation
        });

      expect(res.status).toBe(201);
      // Actual implementation sets role from schema default: "student"
      const createdUser = await User.findOne({ email });
      expect(createdUser.role).toBe("student");
    });

    it("should reject forged JWT token with invalid signature", async () => {
      // Forge token using an arbitrary attacker secret
      const forgedToken = jwt.sign(
        { id: admin.user._id, email: admin.user.email, role: "admin" },
        "attacker_private_secret_key"
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("token failed");
    });

    it("should reject expired JWT access token", async () => {
      const expiredToken = jwt.sign(
        { id: student1.user._id, email: student1.user.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "-1s" } // Expired 1 second ago
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("token failed");
    });

    it("should prevent NoSQL injection via object payloads in auth login (exposes unhandled TypeError)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: { $ne: null },
          password: { $ne: null },
        });

      // Expected behavior: 400 Bad Request (input validation error)
      // Actual implementation bug: 500 Internal Server Error (TypeError: email.trim is not a function)
      expect(res.status).toBe(400);
    });

    it("should safely handle receipt request if the booked user has been deleted (exposes null pointer)", async () => {
      const payment = await createPaymentFixture({
        user: student1.user._id,
        amount: 1000,
        status: "paid",
        receipt: `AR-DEL-${Date.now()}`,
      });

      const booking = await Booking.create({
        user: student1.user._id,
        auditorium: auditorium._id,
        bookingDate: new Date(),
        startTime: "10:00",
        endTime: "11:00",
        purpose: "Event",
        totalPrice: 1000,
        status: "confirmed",
        paymentId: payment._id,
      });

      payment.booking = booking._id;
      await payment.save();

      // Delete the student user record
      await User.findByIdAndDelete(student1.user._id);

      // Admin attempts to view receipt for this booking
      const res = await request(app)
        .get(`/api/payments/${booking._id}/receipt`)
        .set("Authorization", admin.authHeader);

      // Expected behavior: 200 or 404 handled gracefully
      // Actual bug: 500 TypeError: Cannot read properties of null (reading '_id')
      expect(res.status).not.toBe(500);
    });

    it("should enforce sliding-window rate limit on rapid login attempts", async () => {
      // The login route has loginLimiter with max 10
      const attempts = [];
      for (let i = 0; i < 12; i++) {
        attempts.push(
          request(app)
            .post("/api/auth/login")
            .send({ email: student1.user.email, password: "WrongPassword" })
        );
      }

      const results = await Promise.all(attempts);
      const statuses = results.map((r) => r.status);
      expect(statuses).toContain(429);
      const rateLimitedCount = statuses.filter((s) => s === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
});
