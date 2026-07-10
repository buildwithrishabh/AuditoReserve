const Notification = require("../models/notification");
const { sendRealTimeNotification } = require("../config/socket");

exports.createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  data,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      data: data || {},
    });

    sendRealTimeNotification(recipient.toString(), notification);

    return notification;
  } catch (error) {
    console.error("Error creating/sending in-app notification: ", error);
  }
};
