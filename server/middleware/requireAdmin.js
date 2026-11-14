
import { getAuth } from "@clerk/express";
import User from "../models/User.js";

const requireAdmin = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const user = await User.findOne({
      clerkUserId: userId,
      role: "admin",
      isActive: true,
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access.",
    });
  }
};

export default requireAdmin;
