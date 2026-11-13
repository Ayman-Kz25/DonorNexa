import Donor from "../models/Donor.js";
import RequestMatch from "../models/RequestMatch.js";
import { getCompatibleDonorGroups } from "../utils/bloodCompatibility.js";
import { checkDonorEligibility } from "../utils/donorEligibility.js";

const NOTIFICATION_LIMITS = {
  normal: 10,
  urgent: 20,
  critical: 50,
};

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

  const compatibleGroups = getCompatibleDonorGroups(bloodRequest.bloodGroup);

  const priorityCity = String(hospitalCity || bloodRequest.city || "")
    .trim()
    .toLowerCase();

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

  const eligibilityResults = await Promise.all(
    donors.map(async (donor) => ({
      donor,
      eligibility: donor.user ? await checkDonorEligibility(donor) : null,
    })),
  );

  const eligibleDonors = eligibilityResults
    .filter(({ eligibility }) => eligibility?.eligible)
    .map(({ donor }) => donor);

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

      const donationHistoryScore =
        (Math.min(daysSinceLastDonation, 365) / 365) * 20;

      const responseRate = await getResponseRate(donor._id);
      const responseRateScore = (responseRate / 100) * 30;

      const matchScore =
        (isSameCity ? 100 : 0) +
        (isExactBloodGroup ? 50 : 0) +
        donationHistoryScore +
        responseRateScore;

      return {
        donorId: donor._id,
        name: donor.user.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        totalDonations: donor.totalDonations,
        isSameCity,
        responseRate: Math.round(responseRate * 100) / 100,
        matchScore: Math.round(matchScore * 100) / 100,
      };
    }),
  );

  rankedDonors.sort(
    (a, b) =>
      b.matchScore - a.matchScore || a.totalDonations - b.totalDonations,
  );

  const batchSize =
    NOTIFICATION_LIMITS[bloodRequest.urgency?.toLowerCase()] || 10;

  const existingMatches = await RequestMatch.find({
    bloodRequest: bloodRequest._id,
  }).select("donor");

  const existingDonorIds = new Set(
    existingMatches.map((match) => match.donor.toString()),
  );

  const newDonors = rankedDonors.filter(
    (donor) => !existingDonorIds.has(donor.donorId.toString()),
  );

  const selectedDonors = newDonors.slice(0, batchSize);

  const responseWindowHours = Math.max(
    1,
    Number(process.env.DONOR_RESPONSE_WINDOW_HOURS) || 2,
  );

  const responseDeadlineAt = new Date(
    now.getTime() + responseWindowHours * 60 * 60 * 1000,
  );

  if (notify && selectedDonors.length > 0) {
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
              notifiedAt: now,
              responseDeadlineAt,
              score: donor.matchScore,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  return {
    compatibleGroups,
    rankedDonors,
    notifiedCount: selectedDonors.length,
  };
};
