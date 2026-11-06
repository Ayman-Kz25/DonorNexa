import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";

export const createDonorProfile = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const { bloodGroup, dateOfBirth, weight, city } = req.body;

    if (!bloodGroup || !dateOfBirth || weight === undefined || !city?.trim()) {
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
          city: city.trim(),
        },
        $setOnInsert: {
          user: user._id,
          isAvailable: false,
        },
      },
      { new: true, upsert: true, runValidators: true },
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

export const getDonorProfile = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user || user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "Donor account not found.",
      });
    }

    const donor = await Donor.findOne({ user: user._id });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      donor,
    });
  } catch (error) {
    console.error("Get donor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve donor profile.",
    });
  }
};

export const updateDonorAvailability = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid availability status is required.",
      });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user || user.role !== "donor" || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Donor account not found or inactive.",
      });
    }

    const donor = await Donor.findOne({ user: user._id });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found.",
      });
    }

    if (isAvailable) {
      const screening = checkDonorEligibility(donor);

      if (!screening.eligible) {
        return res.status(400).json({
          success: false,
          message: "You do not meet the eligibility rules.",
          reasons: screening.reasons,
          eligibleAgainDate: screening.eligibleAgainDate,
        });
      }
    }

    donor.isAvailable = isAvailable;
    await donor.save();

    return res.status(200).json({
      success: true,
      message: `Donor availability turned ${isAvailable ? "ON" : "OFF"}.`,
      isAvailable: donor.isAvailable,
    });
  } catch (error) {
    console.error("Availability update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update availability.",
    });
  }
};
