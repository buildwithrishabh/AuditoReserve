const mongoose = require("mongoose");

jest.mock("../../../src/config/socket", () => ({
  sendRealTimeNotification: jest.fn(),
  initSocket: jest.fn(),
  closeSocket: jest.fn(),
  getIo: jest.fn(),
}));

const { createNotification } = require("../../../src/service/notificationService");
const Notification = require("../../../src/models/notification");
const { sendRealTimeNotification } = require("../../../src/config/socket");

describe("Unit: Notification Service", () => {
  it("should create notification document in DB and route real-time alert via socket", async () => {
    const recipientId = new mongoose.Types.ObjectId();
    const payload = {
      recipient: recipientId,
      type: "BOOKING_PENDING",
      title: "Booking Requested",
      message: "Your booking request is pending admin review.",
      data: { bookingId: new mongoose.Types.ObjectId() },
    };

    const notification = await createNotification(payload);

    expect(notification).toBeDefined();
    expect(notification.recipient.toString()).toBe(recipientId.toString());
    expect(notification.type).toBe("BOOKING_PENDING");
    expect(notification.isRead).toBe(false);

    // Verify persisted in MongoDB
    const persisted = await Notification.findById(notification._id);
    expect(persisted).not.toBeNull();
    expect(persisted.title).toBe("Booking Requested");

    // Verify real-time socket delivery was invoked
    expect(sendRealTimeNotification).toHaveBeenCalledWith(recipientId.toString(), expect.any(Object));
  });
});
