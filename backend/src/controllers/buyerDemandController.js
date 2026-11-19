const mongoose = require("mongoose");
const BuyerDemand = require("../models/BuyerDemand");

const createBuyerDemand = async (req, res) => {
  try {
    const {
      cropName,
      quantity,
      quantityUnit,
      offeredPricePerQuintal,
      location,
      description,
      expiresAt,
    } = req.body;

    // Validate crop name
    if (
      typeof cropName !== "string" ||
      !cropName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      });
    }

    // Validate quantity
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

    // Validate quantity unit
    if (
      quantityUnit !== undefined &&
      !["kg", "quintal", "tonne"].includes(quantityUnit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity unit",
      });
    }

    // Validate offered price
    if (
      typeof offeredPricePerQuintal !== "number" ||
      !Number.isFinite(offeredPricePerQuintal) ||
      offeredPricePerQuintal < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Offered price must be a non-negative number",
      });
    }

    // Validate location
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

    // Validate optional description
    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string of at most 500 characters",
      });
    }

    // Validate optional expiry date
    if (expiresAt !== undefined) {
      if (
        typeof expiresAt !== "string" ||
        !Number.isFinite(Date.parse(expiresAt)) ||
        new Date(expiresAt) <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Expiry date must be a valid future date",
        });
      }
    }

    const demand = await BuyerDemand.create({
      buyer: req.user.userId,
      cropName: cropName.trim(),
      quantity,
      quantityUnit: quantityUnit || "quintal",
      offeredPricePerQuintal,
      location: {
        state: location.state.trim(),
        district: location.district.trim(),
      },
      ...(description !== undefined && {
        description: description.trim(),
      }),
      ...(expiresAt && {
        expiresAt: new Date(expiresAt),
      }),
    });

    return res.status(201).json({
      success: true,
      message: "Buyer demand created successfully",
      data: demand,
    });
  } catch (error) {
    console.error("Error creating buyer demand:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create buyer demand",
    });
  }
};


const getOpenBuyerDemands = async (req, res) => {
  try {
    const {
      cropName,
      state,
      district,
      quantityUnit,
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
      limitNumber < 1 ||
      limitNumber > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit. Limit must be between 1 and 50.",
      });
    }

    // Validate price filters
    if (
      (minPrice !== undefined &&
        (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be valid non-negative numbers.",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    // Validate quantity unit
    const allowedUnits = ["kg", "quintal", "tonne"];

    if (quantityUnit && !allowedUnits.includes(quantityUnit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity unit.",
      });
    }

    // Validate sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      price_low: { offeredPricePerQuintal: 1 },
      price_high: { offeredPricePerQuintal: -1 },
    };

    if (!sortOptions[sort]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option.",
      });
    }

    // Escape special regex characters in user input
    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = {
      status: "open",
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (cropName) {
      filter.cropName = {
        $regex: escapeRegex(cropName.trim()),
        $options: "i",
      };
    }

    if (state) {
      filter["location.state"] = {
        $regex: `^${escapeRegex(state.trim())}$`,
        $options: "i",
      };
    }

    if (district) {
      filter["location.district"] = {
        $regex: `^${escapeRegex(district.trim())}$`,
        $options: "i",
      };
    }

    if (quantityUnit) {
      filter.quantityUnit = quantityUnit;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.offeredPricePerQuintal = {};

      if (minPrice !== undefined) {
        filter.offeredPricePerQuintal.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.offeredPricePerQuintal.$lte = Number(maxPrice);
      }
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [demands, totalDemands] = await Promise.all([
      BuyerDemand.find(filter)
        .select(
          "cropName quantity quantityUnit offeredPricePerQuintal location.state location.district description expiresAt createdAt"
        )
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      BuyerDemand.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: demands.length,
      pagination: {
        total: totalDemands,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDemands / limitNumber),
      },
      data: demands,
    });
  } catch (error) {
    console.error("Get open buyer demands error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching buyer demands.",
    });
  }
};


const getMyBuyerDemands = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit value",
      });
    }

    const filter = {
      buyer: req.user.userId,
    };

    const skip = (page - 1) * limit;

    const [demands, total] = await Promise.all([
      BuyerDemand.find(filter)
        .select(
          "cropName quantity quantityUnit offeredPricePerQuintal location.state location.district description status expiresAt createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      BuyerDemand.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: demands.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: demands,
    });
  } catch (error) {
    console.error("Get my buyer demands error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your demands",
    });
  }
};

const getBuyerDemandById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demand ID",
      });
    }

    const demand = await BuyerDemand.findById(id)
      .select(
        "buyer cropName quantity quantityUnit offeredPricePerQuintal location.state location.district description status expiresAt createdAt updatedAt"
      )
      .lean();

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    // Check whether the logged-in user owns this demand
    const isOwner =
      req.user?.userId === demand.buyer.toString();

    // Non-owners can only view open, non-expired demands
    if (
      !isOwner &&
      (
        demand.status !== "open" ||
        (demand.expiresAt && new Date(demand.expiresAt) <= new Date())
      )
    ) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    // Never expose the buyer's internal user ID
    delete demand.buyer;

    return res.status(200).json({
      success: true,
      data: demand,
    });

  } catch (error) {
    console.error("Get buyer demand by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching buyer demand",
    });
  }
};


const updateBuyerDemand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demand ID",
      });
    }

    const allowedFields = [
      "cropName",
      "quantity",
      "quantityUnit",
      "offeredPricePerQuintal",
      "location",
      "description",
      "expiresAt",
    ];

    const updates = req.body;

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates) ||
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    // Reject fields that are not allowed to be updated
    const invalidFields = Object.keys(updates).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fields cannot be updated: ${invalidFields.join(", ")}`,
      });
    }

    const demand = await BuyerDemand.findOne({
      _id: id,
      buyer: req.user.userId,
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    if (demand.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open demands can be updated",
      });
    }

    // Validate crop name
    if ("cropName" in updates) {
      if (
        typeof updates.cropName !== "string" ||
        !updates.cropName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop name",
        });
      }

      demand.cropName = updates.cropName.trim();
    }

    // Validate quantity
    if ("quantity" in updates) {
      if (
        typeof updates.quantity !== "number" ||
        !Number.isFinite(updates.quantity) ||
        updates.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number",
        });
      }

      demand.quantity = updates.quantity;
    }

    // Validate quantity unit
    if ("quantityUnit" in updates) {
      const validUnits = ["kg", "quintal", "tonne"];

      if (!validUnits.includes(updates.quantityUnit)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity unit",
        });
      }

      demand.quantityUnit = updates.quantityUnit;
    }

    // Validate offered price
    if ("offeredPricePerQuintal" in updates) {
      if (
        typeof updates.offeredPricePerQuintal !== "number" ||
        !Number.isFinite(updates.offeredPricePerQuintal) ||
        updates.offeredPricePerQuintal < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Offered price must be a non-negative number",
        });
      }

      demand.offeredPricePerQuintal =
        updates.offeredPricePerQuintal;
    }

    // Validate location
    if ("location" in updates) {
      const location = updates.location;

      if (
        !location ||
        typeof location !== "object" ||
        Array.isArray(location) ||
        typeof location.state !== "string" ||
        !location.state.trim() ||
        typeof location.district !== "string" ||
        !location.district.trim() ||
        Object.keys(location).some(
          (key) => !["state", "district"].includes(key)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid state and district are required",
        });
      }

      demand.location = {
        state: location.state.trim(),
        district: location.district.trim(),
      };
    }

    // Validate description
    if ("description" in updates) {
      if (
        typeof updates.description !== "string" ||
        updates.description.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a string of at most 500 characters",
        });
      }

      demand.description = updates.description.trim();
    }

    // Validate expiry date
    if ("expiresAt" in updates) {
      if (updates.expiresAt === null) {
        demand.expiresAt = undefined;
      } else {
        const expiryDate = new Date(updates.expiresAt);

        if (
          typeof updates.expiresAt !== "string" ||
          !Number.isFinite(expiryDate.getTime()) ||
          expiryDate <= new Date()
        ) {
          return res.status(400).json({
            success: false,
            message: "Expiry date must be a valid future date",
          });
        }

        demand.expiresAt = expiryDate;
      }
    }

    await demand.save();

    return res.status(200).json({
      success: true,
      message: "Buyer demand updated successfully",
      data: {
        id: demand._id,
        cropName: demand.cropName,
        quantity: demand.quantity,
        quantityUnit: demand.quantityUnit,
        offeredPricePerQuintal: demand.offeredPricePerQuintal,
        location: demand.location,
        description: demand.description,
        status: demand.status,
        expiresAt: demand.expiresAt,
        updatedAt: demand.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update buyer demand error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid buyer demand data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating buyer demand",
    });
  }
};


const cancelBuyerDemand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demand ID",
      });
    }

    const demand = await BuyerDemand.findOne({
      _id: id,
      buyer: req.user.userId,
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    if (demand.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open demands can be cancelled",
      });
    }

    demand.status = "cancelled";

    await demand.save();

    return res.status(200).json({
      success: true,
      message: "Buyer demand cancelled successfully",
      data: {
        id: demand._id,
        cropName: demand.cropName,
        status: demand.status,
        updatedAt: demand.updatedAt,
      },
    });
  } catch (error) {
    console.error("Cancel buyer demand error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling buyer demand",
    });
  }
};


const fulfillBuyerDemand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demand ID",
      });
    }

    const demand = await BuyerDemand.findOne({
      _id: id,
      buyer: req.user.userId,
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Buyer demand not found",
      });
    }

    if (demand.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open demands can be marked as fulfilled",
      });
    }

    if (demand.expiresAt && demand.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expired demands cannot be marked as fulfilled",
      });
    }

    demand.status = "fulfilled";

    await demand.save();

    return res.status(200).json({
      success: true,
      message: "Buyer demand marked as fulfilled successfully",
      data: {
        id: demand._id,
        cropName: demand.cropName,
        status: demand.status,
        updatedAt: demand.updatedAt,
      },
    });
  } catch (error) {
    console.error("Fulfill buyer demand error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fulfilling buyer demand",
    });
  }
};


module.exports = {
  createBuyerDemand,
  getOpenBuyerDemands,
  getMyBuyerDemands,
  getBuyerDemandById,
  updateBuyerDemand,
  cancelBuyerDemand,
  fulfillBuyerDemand,
};
