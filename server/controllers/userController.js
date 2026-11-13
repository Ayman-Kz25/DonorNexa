import { clerkClient, getAuth } from "@clerk/express";
import User from "../models/User.js";

export const syncUser = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please sign in.",
      });
    }

    // Get verified user info directly from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail) {
      return res.status(400).json({
        success: false,
        message: "No primary email found in Clerk.",
      });
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "DonorNexa User";

    // Create the profile if it doesn't exist. else update basic details
    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: {
          name,
          email: primaryEmail,
        },
        $setOnInsert: {
          clerkUserId: userId,
          role: "unassigned",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User synchronized successfully.",
      user,
    });
  } catch (error) {
    console.error("User sync error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to synchronize user.",
    });
  }
};
