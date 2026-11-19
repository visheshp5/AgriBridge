
const mongoose = require("mongoose");

const buyerDemandSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    quantityUnit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      default: "quintal",
    },

    offeredPricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      state: {
        type: String,
        required: true,
        trim: true,
      },
      district: {
        type: String,
        required: true,
        trim: true,
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["open", "fulfilled", "cancelled", "expired"],
      default: "open",
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

buyerDemandSchema.index({ cropName: 1, status: 1 });
buyerDemandSchema.index({ buyer: 1, createdAt: -1 });

module.exports = mongoose.model("BuyerDemand", buyerDemandSchema);
