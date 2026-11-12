import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import Donation from "../models/Donation.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";

const validateDonorDetails = ({ dateOfBirth, weight, city, phone }) => {
  const errors = {};

  // City: 3–20 letters, spaces allowed
  const cleanedCity = city?.trim();

  if (
    !cleanedCity ||
    !/^[A-Za-z ]{3,20}$/.test(cleanedCity) ||
    !/[A-Za-z]{3}/.test(cleanedCity)
  ) {
    errors.city =
      "City must contain 3–20 letters. Only letters and spaces are allowed.";
  }

  // Weight: minimum 50 kg
  const numericWeight = Number(weight);

  if (
    weight === "" ||
    weight === undefined ||
    !Number.isFinite(numericWeight) ||
    numericWeight < 50
  ) {
    errors.weight = "Donor weight must be at least 50 kg.";
  }

  // Date of birth: valid date and age 18–60
  if (!dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else {
    const [year, month, day] = dateOfBirth.split("-").map(Number);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    const isValidDate =
      birthDate.getFullYear() === year &&
      birthDate.getMonth() === month - 1 &&
      birthDate.getDate() === day;

    if (!isValidDate || birthDate > today) {
      errors.dateOfBirth = "Please provide a valid date of birth.";
    } else {
      let age = today.getFullYear() - year;

      const birthdayNotReached =
        today.getMonth() < month - 1 ||
        (today.getMonth() === month - 1 && today.getDate() < day);

      if (birthdayNotReached) age--;

      if (age < 18 || age > 60) {
        errors.dateOfBirth = "Donor age must be between 18 and 60 years.";
      }
    }
  }

  // Pakistani phone number formats
  const cleanedPhone = phone?.trim();

  if (!/^(03[0-9]{9}|\+92[0-9]{10})$/.test(cleanedPhone || "")) {
    errors.phone =
      "Enter a valid Pakistani number: 03XXXXXXXXX or +92XXXXXXXXXX.";
  }

  return errors;
};

export const createDonorProfile = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const { bloodGroup, dateOfBirth, weight, city, phone } = req.body;

    if (
      !bloodGroup ||
      !dateOfBirth ||
      weight === undefined ||
      !city?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All donor details, including phone number, are required.",
      });
    }

    // Server-side validation
    const errors = validateDonorDetails({
      dateOfBirth,
      weight,
      city,
      phone,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the invalid donor details.",
        errors,
      });
    }

    const cleanedPhone = phone.trim();

    const user = await User.findOne({ clerkUserId: userId });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account not found or inactive.",
      });
    }

    if (user.role !== "unassigned" && user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "This account cannot register as a donor.",
      });
    }

    const donor = await Donor.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          bloodGroup,
          dateOfBirth,
          weight: Number(weight),
          city: city.trim(),
        },
        $setOnInsert: {
          user: user._id,
          isAvailable: false,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      },
    );

    // Save phone number in the User collection
    user.phone = cleanedPhone;
    user.role = "donor";
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Donor profile saved successfully.",
      donor: {
        ...donor.toObject(),
        phone: user.phone,
      },
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
      donor: {
        ...donor.toObject(),
        phone: user.phone || "",
      },
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

// Get donation history of the logged-in donor
export const getDonorDonationHistory = async (req, res) => {
  try {
    const { userId } = getAuth(req);

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

    const donations = await Donation.find({
      donor: donor._id,
    })
      .populate("hospital", "hospitalName city")
      .sort({ donatedOn: -1 });

    return res.status(200).json({
      success: true,
      totalDonations: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Donor donation history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch donation history.",
    });
  }
};
