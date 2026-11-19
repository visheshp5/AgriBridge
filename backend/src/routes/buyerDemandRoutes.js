
const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/optionalAuthMiddleware");

const {
  createBuyerDemand,
  getOpenBuyerDemands,
  getMyBuyerDemands,
  getBuyerDemandById,
  updateBuyerDemand,
  cancelBuyerDemand,
  fulfillBuyerDemand,
} = require("../controllers/buyerDemandController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Create a buyer demand (buyer only)
router.post(
  "/",
  protect,
  authorize("buyer"),
  createBuyerDemand
);

router.get("/", getOpenBuyerDemands);

router.get(
  "/my-demands",
  protect,
  authorize("buyer"),
  getMyBuyerDemands
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("buyer"),
  cancelBuyerDemand
);

router.patch(
  "/:id/fulfill",
  protect,
  authorize("buyer"),
  fulfillBuyerDemand
);

router.patch("/:id", protect, authorize("buyer"), updateBuyerDemand);

router.get("/:id", optionalAuth, getBuyerDemandById);

module.exports = router;
