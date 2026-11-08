import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import RequestMatch from "../models/RequestMatch.js";
import BloodRequest from "../models/BloodRequest.js";
import BloodInventory from "../models/BloodInventory.js";
import Donation from "../models/Donation.js";
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
          (bloodRequest.status !== "open" ||
            bloodRequest.expiresAt <= now ||
            bloodRequest.requiredBy <= now)
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

// Accept or decline a matched request safely
export const respondToMatch = async (req, res) => {
  const session = await mongoose.startSession();

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

    let updatedMatch;

    await session.withTransaction(async () => {
      const match = await RequestMatch.findOne({
        _id: req.params.matchId,
        donor: donor._id,
        status: "pending",
      }).session(session);

      if (!match) {
        const error = new Error("Pending matched request not found.");
        error.statusCode = 404;
        throw error;
      }

      const now = new Date();

      if (status === "declined") {
        updatedMatch = await RequestMatch.findOneAndUpdate(
          {
            _id: match._id,
            status: "pending",
          },
          {
            $set: {
              status: "declined",
              respondedAt: now,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedMatch) {
          throw new Error("Unable to submit your response.");
        }

        return;
      }

      // Reserve one unit only if the request still has capacity.
      const updatedRequest = await BloodRequest.findOneAndUpdate(
        {
          _id: match.bloodRequest,
          status: "open",
          expiresAt: { $gt: now },
          requiredBy: { $gt: now },
          $expr: {
            $lt: [
              {
                $add: [
                  { $ifNull: ["$unitsReserved", 0] },
                  { $ifNull: ["$unitsFulfilled", 0] },
                ],
              },
              "$unitsRequired",
            ],
          },
        },
        {
          $inc: { unitsReserved: 1 },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedRequest) {
        const error = new Error(
          "This request is no longer active or all required units have already been reserved.",
        );
        error.statusCode = 400;
        throw error;
      }

      updatedMatch = await RequestMatch.findOneAndUpdate(
        {
          _id: match._id,
          status: "pending",
        },
        {
          $set: {
            status: "accepted",
            respondedAt: now,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedMatch) {
        // Throwing rolls back the unit reservation too.
        throw new Error("Unable to accept this request.");
      }
    });

    return res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Donor response error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to submit your response.",
    });
  } finally {
    await session.endSession();
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

//updates the donor, request counters and hospital inventory
export const confirmDonation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let completedMatch;
    let updatedDonor;
    let updatedRequest;

    await session.withTransaction(async () => {
      const match = await RequestMatch.findOne({
        _id: req.params.matchId,
        status: "accepted",
      }).session(session);

      if (!match) {
        const error = new Error("Accepted donor match not found.");
        error.statusCode = 404;
        throw error;
      }

      const bloodRequest = await BloodRequest.findById(
        match.bloodRequest,
      ).session(session);

      if (
        !bloodRequest ||
        bloodRequest.hospital.toString() !== req.hospital._id.toString()
      ) {
        const error = new Error(
          "You are not authorized to confirm this donation.",
        );
        error.statusCode = 403;
        throw error;
      }

      if (bloodRequest.status !== "open") {
        const error = new Error("This blood request is no longer active.");
        error.statusCode = 400;
        throw error;
      }

      const donationDate = new Date();

      // Move one unit from reserved to fulfilled.
      updatedRequest = await BloodRequest.findOneAndUpdate(
        {
          _id: bloodRequest._id,
          status: "open",
          unitsReserved: { $gte: 1 },
        },
        {
          $inc: {
            unitsReserved: -1,
            unitsFulfilled: 1,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedRequest) {
        throw new Error("No reserved unit was found for this donation.");
      }

      // Update donor donation history counters.
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

      // Add the donated unit to this hospital's inventory.
      await BloodInventory.findOneAndUpdate(
        {
          hospital: bloodRequest.hospital,
          bloodGroup: bloodRequest.bloodGroup,
        },
        {
          $inc: { unitsAvailable: 1 },
          $set: { lastUpdated: donationDate },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session,
        },
      );

      // Complete the accepted donor match.
      completedMatch = await RequestMatch.findOneAndUpdate(
        {
          _id: match._id,
          status: "accepted",
        },
        {
          $set: {
            status: "completed",
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!completedMatch) {
        throw new Error("Unable to complete this donation.");
      }

      // Save the individual donation record.
      const [donation] = await Donation.create(
        [
          {
            match: completedMatch._id,
            bloodRequest: bloodRequest._id,
            donor: match.donor,
            hospital: bloodRequest.hospital,
            bloodGroup: bloodRequest.bloodGroup,
            units: 1,
            donatedOn: donationDate,
            verifiedBy: req.user?._id || req.hospital.user,
          },
        ],
        { session },
      );

      // Close the request only when every required unit is fulfilled
      // and no accepted donor reservations remain.
      if (
        updatedRequest.unitsFulfilled >= updatedRequest.unitsRequired &&
        updatedRequest.unitsReserved === 0
      ) {
        updatedRequest.status = "fulfilled";
        await updatedRequest.save({ session });
      }
    });

    return res.status(200).json({
      success: true,
      message:
        "Donation confirmed and hospital inventory updated successfully.",
      match: completedMatch,
      request: {
        unitsRequired: updatedRequest.unitsRequired,
        unitsReserved: updatedRequest.unitsReserved,
        unitsFulfilled: updatedRequest.unitsFulfilled,
        status: updatedRequest.status,
      },
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
      message: error.statusCode ? error.message : "Unable to confirm donation.",
    });
  } finally {
    await session.endSession();
  }
};
