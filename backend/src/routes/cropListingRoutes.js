
const express = require("express");
const router = express.Router();

const {
  getAvailableCropListings,
  createCropListing,
  getMyCropListings,
  updateCropListing,
  withdrawCropListing,
  markCropAsSold,
  getCropListingById,
} = require("../controllers/cropListingController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/", getAvailableCropListings);

router.post(
  "/",
  protect,
  authorize("farmer"),
  createCropListing
);

router.get(
  "/my-listings",
  protect,
  authorize("farmer"),
  getMyCropListings
);

router.patch(
  "/:id/sold",
  protect,
  authorize("farmer"),
  markCropAsSold
);

router.patch(
  "/:id/withdraw",
  protect,
  authorize("farmer"),
  withdrawCropListing
);

router.patch(
  "/:id",
  protect,
  authorize("farmer"),
  updateCropListing
);

router.get("/:id", getCropListingById);



module.exports = router;
