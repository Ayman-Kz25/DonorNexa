import cron from "node-cron";
import BloodRequest from "../models/BloodRequest.js";
import RequestMatch from "../models/RequestMatch.js";

const startExpirationJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expiredRequests = await BloodRequest.find({
        status: "open",
        expiresAt: { $lte: now },
      }).select("_id");

      if (expiredRequests.length === 0) return;

      const requestIds = expiredRequests.map((item) => item._id);

      await BloodRequest.updateMany(
        { _id: { $in: requestIds }, status: "open" },
        { $set: { status: "expired" } },
      );

      await RequestMatch.updateMany(
        {
          bloodRequest: { $in: requestIds },
          status: "pending",
        },
        {
          $set: { status: "expired" },
        },
      );

      console.log(`${requestIds.length} blood request(s) expired.`);
    } catch (error) {
      console.error("Blood request expiration error:", error);
    }
  });

  console.log("Blood request expiration job started.");
};

export default startExpirationJob;
