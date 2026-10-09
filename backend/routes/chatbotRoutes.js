const express = require("express");
const protect = require("../middleware/authMiddleware");
const { ask, status } = require("../controllers/chatbotController");
const { aiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/ask", protect, aiLimiter, ask);
router.get("/status", protect, status);

module.exports = router;
