import Donor from "../models/Donor.js";
import User from "../models/User.js";
import { getCompatibleDonorGroups } from "../utils/bloodCompatibility.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";
import BloodRequest from "../models/BloodRequest.js";

export const createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsRequired, urgency, requiredBy, hospitalNotes } =
      req.body;

    if (!bloodGroup || !unitsRequired || !requiredBy) {
      return res.status(400).json({
        success: false,
        message:
          "Blood group, units required and required-by date are required.",
      });
    }

    if (!Number.isInteger(Number(unitsRequired)) || Number(unitsRequired) < 1) {
      return res.status(400).json({
        success: false,
        message: "Units required must be a positive whole number.",
      });
    }

    const deadline = new Date(requiredBy);

    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Required-by date must be in the future.",
      });
    }

    const expiresAt = new Date(deadline);

    const bloodRequest = await BloodRequest.create({
      hospital: req.hospital._id,
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      urgency: urgency || "normal",
      requiredBy: deadline,
      city: req.hospital.city,
      hospitalNotes: hospitalNotes || "",
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message: "Blood request created successfully.",
      bloodRequest,
    });
  } catch (error) {
    console.error("Create blood request error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create blood request.",
    });
  }
};

export const getHospitalBloodRequests = async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find({
      hospital: req.hospital._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bloodRequests.length,
      bloodRequests,
    });
  } catch (error) {
    console.error("Get hospital blood requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve blood requests.",
    });
  }
};

export const getActiveBloodRequests = async (req, res) => {
  try {
    const now = new Date();

    const bloodRequests = await BloodRequest.find({
      status: "open",
      requiredBy: { $gt: now },
      expiresAt: { $gt: now },
    })
      .select(
        "bloodGroup unitsRequired urgency requiredBy city createdAt hospital",
      )
      .populate("hospital", "hospitalName")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bloodRequests.length,
      bloodRequests,
    });
  } catch (error) {
    console.error("Active blood requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve active blood requests.",
    });
  }
};

export const cancelBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      hospital: req.hospital._id,
    });

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found.",
      });
    }

    if (bloodRequest.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open requests can be cancelled.",
      });
    }

    bloodRequest.status = "cancelled";
    await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: "Blood request cancelled successfully.",
      bloodRequest,
    });
  } catch (error) {
    console.error("Cancel blood request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel blood request.",
    });
  }
};

export const getMatchingDonors = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      hospital: req.hospital._id,
      status: "open",
      expiresAt: { $gt: new Date() },
      requiredBy: { $gt: new Date() },
    });

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: "Active blood request not found.",
      });
    }

    const compatibleGroups = getCompatibleDonorGroups(bloodRequest.bloodGroup);

    const donors = await Donor.find({
      bloodGroup: { $in: compatibleGroups },
      city: {
        $regex: `^${bloodRequest.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      isAvailable: true,
    }).populate({
      path: "user",
      match: {
        role: "donor",
        isActive: true,
      },
      select: "name",
    });

    const matchingDonors = donors
      .filter((donor) => donor.user && checkDonorEligibility(donor).eligible)
      .map((donor) => ({
        donorId: donor._id,
        name: donor.user.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        totalDonations: donor.totalDonations,
      }));

    const rankedDonors = rankDonors(matchingDonors);

    return res.status(200).json({
      success: true,
      requestId: bloodRequest._id,
      requestedBloodGroup: bloodRequest.bloodGroup,
      compatibleGroups,
      count: rankedDonors.length,
      donors: rankedDonors,
    });
  } catch (error) {
    console.error("Donor matching error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to find matching donors.",
    });
  }
};
