import express from "express";
import {
  createDonorProfile,
  getDonorProfile,
  updateDonorAvailability,
} from "../controllers/donorController.js";

const router = express.Router();

router.post("/profile", createDonorProfile);
router.get("/profile", getDonorProfile);
router.patch("/availability", updateDonorAvailability);

export default router;
