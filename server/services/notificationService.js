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
  try {
    if (!recipient) {
      console.error("Notification recipient is missing.");
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    });

    // Deliver the saved notification to its recipient's private room.
    if (notificationIO) {
      notificationIO
        .to(`user:${recipient.toString()}`)
        .emit("notification:new", notification.toObject());
    }

    return notification;
  } catch (error) {
    console.error("Notification creation error:", error);
    return null;
  }
};
