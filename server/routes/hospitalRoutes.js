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
router.get("/pending", requireAdmin, getPendingHospitals);
router.patch("/:id/approve", requireAdmin, approveHospital);
router.patch("/:id/reject", requireAdmin, rejectHospital);

export default router;
