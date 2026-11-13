import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import City from "../models/City.js";
import Donor from "../models/Donor.js";
import Hospital from "../models/Hospital.js";
import BloodRequest from "../models/BloodRequest.js";
import BloodInventory from "../models/BloodInventory.js";
import RequestMatch from "../models/RequestMatch.js";
import Donation from "../models/Donation.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Setting from "../models/Setting.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    // Seed data will be added here.
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
