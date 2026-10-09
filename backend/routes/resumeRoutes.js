const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const { aiLimiter, writeLimiter } = require("../middleware/rateLimiter");
const {
  analyzeResume,
  analyzeDraft,
  proofreadDraft,
  listDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
} = require("../controllers/resumeController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Upload + first analysis (creates a draft)
router.post("/analyze", protect, aiLimiter, upload.single("resume"), analyzeResume);

// Drafts
router.get("/drafts", protect, listDrafts);
router.get("/drafts/:id", protect, getDraft);
router.put("/drafts/:id", protect, writeLimiter, updateDraft);
router.delete("/drafts/:id", protect, writeLimiter, deleteDraft);

// AI steps on a draft (skip Gemini when the text is unchanged)
router.post("/drafts/:id/analyze", protect, aiLimiter, analyzeDraft);
router.post("/drafts/:id/proofread", protect, aiLimiter, proofreadDraft);

module.exports = router;
