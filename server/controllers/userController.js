import { clerkClient, getAuth } from "@clerk/express";
import User from "../models/User.js";

export const syncUser = async (req, res) => {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please sign in.",
      });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    );

    if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
      return res.status(403).json({
        success: false,
        message: "A verified email address is required.",
      });
    }

    const email = primaryEmail.emailAddress.toLowerCase();

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "DonorNexa User";

    let user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    if (!user) {
      user = await User.create({
        clerkUserId: userId,
        name,
        email,
        role: "unassigned",
      });
    } else {
      user.clerkUserId = userId;
      user.name = name;
      user.email = email;

      await user.save();
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
