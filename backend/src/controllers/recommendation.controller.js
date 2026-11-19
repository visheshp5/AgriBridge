
const {
  recommendBestSellingOption,
} = require("../services/recommendation.service");

const getSellingRecommendation = (req, res) => {
  try {
    const { quantity, options } = req.body;

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number.",
      });
    }

    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one selling option is required.",
      });
    }

    const result = recommendBestSellingOption(
      quantity,
      options
    );

    return res.status(200).json({
      success: true,
      message: "Selling recommendation generated successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSellingRecommendation,
};
