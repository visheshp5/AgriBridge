
const CropListing = require("../models/CropListing");

const getAvailableCropListings = async (req, res) => {
  try {
    const listings = await CropListing.find({ status: "available" })
      .populate("farmer", "name location")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    console.error("Error fetching crop listings:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch crop listings",
    });
  }
};


const createCropListing = async (req, res) => {
  try {
    const {
      cropName,
      quantity,
      quantityUnit,
      condition,
      askingPricePerQuintal,
      location,
    } = req.body;

    if (!cropName || !location?.state || !location?.district) {
      return res.status(400).json({
        success: false,
        message: "Crop name, state, and district are required",
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    if (
      askingPricePerQuintal !== undefined &&
      (!Number.isFinite(askingPricePerQuintal) ||
        askingPricePerQuintal < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Asking price must be a non-negative number",
      });
    }

    // Authentication is not implemented yet.
    // Do not accept a farmer ID directly from an untrusted request.
    return res.status(501).json({
      success: false,
      message: "Crop creation will be enabled after authentication is implemented",
    });
  } catch (error) {
    console.error("Error creating crop listing:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create crop listing",
    });
  }
};


module.exports = {
  getAvailableCropListings,
  createCropListing,
};
