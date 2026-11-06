
const compatibilityMap = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

export const isBloodCompatible = (donorGroup, recipientGroup) => {
  return compatibilityMap[donorGroup]?.includes(recipientGroup) ?? false
}

export const getCompatibleDonorGroups = (recipientGroup) => {
  return Object.keys(compatibilityMap).filter((donorGroup) =>
    isBloodCompatible(donorGroup, recipientGroup)
  )
}
