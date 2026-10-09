const express = require("express");
const protect = require("../middleware/authMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");
const {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require("../controllers/conversationController");

const router = express.Router();

router.get("/", protect, getConversations);
router.post("/", protect, writeLimiter, startConversation);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, writeLimiter, sendMessage);

module.exports = router;
