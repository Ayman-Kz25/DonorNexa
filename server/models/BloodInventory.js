import mongoose from "mongoose";

const bloodInventorySchema = new mongoose.Schema(
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
    unitsAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

bloodInventorySchema.index({ hospital: 1, bloodGroup: 1 }, { unique: true });

const BloodInventory = mongoose.model("BloodInventory", bloodInventorySchema);

export default BloodInventory;
