import cron from "node-cron";
import BloodRequest from "../models/BloodRequest.js";
import RequestMatch from "../models/RequestMatch.js";
import logAdminAction from "../utils/logAdminAction.js";
import { generateRequestMatches } from "../services/requestMatchingService.js";
import { createNotification } from "../services/notificationService.js";
import mongoose from "mongoose";

// Get the earliest deadline of a blood request.
const getRequestEndTime = (bloodRequest) => {
  if (!bloodRequest) return null;

  const deadlines = [bloodRequest.expiresAt, bloodRequest.requiredBy]
    .filter(Boolean)
    .map((date) => new Date(date).getTime())
    .filter(Number.isFinite);

  return deadlines.length > 0 ? Math.min(...deadlines) : null;
};

// Get the donor's response deadline.
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

// Determine whether a pending match should expire or become no_response.
const getPendingMatchStatus = (match, now) => {
  const bloodRequest = match.bloodRequest;

  // A missing or closed request must never count against the donor.
  if (!bloodRequest || bloodRequest.status !== "open") {
    return "expired";
  }

  const requestEndTime = getRequestEndTime(bloodRequest);
  const responseDeadline = getMatchResponseDeadline(match);

  const responseDeadlinePassed =
    responseDeadline &&
    !Number.isNaN(responseDeadline.getTime()) &&
    responseDeadline <= now;

  const requestDeadlinePassed =
    requestEndTime !== null && requestEndTime <= now.getTime();

  // The donor's response deadline came first.
  if (
    responseDeadlinePassed &&
    (requestEndTime === null || responseDeadline.getTime() <= requestEndTime)
  ) {
    return "no_response";
  }

  if (requestDeadlinePassed) {
    return "expired";
  }

  return null;
};

const startExpirationJob = () => {
  let isRunning = false;

  cron.schedule("* * * * *", async () => {
    if (isRunning) return;

    isRunning = true;

    try {
      const now = new Date();

      // STEP 1: Automatically expire requests and release accepted reservations.
      const requestsToExpire = await BloodRequest.find({
        status: "open",
        $or: [{ expiresAt: { $lte: now } }, { requiredBy: { $lte: now } }],
      }).select("_id");

      let expiredRequestCount = 0;
      let releasedReservationCount = 0;

      for (const request of requestsToExpire) {
        const session = await mongoose.startSession();

        let expiryData = null;

        try {
          await session.withTransaction(async () => {
            // Only expire requests that are still open and past deadline.
            const updatedRequest = await BloodRequest.findOneAndUpdate(
              {
                _id: request._id,
                status: "open",
                $or: [
                  { expiresAt: { $lte: now } },
                  { requiredBy: { $lte: now } },
                ],
              },
              {
                $set: { status: "expired" },
              },
              {
                new: true,
                session,
              },
            );

            if (!updatedRequest) return;

            // Find accepted matches before releasing reservations.
            const acceptedMatches = await RequestMatch.find({
              bloodRequest: updatedRequest._id,
              status: "accepted",
            })
              .populate({
                path: "donor",
                populate: {
                  path: "user",
                  select: "_id",
                },
              })
              .session(session);

            const acceptedCount = acceptedMatches.length;

            const oldValue = {
              status: "open",
              unitsReserved: updatedRequest.unitsReserved,
            };

            if (updatedRequest.unitsReserved < acceptedCount) {
              throw new Error(
                `Reservation mismatch for blood request ${updatedRequest._id}.`,
              );
            }

            if (acceptedCount > 0) {
              // Expire all accepted matches.
              await RequestMatch.updateMany(
                {
                  bloodRequest: updatedRequest._id,
                  status: "accepted",
                },
                {
                  $set: { status: "expired" },
                },
                { session },
              );

              // Release their reserved units.
              updatedRequest.unitsReserved -= acceptedCount;
              await updatedRequest.save({ session });
            }

            expiryData = {
              updatedRequest,
              acceptedMatches,
              oldValue,
            };
          });
        } finally {
          await session.endSession();
        }

        if (!expiryData) continue;

        expiredRequestCount++;
        releasedReservationCount += expiryData.acceptedMatches.length;

        const { updatedRequest, acceptedMatches, oldValue } = expiryData;

        await logAdminAction({
          action: "AUTO_EXPIRE_BLOOD_REQUEST",
          entity: "BloodRequest",
          targetId: updatedRequest._id,
          oldValue,
          newValue: {
            status: "expired",
            unitsReserved: updatedRequest.unitsReserved,
          },
          description:
            "Blood request automatically expired after its deadline. Accepted matches were expired and their reservations released.",
        });

        // Notify donors whose accepted matches were expired.
        const notifiedUsers = new Set();

        await Promise.all(
          acceptedMatches.map((match) => {
            const recipientId = match.donor?.user?._id?.toString();

            if (!recipientId || notifiedUsers.has(recipientId)) {
              return null;
            }

            notifiedUsers.add(recipientId);

            return createNotification({
              recipient: recipientId,
              type: "MATCH_EXPIRED",
              title: "Blood Request Expired",
              message: `The ${updatedRequest.bloodGroup} blood request in ${updatedRequest.city} has expired. Your accepted match is no longer active.`,
              relatedId: match._id,
              relatedModel: "RequestMatch",
            });
          }),
        );
      }

      // STEP 2: Process all pending donor matches.
      const pendingMatches = await RequestMatch.find({
        status: "pending",
      })
        .populate("bloodRequest")
        .populate({
          path: "donor",
          select: "user",
        });

      let noResponseCount = 0;
      let expiredMatchCount = 0;

      // Store requests requiring pool expansion.
      // A Set prevents multiple expansions for the same request.
      const requestsForExpansion = new Map();

      for (const match of pendingMatches) {
        const newStatus = getPendingMatchStatus(match, now);

        if (!newStatus) continue;

        const updateData = {
          status: newStatus,
        };

        if (newStatus === "no_response") {
          updateData.responseDeadlineAt = getMatchResponseDeadline(match);
        }

        // Conditional update prevents overwriting a donor's response.
        const updatedMatch = await RequestMatch.findOneAndUpdate(
          {
            _id: match._id,
            status: "pending",
          },
          {
            $set: updateData,
          },
          { new: true },
        );

        if (!updatedMatch) continue;

        if (newStatus === "no_response") {
          noResponseCount++;

          // Notify the donor that their response deadline has passed.
          const donorUserId = match.donor?.user;

          if (donorUserId) {
            await createNotification({
              recipient: donorUserId,
              type: "MATCH_EXPIRED",
              title: "Match Response Deadline Missed",
              message:
                "Your response deadline for a blood donation request has passed. This match is no longer available for your response.",
              relatedId: updatedMatch._id,
              relatedModel: "RequestMatch",
            });
          }

          if (match.bloodRequest?.status === "open") {
            requestsForExpansion.set(
              match.bloodRequest._id.toString(),
              match.bloodRequest,
            );
          }
        } else {
          expiredMatchCount++;
        }

        await logAdminAction({
          action:
            newStatus === "no_response"
              ? "AUTO_MARK_MATCH_NO_RESPONSE"
              : "AUTO_EXPIRE_MATCH",
          entity: "RequestMatch",
          targetId: match._id,
          oldValue: { status: "pending" },
          newValue: { status: newStatus },
          description:
            newStatus === "no_response"
              ? "Donor did not respond before the response deadline."
              : "Pending donor match automatically expired because its request closed or expired.",
        });
      }

      // STEP 3: Expand the donor pool once per affected request.
      let expandedRequestCount = 0;
      let newlyNotifiedCount = 0;

      for (const [requestId] of requestsForExpansion) {
        try {
          // Recheck the latest request status and deadlines.
          const bloodRequest = await BloodRequest.findById(requestId);

          if (!bloodRequest || bloodRequest.status !== "open") {
            continue;
          }

          const requestEndTime = getRequestEndTime(bloodRequest);

          if (
            requestEndTime !== null &&
            requestEndTime <= new Date().getTime()
          ) {
            continue;
          }

          const result = await generateRequestMatches(
            bloodRequest,
            bloodRequest.city,
          );

          if (result.notifiedCount > 0) {
            expandedRequestCount++;
            newlyNotifiedCount += result.notifiedCount;

            console.log(
              `Expanded donor pool for request ${requestId}: ${result.notifiedCount} new donor(s) notified.`,
            );
          }
        } catch (error) {
          console.error(
            `Donor pool expansion failed for request ${requestId}:`,
            error,
          );
        }
      }

      // STEP 4: Log scheduler results.
      if (
        expiredRequestCount > 0 ||
        noResponseCount > 0 ||
        expiredMatchCount > 0 ||
        expandedRequestCount > 0 ||
        releasedReservationCount > 0
      ) {
        console.log("DonorNexa automatic expiry job completed:", {
          expiredRequests: expiredRequestCount,
          noResponseMatches: noResponseCount,
          expiredMatches: expiredMatchCount,
          expandedRequests: expandedRequestCount,
          newlyNotifiedDonors: newlyNotifiedCount,
          releasedReservations: releasedReservationCount,
        });
      }
    } catch (error) {
      console.error("Automatic expiry job error:", error);
    } finally {
      isRunning = false;
    }
  });

  console.log("Automatic request and donor-match expiry job started.");
};

export default startExpirationJob;
