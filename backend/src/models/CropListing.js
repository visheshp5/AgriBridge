
const mongoose = require("mongoose");

const cropListingSchema = new mongoose.Schema(
  {
    farmer: {
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

    condition: {
      type: String,
      enum: ["standard", "good", "premium"],
      default: "standard",
    },

    askingPricePerQuintal: {
      type: Number,
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
      village: {
        type: String,
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["available", "negotiating", "sold", "withdrawn"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

cropListingSchema.index({ cropName: 1, status: 1 });
cropListingSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model("CropListing", cropListingSchema);
