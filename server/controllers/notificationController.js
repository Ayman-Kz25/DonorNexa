import Notification from "../models/Notification.js";

// Get notifications for the logged-in user.
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),

      Notification.countDocuments({
        recipient: userId,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
};

// Mark one notification as read.
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user._id,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

// Mark all notifications as read.
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};
