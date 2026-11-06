import express from "express";
import {
  cancelBloodRequest,
  createBloodRequest,
  getActiveBloodRequests,
  getHospitalBloodRequests,
  getMatchingDonors,
} from "../controllers/bloodRequestController.js";
import requireVerifiedHospital from "../middleware/requireVerifiedHospital.js";

const router = express.Router();

router.post("/active", getActiveBloodRequests);

router.post("/", requireVerifiedHospital, createBloodRequest);

router.post("/my-requests", requireVerifiedHospital, getHospitalBloodRequests);

router.post("/:id/cancel", requireVerifiedHospital, cancelBloodRequest);

router.get("/:id/matches", requireVerifiedHospital, getMatchingDonors);

export default router;
