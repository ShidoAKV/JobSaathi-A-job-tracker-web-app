const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { cacheResponse } = require("../middleware/cacheMiddleware");
const { KEYS } = require("../services/cacheService");
const { getAnalytics } = require("../controllers/analyticsController");

// Per-user cache; invalidated whenever the user creates/updates/deletes a job.
router.get("/", protect, cacheResponse((req) => KEYS.analytics(req.user.id)), getAnalytics);

module.exports = router;