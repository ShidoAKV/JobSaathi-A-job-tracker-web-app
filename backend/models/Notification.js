const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["new_job", "system"], default: "new_job" },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "JobListing" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
