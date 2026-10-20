
const express = require("express");
const router = express.Router();

const {
  getAvailableCropListings,
  createCropListing,
} = require("../controllers/cropListingController");

router.get("/", getAvailableCropListings);
router.post("/", createCropListing);

module.exports = router;
