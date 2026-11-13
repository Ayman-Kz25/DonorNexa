import Notification from "../models/Notification.js";

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

    return notification;
  } catch (error) {
    console.error("Notification creation error:", error);
    return null;
  }
};
