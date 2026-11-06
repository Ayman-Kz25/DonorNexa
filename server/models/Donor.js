import mongoose from "mongoose";

const donorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    weight: {
      type: Number,
      required: true,
      min: 1,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    lastDonationDate: {
      type: Date,
      default: null,
    },

    eligibleAgainDate: {
      type: Date,
      default: null,
    },

    totalDonations: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Donor = mongoose.model("Donor", donorSchema);

export default Donor;
