import express from "express";
import {
  getAdminOverview,
  getAdminUsers,
  updateUserStatus,
  getAdminCities,
  addCity,
  updateCityStatus,
  getAdminAuditLogs,
} from "../controllers/adminController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/overview", requireAdmin, getAdminOverview);
router.get("/users", requireAdmin, getAdminUsers);
router.patch("/users/:id/status", requireAdmin, updateUserStatus);

router.get('/cities', requireAdmin, getAdminCities)
router.post('/cities', requireAdmin, addCity)
router.patch('/cities/:id/status', requireAdmin, updateCityStatus)
router.get("/audit-logs", requireAdmin, getAdminAuditLogs);

export default router;
