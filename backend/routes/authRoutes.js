const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);

module.exports = router;