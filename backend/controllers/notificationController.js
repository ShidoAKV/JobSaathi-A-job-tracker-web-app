const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");
const { notifyNewListings } = require("../services/notificationService");

const LISTING_FIELDS = "_id company role location salary type createdAt";

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("listing", LISTING_FIELDS),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({ notifications, unreadCount });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: "All notifications marked as read" });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } },
    { returnDocument: "after" }
  ).populate("listing", LISTING_FIELDS);

  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json(notification);
});

// POST /api/notifications/run  (manual trigger of the cron job, for testing)
const runNotificationJob = asyncHandler(async (req, res) => {
  const result = await notifyNewListings();
  res.json(result);
});

module.exports = { getNotifications, markAllRead, markRead, runNotificationJob };
