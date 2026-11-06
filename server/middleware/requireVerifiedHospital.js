import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";

const requireVerifiedHospital = async (req, res, next) => {
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
      role: "hospital",
      isActive: true,
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Hospital account not found or inactive.",
      });
    }

    const hospital = await Hospital.findOne({
      user: user._id,
      verificationStatus: "verified",
    });

    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: "Your hospital registration is not verified yet.",
      });
    }

    req.user = user;
    req.hospital = hospital;

    next();
  } catch (error) {
    console.error("Hospital authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify hospital access.",
    });
  }
};

export default requireVerifiedHospital;
