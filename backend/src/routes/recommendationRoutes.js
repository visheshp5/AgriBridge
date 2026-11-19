
const express = require("express");

const {
  getSellingRecommendation,
} = require("../controllers/recommendation.controller");

const router = express.Router();

// POST: Generate the best selling recommendation
router.post("/selling", getSellingRecommendation);

module.exports = router;
