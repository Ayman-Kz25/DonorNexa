const rankDonors = (donors) => {
  return donors
    .sort((a, b) => {
      return a.totalDonations - b.totalDonations;
    })
    .map((donor, index) => ({
      ...donor,
      rank: index + 1,
    }));
};

export default rankDonors;
