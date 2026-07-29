const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

router.get("/", protect, getJobs);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

module.exports = router;