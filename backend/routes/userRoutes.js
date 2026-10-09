const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  requestRecruiter,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.post("/request-recruiter", protect, requestRecruiter);

module.exports = router;
