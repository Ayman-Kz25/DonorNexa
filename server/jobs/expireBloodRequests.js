import cron from "node-cron";
import BloodRequest from "../models/BloodRequest.js";
import RequestMatch from "../models/RequestMatch.js";
import logAdminAction from "../utils/logAdminAction.js";
import { generateRequestMatches } from "../services/requestMatchingService.js";

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

      // STEP 1: Automatically expire blood requests.
      const requestsToExpire = await BloodRequest.find({
        status: "open",
        $or: [{ expiresAt: { $lte: now } }, { requiredBy: { $lte: now } }],
      }).select("_id status expiresAt requiredBy");

      let expiredRequestCount = 0;

      for (const request of requestsToExpire) {
        const updatedRequest = await BloodRequest.findOneAndUpdate(
          {
            _id: request._id,
            status: "open",
          },
          {
            $set: { status: "expired" },
          },
          { new: true },
        );

        if (!updatedRequest) continue;

        expiredRequestCount++;

        await logAdminAction({
          action: "AUTO_EXPIRE_BLOOD_REQUEST",
          entity: "BloodRequest",
          targetId: request._id,
          oldValue: { status: "open" },
          newValue: { status: "expired" },
          description:
            "Blood request automatically expired after its deadline.",
        });
      }

      // STEP 2: Process all pending donor matches.
      const pendingMatches = await RequestMatch.find({
        status: "pending",
      }).populate("bloodRequest");

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
        expandedRequestCount > 0
      ) {
        console.log("DonorNexa automatic expiry job completed:", {
          expiredRequests: expiredRequestCount,
          noResponseMatches: noResponseCount,
          expiredMatches: expiredMatchCount,
          expandedRequests: expandedRequestCount,
          newlyNotifiedDonors: newlyNotifiedCount,
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
