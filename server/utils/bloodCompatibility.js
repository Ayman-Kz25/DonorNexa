
const compatibilityMap = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// Checks whether a donor can donate to a recipient.
export const isBloodCompatible = (donorGroup, recipientGroup) => {
  return compatibilityMap[donorGroup]?.includes(recipientGroup) ?? false;
};

// Returns donor groups compatible with a recipient.
export const getCompatibleDonorGroups = (recipientGroup) => {
  return Object.keys(compatibilityMap).filter((donorGroup) =>
    isBloodCompatible(donorGroup, recipientGroup),
  );
};

// Returns recipient groups that a donor can donate to.
export const getCompatibleRecipientGroups = (donorGroup) => {
  return compatibilityMap[donorGroup] || [];
};
