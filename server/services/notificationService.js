import Notification from "../models/Notification.js";

let notificationIO = null;

export const setNotificationIO = (io) => {
  notificationIO = io;
};

export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedId = null,
  relatedModel = null,
}) => {
  if (!recipient) {
    console.error("Notification recipient is missing.");
    return null;
  }

  let notification;

  // Save the notification first.
  try {
    notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    });
  } catch (error) {
    console.error("Notification database error:", error);
    return null;
  }

  // Socket.IO is best-effort; the saved notification remains available.
  if (notificationIO) {
    try {
      notificationIO
        .to(`user:${recipient.toString()}`)
        .emit("notification:new", notification.toObject());
    } catch (error) {
      console.error("Real-time notification error:", error);
    }
  }

  return notification;
};
