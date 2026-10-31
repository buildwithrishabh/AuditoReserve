const request = require("supertest");
const app = require("../../src/app");
const Booking = require("../../src/models/booking");
const Payment = require("../../src/models/payment");
const Notification = require("../../src/models/notification");
const emailQueue = require("../../src/queue/emailQueue");
const bookingExpiryQueue = require("../../src/queue/bookingExpiryQueue");
const razorpayClient = require("../../src/config/razorPay");
const { createTestUser, createTestAdmin } = require("../helpers/authHelper");
const { createAuditoriumFixture, createBookingFixture } = require("../helpers/fixtures");

describe("Integration: Booking Routes (/api/bookings)", () => {
  let studentAuth, adminAuth, auditorium;

  beforeEach(async () => {
    studentAuth = await createTestUser();
    adminAuth = await createTestAdmin();
    auditorium = await createAuditoriumFixture({ basePrice: 1000 });
  });

  describe("POST /api/bookings/createBooking", () => {
    it("should successfully create a pending booking, calculate price correctly, and schedule expiry", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(0, 0, 0, 0);

      const payload = {
        auditoriumId: auditorium._id.toString(),
        bookingDate: tomorrow.toISOString(),
        startTime: "10:00",
        endTime: "12:30", // 2.5 hours * 1000 = 2500
        purpose: "Hackathon Orientation",
      };

      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe("pending");
      expect(res.body.booking.totalPrice).toBe(2500);

      // Verify stored in MongoDB
      const dbBooking = await Booking.findById(res.body.booking._id);
      expect(dbBooking).not.toBeNull();
      expect(dbBooking.user.toString()).toBe(studentAuth.user._id.toString());
      expect(dbBooking.totalPrice).toBe(2500);

      // Verify in-app notification created
      const notification = await Notification.findOne({
        recipient: studentAuth.user._id,
        type: "BOOKING_PENDING",
      });
      expect(notification).not.toBeNull();

      // Verify pending auto-expiry job scheduled in BullMQ
      expect(bookingExpiryQueue.add).toHaveBeenCalledWith(
        `expire_pending_${dbBooking._id}`,
        { bookingId: dbBooking._id, type: "pending" },
        expect.objectContaining({
          jobId: `booking_pending_expire_${dbBooking._id}`,
        })
      );
    });

    it("should reject booking if student already has 3 pending booking requests", async () => {
      // Create 3 active pending bookings
      for (let i = 0; i < 3; i++) {
        await createBookingFixture({
          user: studentAuth.user._id,
          auditorium: auditorium._id,
          status: "pending",
          startTime: `${10 + i}:00`,
          endTime: `${11 + i}:00`,
        });
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send({
          auditoriumId: auditorium._id.toString(),
          bookingDate: tomorrow.toISOString(),
          startTime: "16:00",
          endTime: "18:00",
          purpose: "4th Booking Request",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already have 3 pending booking requests");
    });

    it("should reject booking with 400 if start time is after or equal to end time", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send({
          auditoriumId: auditorium._id.toString(),
          bookingDate: tomorrow.toISOString(),
          startTime: "14:00",
          endTime: "13:00",
          purpose: "Invalid time range",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Start time must be before end time");
    });

    it("should reject booking with 400 for past dates", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send({
          auditoriumId: auditorium._id.toString(),
          bookingDate: yesterday.toISOString(),
          startTime: "10:00",
          endTime: "12:00",
          purpose: "Past booking attempt",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Booking date must be today or future");
    });

    it("should reject booking with 400 if the slot conflicts with an approved or confirmed booking", async () => {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 3);
      bookingDate.setHours(0, 0, 0, 0);

      // Create an existing confirmed booking from 10:00 to 12:00
      await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "10:00",
        endTime: "12:00",
        status: "confirmed",
      });

      // Attempt to book overlapping slot 11:30 to 13:30
      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send({
          auditoriumId: auditorium._id.toString(),
          bookingDate: bookingDate.toISOString(),
          startTime: "11:30",
          endTime: "13:30",
          purpose: "Overlapping request",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("This time slot is already booked");
    });

    it("should reject booking with 400 if the same user already has a pending request for an overlapping slot", async () => {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 3);
      bookingDate.setHours(0, 0, 0, 0);

      // Existing pending booking from 14:00 to 16:00
      await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "14:00",
        endTime: "16:00",
        status: "pending",
      });

      // Attempt second pending booking for overlapping slot 15:00 to 17:00
      const res = await request(app)
        .post("/api/bookings/createBooking")
        .set("Authorization", studentAuth.authHeader)
        .send({
          auditoriumId: auditorium._id.toString(),
          bookingDate: bookingDate.toISOString(),
          startTime: "15:00",
          endTime: "17:00",
          purpose: "Duplicate slot request",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already have a pending booking request for this time slot");
    });
  });

  describe("GET /api/bookings/my-bookings", () => {
    it("should return paginated bookings for the authenticated student", async () => {
      await createBookingFixture({ user: studentAuth.user._id, auditorium: auditorium._id });
      await createBookingFixture({ user: studentAuth.user._id, auditorium: auditorium._id });

      // Booking for another student
      const otherAuth = await createTestUser();
      await createBookingFixture({ user: otherAuth.user._id, auditorium: auditorium._id });

      const res = await request(app)
        .get("/api/bookings/my-bookings")
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.bookings).toHaveLength(2);
    });
  });

  describe("PUT /api/bookings/cancel/:id", () => {
    it("should allow student to cancel their own pending booking", async () => {
      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/bookings/cancel/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe("cancelled");

      const inDb = await Booking.findById(booking._id);
      expect(inDb.status).toBe("cancelled");
    });

    it("should prevent cancelling a confirmed booking with 400", async () => {
      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "confirmed",
      });

      const res = await request(app)
        .put(`/api/bookings/cancel/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Confirmed booking cannot be cancelled");
    });

    it("should reject cancellation with 403 if booking belongs to another student", async () => {
      const otherAuth = await createTestUser();
      const booking = await createBookingFixture({
        user: otherAuth.user._id,
        auditorium: auditorium._id,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/bookings/cancel/${booking._id}`)
        .set("Authorization", studentAuth.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Unauthorized access");
    });
  });

  describe("Admin: PUT /api/bookings/status/:id", () => {
    it("should allow admin to decline/cancel a pending booking and notify student", async () => {
      const booking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/bookings/status/${booking._id}`)
        .set("Authorization", adminAuth.authHeader)
        .send({ status: "cancelled" });

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe("cancelled");

      // Verify cancellation email queued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "booking-cancelled-email",
        expect.objectContaining({
          options: expect.objectContaining({
            to: studentAuth.user.email,
          }),
        })
      );
    });

    it("should allow admin to approve a booking: create Razorpay order, initialize Payment, update Booking atomically, and auto-decline conflicting pending bookings", async () => {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 4);
      bookingDate.setHours(0, 0, 0, 0);

      // Target booking to approve (10:00 - 12:00)
      const bookingToApprove = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "10:00",
        endTime: "12:00",
        totalPrice: 2000,
        status: "pending",
      });

      // Conflicting pending booking from another student (11:00 - 13:00)
      const otherStudent = await createTestUser();
      const conflictingBooking = await createBookingFixture({
        user: otherStudent.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "11:00",
        endTime: "13:00",
        totalPrice: 2000,
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/bookings/status/${bookingToApprove._id}`)
        .set("Authorization", adminAuth.authHeader)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toBe("approved");

      // Verify Razorpay order was created for amount in paise
      expect(razorpayClient.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2000 * 100,
          currency: "INR",
        })
      );

      // Verify Payment record was created in DB with 12h expiry
      const payment = await Payment.findOne({ booking: bookingToApprove._id });
      expect(payment).not.toBeNull();
      expect(payment.status).toBe("created");
      expect(payment.amount).toBe(2000);

      // Verify booking updated with paymentId and 12h payment deadline
      const approvedDbBooking = await Booking.findById(bookingToApprove._id);
      expect(approvedDbBooking.paymentId.toString()).toBe(payment._id.toString());
      expect(approvedDbBooking.paymentDeadline).toBeDefined();

      // Verify 12h BullMQ expiry job enqueued
      expect(bookingExpiryQueue.add).toHaveBeenCalledWith(
        `expire_${bookingToApprove._id}`,
        { bookingId: bookingToApprove._id },
        expect.objectContaining({
          delay: 12 * 60 * 60 * 1000,
          jobId: `booking_expire_${bookingToApprove._id}`,
        })
      );

      // Verify conflicting pending booking was automatically cancelled
      const updatedConflict = await Booking.findById(conflictingBooking._id);
      expect(updatedConflict.status).toBe("cancelled");

      // Verify payment request email was enqueued
      expect(emailQueue.add).toHaveBeenCalledWith(
        "payment-request-email",
        expect.objectContaining({
          options: expect.objectContaining({
            to: studentAuth.user.email,
          }),
        })
      );
    });

    it("should reject approval with 400 if slot conflicts with an already confirmed booking", async () => {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 5);
      bookingDate.setHours(0, 0, 0, 0);

      // Already confirmed booking
      await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "10:00",
        endTime: "12:00",
        status: "confirmed",
      });

      // Pending booking on overlapping slot
      const pendingBooking = await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate,
        startTime: "11:00",
        endTime: "13:00",
        status: "pending",
      });

      const res = await request(app)
        .put(`/api/bookings/status/${pendingBooking._id}`)
        .set("Authorization", adminAuth.authHeader)
        .send({ status: "approved" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("conflicts with an already approved/confirmed booking");
    });
  });

  describe("GET /api/bookings/calendar", () => {
    it("should return calendar bookings for a valid YYYY-MM", async () => {
      const nextMonthDate = new Date("2026-11-10T10:00:00.000Z");
      await createBookingFixture({
        user: studentAuth.user._id,
        auditorium: auditorium._id,
        bookingDate: nextMonthDate,
        startTime: "10:00",
        endTime: "12:00",
        status: "approved",
      });

      const res = await request(app)
        .get("/api/bookings/calendar")
        .set("Authorization", studentAuth.authHeader)
        .query({
          auditoriumId: auditorium._id.toString(),
          month: "2026-11",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookings).toHaveLength(1);
    });

    it("should reject calendar query with 400 for invalid month format", async () => {
      const res = await request(app)
        .get("/api/bookings/calendar")
        .set("Authorization", studentAuth.authHeader)
        .query({
          auditoriumId: auditorium._id.toString(),
          month: "2026-13",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid month format");
    });
  });
});

