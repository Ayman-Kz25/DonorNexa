import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestMatch",
      required: true,
      unique: true,
    },
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
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
    units: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: "Donation units must be a whole number.",
      },
    },
    donatedOn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Quickly retrieve a donor's donation history.
donationSchema.index({ donor: 1, donatedOn: -1 });

// Quickly retrieve a hospital's donation records.
donationSchema.index({ hospital: 1, donatedOn: -1 });

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
