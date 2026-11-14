import BloodRequest from "../models/BloodRequest.js";
import RequestMatch from "../models/RequestMatch.js";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import Donation from "../models/Donation.js";
import Hospital from "../models/Hospital.js";
import logAdminAction from "../utils/logAdminAction.js";
import { generateRequestMatches } from "../services/requestMatchingService.js";
import { createNotification } from "../services/notificationService.js";
import mongoose from "mongoose";

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

    if (urgency === "critical") {
      const criticalRequestCount = await BloodRequest.countDocuments({
        hospital: req.hospital._id,
        urgency: "critical",
        status: "open",
      });

      if (criticalRequestCount >= 3) {
        return res.status(400).json({
          success: false,
          message:
            "You can only have 3 open Critical blood requests at a time.",
        });
      }
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

export const updateBloodRequest = async (req, res) => {
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
        message: "Only open requests can be updated.",
      });
    }

    const { unitsRequired, urgency, requiredBy, hospitalNotes } = req.body;

    if (
      unitsRequired !== undefined &&
      (!Number.isInteger(Number(unitsRequired)) ||
        Number(unitsRequired) < 1 ||
        Number(unitsRequired) <
          bloodRequest.unitsFulfilled + bloodRequest.unitsReserved)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Units required must be positive and cannot be less than fulfilled and reserved units.",
      });
    }

    if (requiredBy !== undefined) {
      const deadline = new Date(requiredBy);

      if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Required-by date must be in the future.",
        });
      }

      bloodRequest.requiredBy = deadline;
      bloodRequest.expiresAt = deadline;
    }

    const oldValue = {
      unitsRequired: bloodRequest.unitsRequired,
      urgency: bloodRequest.urgency,
      requiredBy: bloodRequest.requiredBy,
      hospitalNotes: bloodRequest.hospitalNotes,
    };

    if (urgency === "critical" && bloodRequest.urgency !== "critical") {
      const criticalRequestCount = await BloodRequest.countDocuments({
        hospital: req.hospital._id,
        urgency: "critical",
        status: "open",
        _id: { $ne: bloodRequest._id },
      });

      if (criticalRequestCount >= 3) {
        return res.status(400).json({
          success: false,
          message:
            "You can only have 3 open Critical blood requests at a time.",
        });
      }
    }

    if (unitsRequired !== undefined) {
      bloodRequest.unitsRequired = Number(unitsRequired);
    }

    if (urgency !== undefined) {
      bloodRequest.urgency = urgency;
    }

    if (hospitalNotes !== undefined) {
      bloodRequest.hospitalNotes = hospitalNotes;
    }

    await bloodRequest.save();

    await logAdminAction({
      userId: req.user._id,
      action: "BLOOD_REQUEST_UPDATED",
      targetType: "BloodRequest",
      targetId: bloodRequest._id,
      oldValue,
      newValue: {
        unitsRequired: bloodRequest.unitsRequired,
        urgency: bloodRequest.urgency,
        requiredBy: bloodRequest.requiredBy,
        hospitalNotes: bloodRequest.hospitalNotes,
      },
      ipAddress: req.ip,
      description: `Updated blood request for ${bloodRequest.bloodGroup}.`,
    });

    // Notify donors with pending matches.
    const pendingMatches = await RequestMatch.find({
      bloodRequest: bloodRequest._id,
      status: "pending",
    }).populate({
      path: "donor",
      populate: {
        path: "user",
        select: "_id",
      },
    });

    const notifiedUsers = new Set();

    await Promise.all(
      pendingMatches.map((match) => {
        const recipientId = match.donor?.user?._id?.toString();

        if (!recipientId || notifiedUsers.has(recipientId)) return null;

        notifiedUsers.add(recipientId);

        return createNotification({
          recipient: recipientId,
          type: "REQUEST_UPDATED",
          title: "Blood Request Updated",
          message: `The ${bloodRequest.bloodGroup} blood request in ${bloodRequest.city} has been updated by the hospital. Please review the latest details.`,
          relatedId: bloodRequest._id,
          relatedModel: "BloodRequest",
        });
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Blood request updated successfully.",
      bloodRequest,
    });
  } catch (error) {
    console.error("Update blood request error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update blood request.",
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

export const getPublicStats = async (req, res) => {
  try {
    const now = new Date();

    const [activeRequests, registeredDonors, fulfilledUnits] =
      await Promise.all([
        // Count active requests from active hospitals.
        BloodRequest.aggregate([
          {
            $match: {
              status: "open",
              requiredBy: { $gt: now },
              expiresAt: { $gt: now },
            },
          },
          {
            $lookup: {
              from: "hospitals",
              localField: "hospital",
              foreignField: "_id",
              as: "hospital",
            },
          },
          { $unwind: "$hospital" },
          {
            $match: {
              "hospital.isActive": { $ne: false },
            },
          },
          { $count: "total" },
        ]),

        // Count donors with active user accounts.
        Donor.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $match: {
              "user.role": "donor",
              "user.isActive": true,
            },
          },
          { $count: "total" },
        ]),

        // Sum units from confirmed donation records.
        Donation.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$units" },
            },
          },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        activeRequests: activeRequests[0]?.total || 0,
        registeredDonors: registeredDonors[0]?.total || 0,
        unitsFulfilled: fulfilledUnits[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Public statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve public statistics.",
    });
  }
};

export const cancelBloodRequest = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancellationResult = null;

    await session.withTransaction(async () => {
      const bloodRequest = await BloodRequest.findOne({
        _id: req.params.id,
        hospital: req.hospital._id,
      }).session(session);

      if (!bloodRequest) {
        cancellationResult = { error: "not_found" };
        return;
      }

      if (bloodRequest.status !== "open") {
        cancellationResult = { error: "not_open" };
        return;
      }

      // Find pending and accepted matches.
      const affectedMatches = await RequestMatch.find({
        bloodRequest: bloodRequest._id,
        status: { $in: ["pending", "accepted"] },
      })
        .populate({
          path: "donor",
          populate: {
            path: "user",
            select: "_id",
          },
        })
        .session(session);

      // Each accepted match has reserved one unit.
      const acceptedCount = affectedMatches.filter(
        (match) => match.status === "accepted",
      ).length;

      const oldValue = {
        status: bloodRequest.status,
        unitsReserved: bloodRequest.unitsReserved,
      };

      // Cancel the request and release reserved units.
      bloodRequest.status = "cancelled";
      bloodRequest.unitsReserved = Math.max(
        0,
        bloodRequest.unitsReserved - acceptedCount,
      );

      await bloodRequest.save({ session });

      // Expire all pending and accepted matches.
      await RequestMatch.updateMany(
        {
          bloodRequest: bloodRequest._id,
          status: { $in: ["pending", "accepted"] },
        },
        {
          $set: {
            status: "expired",
          },
        },
        { session },
      );

      cancellationResult = {
        bloodRequest,
        affectedMatches,
        oldValue,
      };
    });

    if (cancellationResult.error === "not_found") {
      return res.status(404).json({
        success: false,
        message: "Blood request not found.",
      });
    }

    if (cancellationResult.error === "not_open") {
      return res.status(400).json({
        success: false,
        message: "Only open requests can be cancelled.",
      });
    }

    const { bloodRequest, affectedMatches, oldValue } = cancellationResult;

    await logAdminAction({
      userId: req.user._id,
      action: "BLOOD_REQUEST_CANCELLED",
      targetType: "BloodRequest",
      targetId: bloodRequest._id,
      oldValue,
      newValue: {
        status: bloodRequest.status,
        unitsReserved: bloodRequest.unitsReserved,
      },
      ipAddress: req.ip,
      description: `Cancelled blood request for ${bloodRequest.bloodGroup}.`,
    });

    // Notify all affected donors.
    const notifiedUsers = new Set();

    await Promise.all(
      affectedMatches.map((match) => {
        const recipientId = match.donor?.user?._id?.toString();

        if (!recipientId || notifiedUsers.has(recipientId)) {
          return null;
        }

        notifiedUsers.add(recipientId);

        return createNotification({
          recipient: recipientId,
          type: "REQUEST_UPDATED",
          title: "Blood Request Cancelled",
          message: `The ${bloodRequest.bloodGroup} blood request in ${bloodRequest.city} has been cancelled by the hospital.`,
          relatedId: bloodRequest._id,
          relatedModel: "BloodRequest",
        });
      }),
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
  } finally {
    await session.endSession();
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
