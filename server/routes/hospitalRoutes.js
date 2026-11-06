import express from "express";
import {
  registerHospital,
  getHospitalProfile,
  approveHospital,
  rejectHospital,
  getPendingHospitals,
} from "../controllers/hospitalController.js";

import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/register", registerHospital);
router.get("/profile", getHospitalProfile);

// Admin-only routes
router.patch("/:id/approve", requireAdmin, approveHospital);
router.patch("/:id/reject", requireAdmin, rejectHospital);
router.patch("/pending", requireAdmin, getPendingHospitals);

export default router;
