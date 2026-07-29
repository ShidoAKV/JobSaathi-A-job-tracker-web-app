const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");

// Get Logged-in User Profile
router.get("/profile", protect, getProfile);

// Update Profile
router.put("/profile", protect, updateProfile);

// Change Password
router.put("/password", protect, changePassword);

module.exports = router;