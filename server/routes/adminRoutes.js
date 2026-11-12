import express from "express";
import {
  getAdminOverview,
  getAdminAnalytics,
  getAdminUsers,
  updateUserStatus,
  getAdminCities,
  addCity,
  updateCityStatus,
  getAdminAuditLogs,
  updateHospitalStatus,
  getAdminBloodRequests,
  exportAdminBloodRequests,
  exportAdminUsers,
  exportAdminAuditLogs,
  exportAdminHospitals,
  exportAdminCities,
  exportAdminDonors,
  getAdminSettings,
  updateAdminSettings,
} from "../controllers/adminController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/overview", requireAdmin, getAdminOverview);
router.get("/analytics", requireAdmin, getAdminAnalytics);

router.get("/users", requireAdmin, getAdminUsers);
router.get("/blood-requests", requireAdmin, getAdminBloodRequests);
router.patch("/users/:id/status", requireAdmin, updateUserStatus);

router.get("/cities", requireAdmin, getAdminCities);
router.post("/cities", requireAdmin, addCity);
router.patch("/cities/:id/status", requireAdmin, updateCityStatus);

router.get("/audit-logs", requireAdmin, getAdminAuditLogs);
router.patch("/hospitals/:id/status", requireAdmin, updateHospitalStatus);

router.get("/blood-requests/export", requireAdmin, exportAdminBloodRequests);
router.get("/users/export", requireAdmin, exportAdminUsers);
router.get("/audit-logs/export", requireAdmin, exportAdminAuditLogs);
router.get("/hospitals/export", requireAdmin, exportAdminHospitals);
router.get("/cities/export", requireAdmin, exportAdminCities);
router.get("/donors/export", requireAdmin, exportAdminDonors);

router.get("/settings", requireAdmin, getAdminSettings);
router.patch("/settings", requireAdmin, updateAdminSettings);

export default router;
