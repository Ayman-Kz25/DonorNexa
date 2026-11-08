import express from "express";
import {
  createDonorProfile,
  getDonorProfile,
  updateDonorAvailability,
  getDonorDonationHistory,
} from "../controllers/donorController.js";

import {
  getMyMatches,
  respondToMatch,
} from "../controllers/requestMatchController.js";

const router = express.Router();

router.post("/profile", createDonorProfile);
router.get("/profile", getDonorProfile);
router.patch("/availability", updateDonorAvailability);

// Donor donation history
router.get("/donation-history", getDonorDonationHistory);

router.get("/my-matches", getMyMatches);
router.patch("/matches/:matchId/respond", respondToMatch);

export default router;