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
      enum: [
        "pending",
        "accepted",
        "declined",
        "no_response",
        "expired",
        "completed",
      ],
      default: "pending",
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    responseDeadlineAt: {
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

requestMatchSchema.index({ donor: 1, status: 1 });

const RequestMatch = mongoose.model("RequestMatch", requestMatchSchema);

export default RequestMatch;
