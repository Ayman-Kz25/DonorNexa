import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import RequestMatch from "../models/RequestMatch.js";
import BloodRequest from "../models/BloodRequest.js";
import BloodInventory from "../models/BloodInventory.js";
import Donation from "../models/Donation.js";
import Hospital from "../models/Hospital.js";
import logAdminAction from "../utils/logAdminAction.js";
import mongoose from "mongoose";
import { generateRequestMatches } from "../services/requestMatchingService.js";

// Calculate the donor response deadline.
// Supports both new matches and older matches without responseDeadlineAt.
const getMatchResponseDeadline = (match) => {
  if (match.responseDeadlineAt) {
    return new Date(match.responseDeadlineAt);
  }

  const responseWindowHours = Math.max(
    1,
    Number(process.env.DONOR_RESPONSE_WINDOW_HOURS) || 2,
  );

  const notifiedAt = match.notifiedAt || match.createdAt;

  if (!notifiedAt) return null;

  return new Date(
    new Date(notifiedAt).getTime() + responseWindowHours * 60 * 60 * 1000,
  );
};

// Get the earliest blood request deadline.
const getRequestEndTime = (bloodRequest) => {
  if (!bloodRequest) return null;

  const deadlines = [bloodRequest.expiresAt, bloodRequest.requiredBy]
    .filter(Boolean)
    .map((date) => new Date(date).getTime())
    .filter(Number.isFinite);

  return deadlines.length > 0 ? Math.min(...deadlines) : null;
};

// Expand the donor pool if the blood request is still active.
const expandDonorPool = async (requestId) => {
  try {
    const bloodRequest = await BloodRequest.findById(requestId);

    if (!bloodRequest || bloodRequest.status !== "open") {
      return 0;
    }

    const requestEndTime = getRequestEndTime(bloodRequest);

    if (requestEndTime !== null && requestEndTime <= Date.now()) {
      return 0;
    }

    const result = await generateRequestMatches(
      bloodRequest,
      bloodRequest.city,
    );

    return result.notifiedCount;
  } catch (error) {
    console.error(
      `Donor pool expansion error for request ${requestId}:`,
      error,
    );

    return 0;
  }
};

// Determine whether a pending match should become no_response or expired.
const getPendingMatchStatus = (match, now) => {
  const request = match.bloodRequest;

  // A missing, cancelled, fulfilled, or otherwise closed request is expired.
  if (!request || request.status !== "open") {
    return "expired";
  }

  const responseDeadline = getMatchResponseDeadline(match);
  const requestEndTime = getRequestEndTime(request);

  const responseDeadlinePassed =
    responseDeadline &&
    !Number.isNaN(responseDeadline.getTime()) &&
    responseDeadline <= now;

  const requestDeadlinePassed =
    requestEndTime !== null && requestEndTime <= now.getTime();

  // The donor's deadline passed before the request deadline.
  if (
    responseDeadlinePassed &&
    (requestEndTime === null || responseDeadline.getTime() <= requestEndTime)
  ) {
    return "no_response";
  }

  // The blood request became inactive first.
  if (requestDeadlinePassed) {
    return "expired";
  }

  return null;
};

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

    const now = new Date();

    let matches = await RequestMatch.find({
      donor: donor._id,
    }).populate({
      path: "bloodRequest",
      select:
        "bloodGroup unitsRequired urgency city requiredBy expiresAt status",
    });

    const requestsForExpansion = new Set();

    // Synchronize pending matches with their deadlines.
    for (const match of matches) {
      if (match.status !== "pending") continue;

      const newStatus = getPendingMatchStatus(match, now);

      if (!newStatus) continue;

      const updatedMatch = await RequestMatch.findOneAndUpdate(
        {
          _id: match._id,
          status: "pending",
        },
        {
          $set: {
            status: newStatus,
            ...(newStatus === "no_response"
              ? {
                  responseDeadlineAt: getMatchResponseDeadline(match),
                }
              : {}),
          },
        },
        { new: true },
      );

      // Log only when the status was actually changed.
      if (updatedMatch) {
        await logAdminAction({
          userId: user._id,
          action:
            newStatus === "no_response" ? "MATCH_NO_RESPONSE" : "MATCH_EXPIRED",
          targetType: "RequestMatch",
          targetId: match._id,
          oldValue: { status: "pending" },
          newValue: { status: newStatus },
          ipAddress: req.ip,
          description:
            newStatus === "no_response"
              ? "Donor did not respond before the response deadline."
              : "Pending donor match expired because the blood request became inactive.",
        });

        if (newStatus === "no_response" && match.bloodRequest?._id) {
          requestsForExpansion.add(match.bloodRequest._id.toString());
        }
      }
    }

    // Expand each affected request only once.
    for (const requestId of requestsForExpansion) {
      await expandDonorPool(requestId);
    }

    // Fetch the latest match statuses.
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
      donorBloodGroup: donor.bloodGroup,
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
    let outcome = "responded";

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

      const bloodRequest = await BloodRequest.findById(
        match.bloodRequest,
      ).session(session);

      // Calculate both deadlines.
      const responseDeadline = getMatchResponseDeadline(match);
      const requestEndTime = getRequestEndTime(bloodRequest);

      const responseDeadlinePassed =
        responseDeadline &&
        !Number.isNaN(responseDeadline.getTime()) &&
        responseDeadline <= now;

      const requestClosed = !bloodRequest || bloodRequest.status !== "open";

      const requestDeadlinePassed =
        requestEndTime !== null && requestEndTime <= now.getTime();

      // A cancelled, fulfilled, or otherwise closed request is expired.
      if (requestClosed) {
        outcome = "expired";

        updatedMatch = await RequestMatch.findOneAndUpdate(
          {
            _id: match._id,
            status: "pending",
          },
          {
            $set: { status: "expired" },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedMatch) {
          throw new Error("Unable to expire this match.");
        }

        return;
      }

      // Check which deadline passed first.
      const donorDeadlinePassedFirst =
        responseDeadlinePassed &&
        (requestEndTime === null ||
          responseDeadline.getTime() <= requestEndTime);

      if (donorDeadlinePassedFirst) {
        outcome = "no_response";

        updatedMatch = await RequestMatch.findOneAndUpdate(
          {
            _id: match._id,
            status: "pending",
          },
          {
            $set: {
              status: "no_response",
              responseDeadlineAt: responseDeadline,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedMatch) {
          throw new Error("Unable to update the timed-out match.");
        }

        return;
      }

      // The blood request deadline passed before the donor deadline.
      if (requestDeadlinePassed) {
        outcome = "expired";

        updatedMatch = await RequestMatch.findOneAndUpdate(
          {
            _id: match._id,
            status: "pending",
          },
          {
            $set: { status: "expired" },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedMatch) {
          throw new Error("Unable to expire this match.");
        }

        return;
      }

      // Prevent accepting requests from inactive or unverified hospitals.
      if (status === "accepted") {
        const hospital = await Hospital.findOne({
          _id: bloodRequest.hospital,
          verificationStatus: "verified",
          isActive: { $ne: false },
        }).session(session);

        if (!hospital) {
          const error = new Error(
            "This hospital is currently inactive. You cannot accept this request.",
          );
          error.statusCode = 400;
          throw error;
        }

        // Reserve one unit only if the request still has capacity.
        const updatedRequest = await BloodRequest.findOneAndUpdate(
          {
            _id: bloodRequest._id,
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
      }

      // Accept or decline the still-active match.
      updatedMatch = await RequestMatch.findOneAndUpdate(
        {
          _id: match._id,
          status: "pending",
        },
        {
          $set: {
            status,
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
    });

    // Handle timed-out or inactive matches.
    if (outcome === "no_response" || outcome === "expired") {
      await logAdminAction({
        userId: user._id,
        action:
          outcome === "no_response" ? "MATCH_NO_RESPONSE" : "MATCH_EXPIRED",
        targetType: "RequestMatch",
        targetId: updatedMatch._id,
        oldValue: { status: "pending" },
        newValue: { status: outcome },
        ipAddress: req.ip,
        description:
          outcome === "no_response"
            ? "Donor attempted to respond after the response deadline."
            : "Donor attempted to respond after the blood request became inactive.",
      });

      if (outcome === "no_response") {
        await expandDonorPool(updatedMatch.bloodRequest);
      }

      return res.status(410).json({
        success: false,
        message:
          outcome === "no_response"
            ? "Your response deadline has passed. You can no longer respond to this match."
            : "This blood request is no longer active.",
        match: updatedMatch,
      });
    }

    // Log accepted or declined response.
    await logAdminAction({
      userId: user._id,
      action: status === "accepted" ? "MATCH_ACCEPTED" : "MATCH_DECLINED",
      targetType: "RequestMatch",
      targetId: updatedMatch._id,
      oldValue: { status: "pending" },
      newValue: { status: updatedMatch.status },
      ipAddress: req.ip,
      description: `Donor ${status} a matched blood request.`,
    });

    // Expand the donor pool when a donor declines.
    if (status === "declined") {
      const bloodRequest = await BloodRequest.findById(
        updatedMatch.bloodRequest,
      );

      if (bloodRequest?.status === "open") {
        try {
          await generateRequestMatches(bloodRequest, bloodRequest.city);
        } catch (error) {
          console.error("Donor pool expansion error:", error);
        }
      }
    }

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
      // Reveal phone number only after donor accepts.
      phone: ["accepted", "completed"].includes(match.status)
        ? match.donor?.user?.phone
        : null,
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

// Updates donor, request counters, and hospital inventory.
export const confirmDonation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let completedMatch;
    let updatedDonor;
    let updatedRequest;
    let donationRecord;
    let previousRequestStatus;

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

      // Add donated unit to hospital inventory.
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

      previousRequestStatus = bloodRequest.status;

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

      donationRecord = donation;

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

    // Log completed donor match.
    await logAdminAction({
      userId: req.hospital.user,
      action: "MATCH_COMPLETED",
      targetType: "RequestMatch",
      targetId: completedMatch._id,
      oldValue: { status: "accepted" },
      newValue: { status: "completed" },
      ipAddress: req.ip,
      description: "Hospital confirmed the donor's blood donation.",
    });

    // Log donation record creation.
    await logAdminAction({
      userId: req.hospital.user,
      action: "DONATION_CONFIRMED",
      targetType: "Donation",
      targetId: donationRecord._id,
      oldValue: null,
      newValue: {
        bloodGroup: donationRecord.bloodGroup,
        units: donationRecord.units,
        donatedOn: donationRecord.donatedOn,
      },
      ipAddress: req.ip,
      description: `Confirmed ${donationRecord.units} unit donation of ${donationRecord.bloodGroup}.`,
    });

    // Log automatic request fulfillment.
    if (
      updatedRequest.status === "fulfilled" &&
      previousRequestStatus !== "fulfilled"
    ) {
      await logAdminAction({
        userId: req.hospital.user,
        action: "BLOOD_REQUEST_FULFILLED",
        targetType: "BloodRequest",
        targetId: updatedRequest._id,
        oldValue: { status: previousRequestStatus },
        newValue: { status: updatedRequest.status },
        ipAddress: req.ip,
        description: `Blood request for ${updatedRequest.bloodGroup} automatically fulfilled after all required units were donated.`,
      });
    }

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
