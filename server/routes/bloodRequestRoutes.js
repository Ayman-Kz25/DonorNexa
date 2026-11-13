import express from "express";
import {
  cancelBloodRequest,
  createBloodRequest,
  getActiveBloodRequests,
  getHospitalBloodRequests,
  getMatchingDonors,
  markBloodRequestFulfilled,
  updateBloodRequest,
} from "../controllers/bloodRequestController.js";

import requireVerifiedHospital from "../middleware/requireVerifiedHospital.js";
import {
  confirmDonation,
  getHospitalMatchResponses,
} from "../controllers/requestMatchController.js";

const router = express.Router();

router.get("/active", getActiveBloodRequests);

router.post("/", requireVerifiedHospital, createBloodRequest);

router.get("/my-requests", requireVerifiedHospital, getHospitalBloodRequests);

router.patch("/:id", requireVerifiedHospital, updateBloodRequest);

router.patch(
  "/:id/fulfill",
  requireVerifiedHospital,
  markBloodRequestFulfilled,
);

router.patch(
  "/matches/:matchId/confirm-donation",
  requireVerifiedHospital,
  confirmDonation,
);

router.patch("/:id/cancel", requireVerifiedHospital, cancelBloodRequest);

router.get("/:id/matches", requireVerifiedHospital, getMatchingDonors);

router.get(
  "/:id/matches/responses",
  requireVerifiedHospital,
  getHospitalMatchResponses,
);

export default router;
