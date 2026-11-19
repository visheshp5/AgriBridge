const mongoose = require("mongoose");
const CropListing = require("../models/CropListing");

const getAvailableCropListings = async (req, res) => {
  try {
    const {
      cropName,
      state,
      district,
      condition,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    // Validate pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    // Restrict maximum results per request
    const safeLimit = Math.min(limitNumber, 50);

    // Validate sorting option
    const sortOptions = {
      newest: { createdAt: -1 },
      price_low: { askingPricePerQuintal: 1 },
      price_high: { askingPricePerQuintal: -1 },
    };

    if (!sortOptions[sort]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option",
      });
    }

    // Build the database filter
    const filter = { status: "available" };

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (cropName !== undefined) {
      if (typeof cropName !== "string" || !cropName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop name",
        });
      }

      filter.cropName = {
        $regex: escapeRegex(cropName.trim()),
        $options: "i",
      };
    }

    for (const [field, value] of [
      ["state", state],
      ["district", district],
    ]) {
      if (value !== undefined) {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}`,
          });
        }

        filter[`location.${field}`] = {
          $regex: escapeRegex(value.trim()),
          $options: "i",
        };
      }
    }

    if (condition !== undefined) {
      if (!["standard", "good", "premium"].includes(condition)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop condition",
        });
      }

      filter.condition = condition;
    }

    // Validate price filters
    const priceFilter = {};

    if (minPrice !== undefined) {
      if (minPrice.trim() === "" || !Number.isFinite(Number(minPrice)) || Number(minPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid minimum price",
        });
      }

      priceFilter.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      if (maxPrice.trim() === "" || !Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum price",
        });
      }

      priceFilter.$lte = Number(maxPrice);
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot exceed maximum price",
      });
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.askingPricePerQuintal = priceFilter;
    }

    const skip = (pageNumber - 1) * safeLimit;

    const [listings, total] = await Promise.all([
      CropListing.find(filter)
        .select(
          "cropName quantity quantityUnit condition askingPricePerQuintal location.state location.district createdAt"
        )
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      CropListing.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        page: pageNumber,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
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

    // Validate required fields
    if (
      !cropName ||
      typeof cropName !== "string" ||
      !location?.state ||
      !location?.district ||
      !quantity ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Crop name, quantity, state and district are required",
      });
    }

    if (
      askingPricePerQuintal !== undefined &&
      (Number(askingPricePerQuintal) < 0 ||
        !Number.isFinite(Number(askingPricePerQuintal)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid asking price",
      });
    }

    const listing = await CropListing.create({
      farmer: req.user.userId,
      cropName: cropName.trim(),
      quantity: Number(quantity),
      quantityUnit: quantityUnit || "quintal",
      condition: condition || "standard",
      askingPricePerQuintal:
        askingPricePerQuintal === undefined
          ? undefined
          : Number(askingPricePerQuintal),
      location: {
        state: location.state.trim(),
        district: location.district.trim(),
        village: location.village?.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Crop listing created successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Create crop listing error:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create crop listing",
    });
  }
};

const getMyCropListings = async (req, res) => {
  try {
    const listings = await CropListing.find({
      farmer: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    console.error("Fetch my listings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your crop listings",
    });
  }
};



const updateCropListing = async (req, res) => {
  try {
    const {
      cropName,
      quantity,
      quantityUnit,
      condition,
      askingPricePerQuintal,
      location,
    } = req.body;

    const updates = {};

    // Validate crop name
    if (cropName !== undefined) {
      if (typeof cropName !== "string" || !cropName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop name",
        });
      }
      updates.cropName = cropName.trim();
    }

    // Validate quantity
    if (quantity !== undefined) {
      if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number",
        });
      }
      updates.quantity = quantity;
    }

    // Validate quantity unit
    if (quantityUnit !== undefined) {
      if (!["kg", "quintal", "tonne"].includes(quantityUnit)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity unit",
        });
      }
      updates.quantityUnit = quantityUnit;
    }

    // Validate crop condition
    if (condition !== undefined) {
      if (!["standard", "good", "premium"].includes(condition)) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop condition",
        });
      }
      updates.condition = condition;
    }

    // Validate asking price
    if (askingPricePerQuintal !== undefined) {
      if (
        typeof askingPricePerQuintal !== "number" ||
        !Number.isFinite(askingPricePerQuintal) ||
        askingPricePerQuintal < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid asking price",
        });
      }
      updates.askingPricePerQuintal = askingPricePerQuintal;
    }

    // Validate location
    if (location !== undefined) {
      if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location) ||
        typeof location.state !== "string" ||
        !location.state.trim() ||
        typeof location.district !== "string" ||
        !location.district.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid state and district are required",
        });
      }

      updates.location = {
        state: location.state.trim(),
        district: location.district.trim(),
        ...(typeof location.village === "string" && {
          village: location.village.trim(),
        }),
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const listing = await CropListing.findOne({
      _id: req.params.id,
      farmer: req.user.userId,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    if (!["available", "negotiating"].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: "This listing can no longer be edited",
      });
    }

    Object.assign(listing, updates);
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Crop listing updated successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Update crop listing error:", error.message);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update crop listing",
    });
  }
};


const withdrawCropListing = async (req, res) => {
  try {
    const listing = await CropListing.findOne({
      _id: req.params.id,
      farmer: req.user.userId,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    if (listing.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Only available listings can be withdrawn",
      });
    }

    listing.status = "withdrawn";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Crop listing withdrawn successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Withdraw crop listing error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid crop listing ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to withdraw crop listing",
    });
  }
};


const markCropAsSold = async (req, res) => {
  try {
    const { sellingPricePerQuintal, saleDate } = req.body;

    // Validate optional selling price
    if (
      sellingPricePerQuintal !== undefined &&
      (
        typeof sellingPricePerQuintal !== "number" ||
        !Number.isFinite(sellingPricePerQuintal) ||
        sellingPricePerQuintal < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be a valid non-negative number",
      });
    }

    // Validate optional sale date
    if (
      saleDate !== undefined &&
      (
        typeof saleDate !== "string" ||
        !Number.isFinite(Date.parse(saleDate))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid sale date",
      });
    }

    const listing = await CropListing.findOne({
      _id: req.params.id,
      farmer: req.user.userId,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    if (!["available", "negotiating"].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: "This listing cannot be marked as sold",
      });
    }

    listing.status = "sold";
    listing.saleDetails = {
      saleChannel: "offline",
      ...(sellingPricePerQuintal !== undefined && {
        sellingPricePerQuintal,
      }),
      saleDate: saleDate ? new Date(saleDate) : new Date(),
    };

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Crop marked as sold successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Mark crop as sold error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid crop listing ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark crop as sold",
    });
  }
};


const getCropListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid crop listing ID",
      });
    }

    const listing = await CropListing.findOne({
      _id: id,
      status: "available",
    })
      .select(
        "cropName quantity quantityUnit condition askingPricePerQuintal location.state location.district createdAt"
      )
      .lean();

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found or no longer available",
      });
    }

    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Error fetching crop listing:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch crop listing",
    });
  }
};



module.exports = {
  getAvailableCropListings,
  createCropListing,
  getMyCropListings,
  updateCropListing,
  withdrawCropListing,
  markCropAsSold,
  getCropListingById,
};

