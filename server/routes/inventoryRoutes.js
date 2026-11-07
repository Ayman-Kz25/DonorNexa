import express from "express";
import {
  getHospitalInventory,
  updateHospitalInventory,
} from "../controllers/inventoryController.js";
import requireVerifiedHospital from "../middleware/requireVerifiedHospital.js";

const router = express.Router();

router.get("/", requireVerifiedHospital, getHospitalInventory);
router.put("/", requireVerifiedHospital, updateHospitalInventory);

export default router;
