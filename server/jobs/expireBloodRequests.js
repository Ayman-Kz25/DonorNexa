import cron from "node-cron";
import BloodRequest from "../models/BloodRequest.js";

const startExpirationJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await BloodRequest.updateMany(
        {
          status: "open",
          expiresAt: { $lte: new Date() },
        },
        {
          $set: { status: "expired" },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(`${result.modifiedCount} blood request(s) expired.`);
      }
    } catch (error) {
      console.error("Blood request expiration error:", error);
    }
  });

  console.log("Blood request expiration job started.");
};

export default startExpirationJob;
