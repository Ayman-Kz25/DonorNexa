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
      min: [50, "Donor weight must be at least 50 kg."],
    },

    city: {
      type: String,
      required: true,
      trim: true,
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
      validate: {
        validator: Number.isInteger,
        message: "Total donations must be a whole number.",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Donor = mongoose.model("Donor", donorSchema);

export default Donor;
