import Donor from "../models/Donor.js";
import RequestMatch from "../models/RequestMatch.js";
import Notification from "../models/Notification.js";
import { getCompatibleDonorGroups } from "../utils/bloodCompatibility.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";
import { createNotification } from "./notificationService.js";

const NOTIFICATION_LIMITS = {
  normal: 10,
  urgent: 20,
  critical: 50,
};

// Calculate donor response reliability from previous matches.
const getResponseRate = async (donorId) => {
  const previousMatches = await RequestMatch.find({
    donor: donorId,
    status: {
      $in: ["accepted", "declined", "completed", "no_response"],
    },
  }).select("status");

  const respondedCount = previousMatches.filter((match) =>
    ["accepted", "declined", "completed"].includes(match.status),
  ).length;

  const noResponseCount = previousMatches.filter(
    (match) => match.status === "no_response",
  ).length;

  const totalResponses = respondedCount + noResponseCount;

  return totalResponses === 0 ? 50 : (respondedCount / totalResponses) * 100;
};

// Calculate ranking score for an eligible donor.
const calculateMatchScore = ({
  isSameCity,
  isExactBloodGroup,
  totalDonations,
  daysSinceLastDonation,
  responseRate,
}) => {
  const cityScore = isSameCity ? 1000 : 0;
  const bloodGroupScore = isExactBloodGroup ? 500 : 0;

  const donationExperienceScore =
    totalDonations > 0 ? 60 + Math.min(totalDonations - 1, 4) * 10 : 0;

  const donationHistoryScore =
    (Math.min(Math.max(daysSinceLastDonation, 0), 365) / 365) * 20;

  const responseRateScore = (responseRate / 100) * 30;

  return (
    cityScore +
    bloodGroupScore +
    donationExperienceScore +
    donationHistoryScore +
    responseRateScore
  );
};

export const generateRequestMatches = async (
  bloodRequest,
  hospitalCity = "",
  { notify = true } = {},
) => {
  if (!bloodRequest || bloodRequest.status !== "open") {
    return {
      compatibleGroups: [],
      rankedDonors: [],
      notifiedCount: 0,
    };
  }

  const now = new Date();

  // Do not generate matches for expired requests.
  const deadlines = [bloodRequest.expiresAt, bloodRequest.requiredBy]
    .filter(Boolean)
    .map((date) => new Date(date).getTime())
    .filter(Number.isFinite);

  if (deadlines.length > 0 && Math.min(...deadlines) <= now.getTime()) {
    return {
      compatibleGroups: [],
      rankedDonors: [],
      notifiedCount: 0,
    };
  }

  const compatibleGroups = getCompatibleDonorGroups(bloodRequest.bloodGroup);

  const priorityCity = String(hospitalCity || bloodRequest.city || "")
    .trim()
    .toLowerCase();

  // Fetch available donors with active donor accounts.
  const donors = await Donor.find({
    bloodGroup: { $in: compatibleGroups },
    isAvailable: true,
  }).populate({
    path: "user",
    match: {
      role: "donor",
      isActive: true,
    },
    select: "name",
  });

  // Apply medical and account eligibility requirements.
  const eligibilityResults = await Promise.all(
    donors.map(async (donor) => ({
      donor,
      eligibility: donor.user ? await checkDonorEligibility(donor) : null,
    })),
  );

  const eligibleDonors = eligibilityResults
    .filter(({ eligibility }) => eligibility?.eligible)
    .map(({ donor }) => donor);

  // Calculate scores and rank eligible donors.
  const rankedDonors = await Promise.all(
    eligibleDonors.map(async (donor) => {
      const donorCity = String(donor.city || "")
        .trim()
        .toLowerCase();

      const isSameCity = priorityCity !== "" && donorCity === priorityCity;

      const isExactBloodGroup = donor.bloodGroup === bloodRequest.bloodGroup;

      const daysSinceLastDonation = donor.lastDonationDate
        ? Math.floor(
            (now - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24),
          )
        : 365;

      const responseRate = await getResponseRate(donor._id);

      const totalDonations = Math.max(0, Number(donor.totalDonations) || 0);

      const matchScore = calculateMatchScore({
        isSameCity,
        isExactBloodGroup,
        totalDonations,
        daysSinceLastDonation,
        responseRate,
      });

      return {
        donorId: donor._id,
        name: donor.user.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        totalDonations,
        isSameCity,
        isExactBloodGroup,
        responseRate: Math.round(responseRate * 100) / 100,
        matchScore: Math.round(matchScore * 100) / 100,
      };
    }),
  );

  rankedDonors.sort(
    (a, b) =>
      b.matchScore - a.matchScore || b.totalDonations - a.totalDonations,
  );

  // Recheck availability and account status before selecting donors.
  // This prevents donors who switched OFF during ranking from being selected.
  const rankedDonorIds = rankedDonors.map((donor) => donor.donorId);

  const currentlyAvailableDonors = await Donor.find({
    _id: { $in: rankedDonorIds },
    isAvailable: true,
  }).populate({
    path: "user",
    match: {
      role: "donor",
      isActive: true,
    },
    select: "_id",
  });

  const currentlyAvailableIds = new Set(
    currentlyAvailableDonors
      .filter((donor) => donor.user)
      .map((donor) => donor._id.toString()),
  );

  const availableRankedDonors = rankedDonors.filter((donor) =>
    currentlyAvailableIds.has(donor.donorId.toString()),
  );

  // Determine notification batch size from request urgency.
  const batchSize =
    NOTIFICATION_LIMITS[bloodRequest.urgency?.toLowerCase()] || 10;

  // Prioritize exact blood-group donors before compatible donors.
  const prioritizedDonors = [...availableRankedDonors].sort(
    (a, b) =>
      Number(b.isExactBloodGroup) - Number(a.isExactBloodGroup) ||
      b.matchScore - a.matchScore ||
      b.totalDonations - a.totalDonations,
  );

  // Check existing matches so previously notified donors are not duplicated.
  const existingMatches = await RequestMatch.find({
    bloodRequest: bloodRequest._id,
  }).select("donor status");

  const existingMatchMap = new Map(
    existingMatches.map((match) => [match.donor.toString(), match.status]),
  );

  // Include new donors and donors with no previous match.
  // Existing pending matches will also be checked for missing notifications.
  const newDonors = prioritizedDonors.filter((donor) => {
    const existingStatus = existingMatchMap.get(donor.donorId.toString());

    return !existingStatus || existingStatus === "pending";
  });

  const selectedDonors = newDonors.slice(0, batchSize);

  const responseWindowHours = Math.max(
    1,
    Number(process.env.DONOR_RESPONSE_WINDOW_HOURS) || 2,
  );

  const responseDeadlineAt = new Date(
    now.getTime() + responseWindowHours * 60 * 60 * 1000,
  );

  let notifiedCount = 0;

  if (notify && selectedDonors.length > 0) {
    // Create missing match records without marking them notified yet.
    await RequestMatch.bulkWrite(
      selectedDonors.map((donor) => ({
        updateOne: {
          filter: {
            bloodRequest: bloodRequest._id,
            donor: donor.donorId,
          },
          update: {
            $setOnInsert: {
              bloodRequest: bloodRequest._id,
              donor: donor.donorId,
              status: "pending",
              notifiedAt: null,
              responseDeadlineAt,
              score: donor.matchScore,
            },
          },
          upsert: true,
        },
      })),
    );

    // Retrieve pending matches for the selected donors.
    const pendingMatches = await RequestMatch.find({
      bloodRequest: bloodRequest._id,
      donor: {
        $in: selectedDonors.map((donor) => donor.donorId),
      },
      status: "pending",
    }).populate({
      path: "donor",
      populate: {
        path: "user",
        match: {
          role: "donor",
          isActive: true,
        },
        select: "_id",
      },
    });

    const notificationResults = await Promise.all(
      pendingMatches.map(async (match) => {
        const donor = match.donor;
        const recipientId = donor?.user?._id;

        if (!donor || !recipientId || !donor.isAvailable) {
          return false;
        }

        // Check whether this donor already has a saved notification.
        const existingNotification = await Notification.exists({
          recipient: recipientId,
          type: "NEW_MATCH",
          relatedId: bloodRequest._id,
          relatedModel: "BloodRequest",
        });

        if (existingNotification) {
          // Repair notifiedAt for notifications saved previously.
          if (!match.notifiedAt) {
            await RequestMatch.updateOne(
              { _id: match._id, notifiedAt: null },
              { $set: { notifiedAt: new Date() } },
            );
          }

          return true;
        }

        // Recheck availability immediately before notification.
        const stillAvailable = await Donor.exists({
          _id: donor._id,
          isAvailable: true,
        });

        if (!stillAvailable) {
          return false;
        }

        const notification = await createNotification({
          recipient: recipientId,
          type: "NEW_MATCH",
          title: "New Blood Request Match",
          message: `You have been matched with a ${bloodRequest.urgency} blood request for ${bloodRequest.bloodGroup} blood in ${bloodRequest.city}. Please review and respond before the deadline.`,
          relatedId: bloodRequest._id,
          relatedModel: "BloodRequest",
        });

        if (!notification) {
          console.error(
            `Failed to notify donor ${donor._id} for request ${bloodRequest._id}`,
          );
          return false;
        }

        // Mark the match as notified only after notification is saved.
        await RequestMatch.updateOne(
          { _id: match._id },
          { $set: { notifiedAt: new Date() } },
        );

        return true;
      }),
    );

    notifiedCount = notificationResults.filter(Boolean).length;
  }

  return {
    compatibleGroups,
    rankedDonors: availableRankedDonors,
    notifiedCount,
  };
};
