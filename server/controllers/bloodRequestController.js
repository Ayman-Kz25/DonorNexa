import Donor from "../models/Donor.js";
import { getCompatibleDonorGroups } from "../utils/bloodCompatibility.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";
import BloodRequest from "../models/BloodRequest.js";
import RequestMatch from "../models/RequestMatch.js";
import logAdminAction from "../utils/logAdminAction.js";
import { generateRequestMatches } from "../services/requestMatchingService.js";

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

    // Generate matching records immediately after request creation.
    await generateRequestMatches(bloodRequest, req.hospital.city);

    await logAdminAction({
      userId: req.user._id,
      action: "BLOOD_REQUEST_CREATED",
      targetType: "BloodRequest",
      targetId: bloodRequest._id,
      oldValue: null,
      newValue: {
        bloodGroup: bloodRequest.bloodGroup,
        unitsRequired: bloodRequest.unitsRequired,
        urgency: bloodRequest.urgency,
        requiredBy: bloodRequest.requiredBy,
        status: bloodRequest.status,
      },
      ipAddress: req.ip,
      description: `Created blood request for ${bloodRequest.bloodGroup} (${bloodRequest.unitsRequired} units).`,
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
      .populate({
        path: "hospital",
        match: { isActive: { $ne: false } },
        select: "hospitalName",
      })
      .sort({ createdAt: -1 })
      .lean();

    const availableRequests = bloodRequests.filter(
      (request) => request.hospital,
    );

    return res.status(200).json({
      success: true,
      count: availableRequests.length,
      bloodRequests: availableRequests,
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

    const oldValue = {
      status: bloodRequest.status,
    };

    bloodRequest.status = "cancelled";
    await bloodRequest.save();

    await logAdminAction({
      userId: req.user._id,
      action: "BLOOD_REQUEST_CANCELLED",
      targetType: "BloodRequest",
      targetId: bloodRequest._id,
      oldValue,
      newValue: {
        status: bloodRequest.status,
      },
      ipAddress: req.ip,
      description: `Cancelled blood request for ${bloodRequest.bloodGroup}.`,
    });

    await RequestMatch.updateMany(
      {
        bloodRequest: bloodRequest._id,
        status: "pending",
      },
      {
        $set: { status: "expired" },
      },
    );

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
    const now = new Date();

    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      hospital: req.hospital._id,
      status: "open",
      expiresAt: { $gt: now },
      requiredBy: { $gt: now },
    });

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: "Active blood request not found.",
      });
    }

    // Rank donors without creating another notification batch.
    const { compatibleGroups, rankedDonors } = await generateRequestMatches(
      bloodRequest,
      req.hospital.city,
      { notify: false },
    );

    return res.status(200).json({
      success: true,
      requestId: bloodRequest._id,
      requestedBloodGroup: bloodRequest.bloodGroup,
      hospitalCity: req.hospital.city,
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

export const markBloodRequestFulfilled = async (req, res) => {
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
        message: "Only open requests can be fulfilled.",
      });
    }

    if (
      bloodRequest.unitsFulfilled < bloodRequest.unitsRequired ||
      bloodRequest.unitsReserved > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required units must be donated and confirmed before fulfilling this request.",
      });
    }

    const oldStatus = bloodRequest.status;

    bloodRequest.status = "fulfilled";
    await bloodRequest.save();

    await RequestMatch.updateMany(
      {
        bloodRequest: bloodRequest._id,
        status: "pending",
      },
      {
        $set: { status: "expired" },
      },
    );

    await logAdminAction({
      userId: req.user._id,
      action: "BLOOD_REQUEST_FULFILLED",
      targetType: "BloodRequest",
      targetId: bloodRequest._id,
      oldValue: { status: oldStatus },
      newValue: { status: bloodRequest.status },
      ipAddress: req.ip,
      description: `Blood request for ${bloodRequest.bloodGroup} manually marked as fulfilled.`,
    });

    return res.status(200).json({
      success: true,
      message: "Blood request fulfilled successfully.",
      bloodRequest,
    });
  } catch (error) {
    console.error("Fulfill blood request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fulfill blood request.",
    });
  }
};
