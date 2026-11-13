import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

citySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  },
);

const City = mongoose.model("City", citySchema);

export default City;