const express = require("express");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { cacheResponse } = require("../middleware/cacheMiddleware");
const { KEYS } = require("../services/cacheService");
const {
  getStats,
  getUsers,
  updateUserRole,
  reviewRecruiterRequest,
  getAllListings,
  deleteListing,
  deleteUser,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", cacheResponse(() => KEYS.adminStats, 30), getStats);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/recruiter-request", reviewRecruiterRequest);
router.delete("/users/:id", deleteUser);
router.get("/listings", getAllListings);
router.delete("/listings/:id", deleteListing);

module.exports = router;
