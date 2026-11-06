import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";

export const registerHospital = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const { hospitalName, licenseNumber, contactPerson, address, city } =
      req.body;

    if (
      !hospitalName ||
      !licenseNumber ||
      !contactPerson ||
      !address ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message: "All hospital fields are required.",
      });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user || user.role !== "donor") {
      return res.status(403).json({
        success: false,
        message: "This account cannot register a hospital.",
      });
    }

    const existingHospital = await Hospital.findOne({
      user: user._id,
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "A hospital profile already exists for this account.",
      });
    }

    const existingLicense = await Hospital.findOne({
      licenseNumber: licenseNumber.trim(),
    });

    if (existingLicense) {
      return res.status(409).json({
        success: false,
        message: "This license number is already registered.",
      });
    }

    const hospital = await Hospital.create({
      user: user._id,
      hospitalName,
      licenseNumber,
      contactPerson,
      address,
      city,
    });

    user.role = "hospital";
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Hospital registration submitted for verification.",
      hospital,
    });
  } catch (error) {
    console.error("Hospital registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register hospital.",
    });
  }
};

export const getHospitalProfile = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const hospital = await Hospital.findOne({
      user: user._id,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Get hospital profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve hospital profile.",
    });
  }
};

export const approveHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    if (hospital.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This hospital has already been reviewed.",
      });
    }

    hospital.verificationStatus = "verified";
    hospital.verifiedAt = new Date();
    hospital.rejectionReason = "";

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital verified successfully.",
      hospital,
    });
  } catch (error) {
    console.error("Hospital approval error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve hospital.",
    });
  }
};

export const rejectHospital = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required.",
      });
    }

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    if (hospital.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This hospital has already been reviewed.",
      });
    }

    hospital.verificationStatus = "rejected";
    hospital.rejectionReason = reason.trim();
    hospital.verifiedAt = null;

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital registration rejected.",
      hospital,
    });
  } catch (error) {
    console.error("Hospital rejection error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject hospital.",
    });
  }
};

export const getPendingHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      verificationStatus: 'pending',
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    })
  } catch (error) {
    console.error('Pending hospitals error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve pending hospitals.',
    })
  }
}
