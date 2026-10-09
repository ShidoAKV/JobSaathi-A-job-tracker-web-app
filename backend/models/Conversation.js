const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "JobListing", required: true },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "A conversation must have exactly two participants",
      },
    },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
