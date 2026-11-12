
import express from "express";
import {
  registerHospital,
  getHospitalProfile,
  approveHospital,
  rejectHospital,
  getPendingHospitals,
  getVerifiedHospitals,
  getHospitalLicenseDocument,
} from "../controllers/hospitalController.js";

import requireAdmin from "../middleware/requireAdmin.js";
import uploadHospitalLicense from "../middleware/uploadHospitalLicense.js";

const router = express.Router();

// Hospital routes
router.post("/register", uploadHospitalLicense, registerHospital);
router.get("/profile", getHospitalProfile);
router.get("/verified", getVerifiedHospitals);

// Admin-only routes
router.get("/pending", requireAdmin, getPendingHospitals);
router.get("/:id/license", requireAdmin, getHospitalLicenseDocument);
router.patch("/:id/approve", requireAdmin, approveHospital);
router.patch("/:id/reject", requireAdmin, rejectHospital);

export default router;
