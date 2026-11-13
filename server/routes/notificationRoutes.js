import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", requireAuth, getMyNotifications);
router.patch("/read-all", requireAuth, markAllNotificationsAsRead);
router.patch("/:notificationId/read", requireAuth, markNotificationAsRead);

export default router;
