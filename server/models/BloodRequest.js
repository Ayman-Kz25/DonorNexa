
import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
    },

    // Units currently reserved by accepted donors
    unitsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Units successfully donated and verified
    unitsFulfilled: {
      type: Number,
      default: 0,
      min: 0,
    },

    urgency: {
      type: String,
      enum: ["normal", "urgent", "critical"],
      default: "normal",
    },
    requiredBy: {
      type: Date,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    hospitalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "fulfilled", "cancelled", "expired"],
      default: "open",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const BloodRequest = mongoose.model("BloodRequest", bloodRequestSchema);

export default BloodRequest;
