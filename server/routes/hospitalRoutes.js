
import express from "express";
import {
  registerHospital,
  getHospitalProfile,
  approveHospital,
  rejectHospital,
  getPendingHospitals,
  getVerifiedHospitals,
  getHospitalLicenseDocument,
  getMyHospitalLicenseDocument,
} from "../controllers/hospitalController.js";

import requireAdmin from "../middleware/requireAdmin.js";
import uploadHospitalLicense from "../middleware/uploadHospitalLicense.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Hospital routes
router.post("/register", uploadHospitalLicense, registerHospital);
router.get("/profile", getHospitalProfile);
router.get("/verified", getVerifiedHospitals);

router.get("/my-license", requireAuth, getMyHospitalLicenseDocument);

// Admin-only routes
router.get("/pending", requireAdmin, getPendingHospitals);
router.get("/:id/license", requireAdmin, getHospitalLicenseDocument);
router.patch("/:id/approve", requireAdmin, approveHospital);
router.patch("/:id/reject", requireAdmin, rejectHospital);

export default router;
