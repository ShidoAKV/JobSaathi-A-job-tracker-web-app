const express = require("express");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");
const { cacheResponse } = require("../middleware/cacheMiddleware");
const { KEYS } = require("../services/cacheService");
const {
  getListings,
  getMyListings,
  getListingById,
  createListing,
  deleteListing,
} = require("../controllers/listingController");

const router = express.Router();

router.get("/", protect, cacheResponse((req) => KEYS.listings(req.query)), getListings);
router.get("/mine", protect, getMyListings);
router.post("/", protect, authorize("recruiter", "admin"), writeLimiter, createListing);
router.get("/:id", protect, getListingById);
router.delete("/:id", protect, deleteListing); // owner or admin (checked in controller)

module.exports = router;
