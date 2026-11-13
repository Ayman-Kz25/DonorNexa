import express from "express";
import City from "../models/City.js";

const router = express.Router();

// Get all active cities
router.get("/", async (req, res) => {
  try {
    const cities = await City.find({ isActive: true })
      .select("name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      cities,
    });
  } catch (error) {
    console.error("Fetch cities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch cities.",
    });
  }
});

export default router;
