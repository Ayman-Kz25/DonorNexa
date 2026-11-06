import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";

export const createDonorProfile = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const { bloodGroup, dateOfBirth, weight } = req.body;

    if (!bloodGroup || !dateOfBirth || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Blood group, date of birth and weight are required.",
      });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user || user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Donor account not found or unauthorized.",
      });
    }

    const donor = await Donor.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          bloodGroup,
          dateOfBirth,
          weight,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return res.status(201).json({
      success: true,
      message: "Donor profile saved successfully.",
      donor,
    });
  } catch (error) {
    console.error("Donor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save donor profile.",
    });
  }
};
