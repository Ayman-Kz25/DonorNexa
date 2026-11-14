import Setting from "../models/Setting.js";

export const checkDonorEligibility = async (donor) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dob = new Date(donor.dateOfBirth);
  dob.setHours(0, 0, 0, 0);

  let age = today.getFullYear() - dob.getFullYear();

  const monthDifference = today.getMonth() - dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  const reasons = [];

  if (age < 18 || age > 60) {
    reasons.push("Age must be between 18 and 60 years.");
  }

  if (donor.weight < 50) {
    reasons.push("Weight must be at least 50 kg.");
  }

  const setting = await Setting.findOne({
    key: "donationCooldownDays",
  });

  const configuredDays = Number(setting?.value);

  const cooldownDays =
    Number.isInteger(configuredDays) && configuredDays >= 0
      ? configuredDays
      : 90;

  let eligibleAgainDate = null;

  if (donor.lastDonationDate) {
    eligibleAgainDate = new Date(donor.lastDonationDate);

    eligibleAgainDate.setDate(eligibleAgainDate.getDate() + cooldownDays);

    if (today < eligibleAgainDate) {
      reasons.push(
        `You can try again after ${eligibleAgainDate.toDateString()}.`,
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    age,
    reasons,
    eligibleAgainDate,
  };
};
