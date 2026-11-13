import { getAuth } from "@clerk/express";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import City from "../models/City.js";
import logAdminAction from "../utils/logAdminAction.js";

const licenseDirectory = path.resolve("private_uploads", "hospital-licenses");

const removeUploadedLicense = async (req) => {
  if (!req.licenseDocument?.fileUrl) return;

  try {
    await fs.promises.unlink(
      path.join(licenseDirectory, req.licenseDocument.fileUrl),
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("License cleanup error:", error);
    }
  }
};

// Register a hospital
export const registerHospital = async (req, res) => {
  let createdHospital = null;

  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      await removeUploadedLicense(req);
      return res.status(401).json({
        success: false,
        message: "Please sign in first.",
      });
    }

    const {
      hospitalName,
      licenseNumber,
      licenseExpiryDate,
      contactPerson,
      address,
      city,
    } = req.body;

    if (
      !hospitalName?.trim() ||
      !licenseNumber?.trim() ||
      !contactPerson?.trim() ||
      !address?.trim() ||
      !city?.trim() ||
      !licenseExpiryDate
    ) {
      await removeUploadedLicense(req);
      return res.status(400).json({
        success: false,
        message:
          "All hospital fields are required, including license expiry date.",
      });
    }

    if (!req.licenseDocument) {
      return res.status(400).json({
        success: false,
        message: "Hospital license PDF is required.",
      });
    }

    const expiryDate = new Date(licenseExpiryDate);

    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      await removeUploadedLicense(req);
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future license expiry date.",
      });
    }

    const activeCity = await City.findOne({
      name: {
        $regex: `^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      isActive: true,
    });

    if (!activeCity) {
      await removeUploadedLicense(req);

      return res.status(400).json({
        success: false,
        message: "Please select a valid and active city.",
        errors: {
          city: "This city does not exist or is currently unavailable.",
        },
      });
    }

    const user = await User.findOne({
      clerkUserId: userId,
      isActive: true,
    });

    if (!user) {
      await removeUploadedLicense(req);
      return res.status(404).json({
        success: false,
        message: "User account not found. Please sign in again.",
      });
    }

    if (user.role !== "unassigned" && user.role !== "hospital") {
      await removeUploadedLicense(req);
      return res.status(403).json({
        success: false,
        message: "This account cannot register a hospital.",
      });
    }

    const existingHospital = await Hospital.findOne({
      user: user._id,
    });

    if (existingHospital) {
      await removeUploadedLicense(req);
      return res.status(409).json({
        success: false,
        message: "A hospital profile already exists for this account.",
      });
    }

    const existingLicense = await Hospital.findOne({
      licenseNumber: licenseNumber.trim(),
    });

    if (existingLicense) {
      await removeUploadedLicense(req);
      return res.status(409).json({
        success: false,
        message: "This license number is already registered.",
      });
    }

    createdHospital = await Hospital.create({
      user: user._id,
      hospitalName: hospitalName.trim(),
      licenseNumber: licenseNumber.trim(),
      licenseDocument: req.licenseDocument,
      licenseExpiryDate: expiryDate,
      contactPerson: contactPerson.trim(),
      address: address.trim(),
      city: city.trim(),
      verificationStatus: "pending",
      isActive: false,
    });

    user.role = "hospital";
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Hospital registration submitted for verification.",
      hospital: createdHospital,
    });
  } catch (error) {
    console.error("Hospital registration error:", error);

    if (createdHospital) {
      await Hospital.findByIdAndDelete(createdHospital._id);
    }

    await removeUploadedLicense(req);

    return res.status(500).json({
      success: false,
      message: "Unable to register hospital.",
    });
  }
};

// Get the signed-in hospital's profile
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

// Approve a hospital after reviewing its license
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

    if (!hospital.licenseDocument?.fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve a hospital without its license document.",
      });
    }

    if (
      !hospital.licenseExpiryDate ||
      hospital.licenseExpiryDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot approve a hospital with an expired or invalid license.",
      });
    }

    hospital.verificationStatus = "verified";
    hospital.isActive = true;
    hospital.verifiedAt = new Date();
    hospital.verifiedBy = req.user._id;
    hospital.rejectionReason = "";

    await hospital.save();

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: "HOSPITAL_APPROVED",
      targetType: "Hospital",
      targetId: hospital._id,
      oldValue: { verificationStatus: "pending" },
      newValue: {
        verificationStatus: "verified",
        verifiedBy: req.user._id,
      },
      ipAddress: req.ip,
      description: `Approved hospital: ${hospital.hospitalName}`,
    });

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

// Reject a hospital registration
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
    hospital.verifiedBy = null;
    hospital.isActive = false;

    await hospital.save();

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: "HOSPITAL_REJECTED",
      targetType: "Hospital",
      targetId: hospital._id,
      oldValue: { verificationStatus: "pending" },
      newValue: {
        verificationStatus: "rejected",
        rejectionReason: reason.trim(),
      },
      ipAddress: req.ip,
      description: `Rejected hospital: ${hospital.hospitalName}. Reason: ${reason.trim()}`,
    });

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

// Get pending hospitals for admin review
export const getPendingHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      verificationStatus: "pending",
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("Pending hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve pending hospitals.",
    });
  }
};

// Get active verified hospitals
export const getVerifiedHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      verificationStatus: "verified",
      isActive: true,
    })
      .select("hospitalName address city verifiedAt")
      .sort({ hospitalName: 1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("Verified hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve verified hospitals.",
    });
  }
};

// Securely view/download a hospital license (admin only)
export const getHospitalLicenseDocument = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select(
      "licenseDocument",
    );

    if (!hospital?.licenseDocument?.fileUrl) {
      return res.status(404).json({
        success: false,
        message: "License document not found.",
      });
    }

    const filename = hospital.licenseDocument.fileUrl;

    // Only allow generated PDF filenames, not arbitrary paths.
    if (path.basename(filename) !== filename || !filename.endsWith(".pdf")) {
      return res.status(400).json({
        success: false,
        message: "Invalid license document reference.",
      });
    }

    const filePath = path.join(licenseDirectory, filename);

    await fs.promises.access(filePath, fs.constants.R_OK);

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "application/pdf");

    return res.download(
      filePath,
      hospital.licenseDocument.fileName || "hospital-license.pdf",
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "License file is no longer available.",
      });
    }

    console.error("Get hospital license error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve license document.",
    });
  }
};
