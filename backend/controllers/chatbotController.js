const asyncHandler = require("../utils/asyncHandler");
const { answer } = require("../services/chatbotService");
const { getGeminiStatus } = require("../services/geminiService");

// POST /api/chatbot/ask  { message, history? }
const ask = asyncHandler(async (req, res) => {
  const message = (req.body.message || "").trim();
  if (!message) return res.status(400).json({ message: "Message is required" });

  const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
  const result = await answer({ user: req.user, message, history });
  res.json(result);
});

// GET /api/chatbot/status
const status = asyncHandler(async (req, res) => {
  res.json({ ai: getGeminiStatus() });
});

module.exports = { ask, status };
