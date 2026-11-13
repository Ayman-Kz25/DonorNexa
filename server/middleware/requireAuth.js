import { getAuth } from "@clerk/express";
import User from "../models/User.js";

const requireAuth = async (req, res, next) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const user = await User.findOne({
      clerkUserId: userId,
      isActive: true,
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Active user account not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
};

export default requireAuth;
