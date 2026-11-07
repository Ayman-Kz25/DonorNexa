import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import RequestMatch from "../models/RequestMatch.js";
import BloodRequest from "../models/BloodRequest.js";
import mongoose from "mongoose";

// Get requests matched with the logged-in donor

export const getMyMatches = async (req, res) => {
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

    // Fetch matches with their blood request details
    let matches = await RequestMatch.find({
      donor: donor._id,
    }).populate({
      path: "bloodRequest",
      select:
        "bloodGroup unitsRequired urgency city requiredBy expiresAt status",
    });

    const now = new Date();

    // Find pending matches whose requests are no longer active
    const inactiveMatchIds = matches
      .filter((match) => {
        const bloodRequest = match.bloodRequest;

        return (
          match.status === "pending" &&
          bloodRequest &&
          (bloodRequest.status !== "open" || bloodRequest.expiresAt <= now)
        );
      })
      .map((match) => match._id);

    // Synchronize their status in MongoDB
    if (inactiveMatchIds.length > 0) {
      await RequestMatch.updateMany(
        {
          _id: { $in: inactiveMatchIds },
          status: "pending",
        },
        {
          $set: { status: "expired" },
        },
      );
    }

    // Fetch updated records
    matches = await RequestMatch.find({
      donor: donor._id,
    })
      .populate({
        path: "bloodRequest",
        select:
          "bloodGroup unitsRequired urgency city requiredBy expiresAt status",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("Get donor matches error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch matched requests.",
    });
  }
};

// Accept or decline a matched request
export const respondToMatch = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response.",
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

    const match = await RequestMatch.findOne({
      _id: req.params.matchId,
      donor: donor._id,
      status: "pending",
    }).populate("bloodRequest");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Pending matched request not found.",
      });
    }

    if (
      !match.bloodRequest ||
      match.bloodRequest.status !== "open" ||
      match.bloodRequest.expiresAt <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "This blood request is no longer active.",
      });
    }

    match.status = status;
    match.respondedAt = new Date();

    await match.save();

    return res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      match,
    });
  } catch (error) {
    console.error("Donor response error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your response.",
    });
  }
};

// Get donor responses for a hospital's blood request
export const getHospitalMatchResponses = async (req, res) => {
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

    const matches = await RequestMatch.find({
      bloodRequest: bloodRequest._id,
    })
      .populate({
        path: "donor",
        select: "bloodGroup city totalDonations user",
        populate: {
          path: "user",
          select: "name phone",
        },
      })
      .sort({ createdAt: -1 });

    const responses = matches.map((match) => ({
      matchId: match._id,
      donorName: match.donor?.user?.name || "Unknown Donor",
      bloodGroup: match.donor?.bloodGroup,
      city: match.donor?.city,
      totalDonations: match.donor?.totalDonations,
      status: match.status,
      respondedAt: match.respondedAt,
      // Reveal phone number only after donor accepts
      phone: match.status === "accepted" ? match.donor?.user?.phone : null,
    }));

    return res.status(200).json({
      success: true,
      responses,
    });
  } catch (error) {
    console.error("Hospital match responses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch donor responses.",
    });
  }
};

export const confirmDonation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let completedMatch;
    let updatedDonor;

    await session.withTransaction(async () => {
      const match = await RequestMatch.findOne({
        _id: req.params.matchId,
        status: "accepted",
      })
        .populate("bloodRequest")
        .session(session);

      if (!match) {
        const error = new Error("Accepted donor match not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        !match.bloodRequest ||
        match.bloodRequest.hospital.toString() !== req.hospital._id.toString()
      ) {
        const error = new Error("You are not authorized to confirm this donation.");
        error.statusCode = 403;
        throw error;
      }

      if (["cancelled", "expired"].includes(match.bloodRequest.status)) {
        const error = new Error("This blood request is no longer active.");
        error.statusCode = 400;
        throw error;
      }

      const donationDate = new Date();

      const eligibleAgainDate = new Date(donationDate);
      eligibleAgainDate.setDate(eligibleAgainDate.getDate() + 90);

      updatedDonor = await Donor.findByIdAndUpdate(
        match.donor,
        {
          $inc: { totalDonations: 1 },
          $set: {
            lastDonationDate: donationDate,
            eligibleAgainDate,
            isAvailable: false,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!updatedDonor) {
        throw new Error("Donor profile not found.");
      }

      completedMatch = await RequestMatch.findOneAndUpdate(
        {
          _id: match._id,
          status: "accepted",
        },
        {
          $set: { status: "completed" },
        },
        {
          new: true,
          session,
        },
      );

      if (!completedMatch) {
        throw new Error("Unable to complete this donation.");
      }
    });

    return res.status(200).json({
      success: true,
      message: "Donation confirmed successfully.",
      match: completedMatch,
      donor: {
        totalDonations: updatedDonor.totalDonations,
        lastDonationDate: updatedDonor.lastDonationDate,
        eligibleAgainDate: updatedDonor.eligibleAgainDate,
        isAvailable: updatedDonor.isAvailable,
      },
    });
  } catch (error) {
    console.error("Donation confirmation error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to confirm donation.",
    });
  } finally {
    await session.endSession();
  }
};