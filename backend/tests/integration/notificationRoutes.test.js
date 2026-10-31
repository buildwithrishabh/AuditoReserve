const request = require("supertest");
const app = require("../../src/app");
const Notification = require("../../src/models/notification");
const { createTestUser } = require("../helpers/authHelper");

describe("Integration: Notification Routes (/api/notifications)", () => {
  let userAuth, otherUserAuth;

  beforeEach(async () => {
    userAuth = await createTestUser();
    otherUserAuth = await createTestUser();
  });

  describe("GET /api/notifications", () => {
    it("should return paginated notifications for the logged in user", async () => {
      await Notification.create([
        {
          recipient: userAuth.user._id,
          type: "BOOKING_PENDING",
          title: "Booking 1",
          message: "Message 1",
        },
        {
          recipient: userAuth.user._id,
          type: "PAYMENT_REQUEST",
          title: "Booking 2",
          message: "Message 2",
        },
        {
          recipient: otherUserAuth.user._id,
          type: "SYSTEM",
          title: "Other User",
          message: "Other Message",
        },
      ]);

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.pagination.totalItems).toBe(2);
    });

    it("should reject with 401 if not authenticated", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should return the correct count of unread notifications", async () => {
      await Notification.create([
        {
          recipient: userAuth.user._id,
          type: "BOOKING_PENDING",
          title: "Unread 1",
          message: "Msg",
          isRead: false,
        },
        {
          recipient: userAuth.user._id,
          type: "PAYMENT_REQUEST",
          title: "Unread 2",
          message: "Msg",
          isRead: false,
        },
        {
          recipient: userAuth.user._id,
          type: "BOOKING_CONFIRMED",
          title: "Read 1",
          message: "Msg",
          isRead: true,
        },
      ]);

      const res = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  describe("PATCH /api/notifications/:id", () => {
    it("should mark a specific notification as read", async () => {
      const notification = await Notification.create({
        recipient: userAuth.user._id,
        type: "BOOKING_APPROVED",
        title: "Approved",
        message: "Pay now",
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/notifications/${notification._id}`)
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.isRead).toBe(true);

      const inDb = await Notification.findById(notification._id);
      expect(inDb.isRead).toBe(true);
    });

    it("should return 404 if notification belongs to another user", async () => {
      const notification = await Notification.create({
        recipient: otherUserAuth.user._id,
        type: "BOOKING_APPROVED",
        title: "Other's notification",
        message: "Msg",
      });

      const res = await request(app)
        .patch(`/api/notifications/${notification._id}`)
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Notification not found");
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all unread notifications as read for current user", async () => {
      await Notification.create([
        {
          recipient: userAuth.user._id,
          type: "BOOKING_PENDING",
          title: "N1",
          message: "M1",
          isRead: false,
        },
        {
          recipient: userAuth.user._id,
          type: "BOOKING_APPROVED",
          title: "N2",
          message: "M2",
          isRead: false,
        },
        {
          recipient: otherUserAuth.user._id,
          type: "BOOKING_PENDING",
          title: "Other N",
          message: "Other M",
          isRead: false,
        },
      ]);

      const res = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user's notifications are all read
      const unreadCount = await Notification.countDocuments({
        recipient: userAuth.user._id,
        isRead: false,
      });
      expect(unreadCount).toBe(0);

      // Verify other user's notification is still unread
      const otherUnread = await Notification.findOne({
        recipient: otherUserAuth.user._id,
        isRead: false,
      });
      expect(otherUnread).not.toBeNull();
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("should delete the notification for the owner", async () => {
      const notification = await Notification.create({
        recipient: userAuth.user._id,
        type: "SYSTEM",
        title: "To be deleted",
        message: "M",
      });

      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Notification deleted successfully");

      const inDb = await Notification.findById(notification._id);
      expect(inDb).toBeNull();
    });

    it("should return 404 when attempting to delete another user's notification", async () => {
      const notification = await Notification.create({
        recipient: otherUserAuth.user._id,
        type: "SYSTEM",
        title: "Other's notice",
        message: "M",
      });

      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set("Authorization", userAuth.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Notification not found");

      const inDb = await Notification.findById(notification._id);
      expect(inDb).not.toBeNull();
    });
  });
});

