import mongoose from "mongoose";

const requestMatchSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

requestMatchSchema.index({ bloodRequest: 1, donor: 1 }, { unique: true });

const RequestMatch = mongoose.model("RequestMatch", requestMatchSchema);

export default RequestMatch;
