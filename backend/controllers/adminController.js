const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Job = require("../models/Job");
const JobListing = require("../models/JobListing");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { emitToUser } = require("../services/socketService");
const { invalidateListings, invalidateAdminStats } = require("../services/cacheService");

const USER_FIELDS = "_id name email role recruiterRequest company createdAt";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Delete listings and everything that hangs off them (conversations, messages, notifications). */
const purgeListings = async (listingIds) => {
  if (!listingIds.length) return;
  const conversations = await Conversation.find({ listing: { $in: listingIds } }).select("_id");
  const convIds = conversations.map((c) => c._id);
  await Promise.all([
    Message.deleteMany({ conversation: { $in: convIds } }),
    Conversation.deleteMany({ _id: { $in: convIds } }),
    Notification.deleteMany({ listing: { $in: listingIds } }),
    JobListing.deleteMany({ _id: { $in: listingIds } }),
  ]);
  invalidateListings();
};

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [users, candidates, recruiters, admins, pendingRequests, listings, conversations, messages] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "candidate" }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ recruiterRequest: "pending" }),
      JobListing.countDocuments({}),
      Conversation.countDocuments({}),
      Message.countDocuments({}),
    ]);

  res.json({ users, candidates, recruiters, admins, pendingRequests, listings, conversations, messages });
});

// GET /api/admin/users?search=&role=&request=
const getUsers = asyncHandler(async (req, res) => {
  const { search = "", role = "", request = "" } = req.query;
  const filter = {};

  if (search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  if (role.trim() && User.ROLES.includes(role.trim())) filter.role = role.trim();
  if (request.trim() && User.RECRUITER_REQUEST_STATES.includes(request.trim())) {
    filter.recruiterRequest = request.trim();
  }

  const users = await User.find(filter).select(USER_FIELDS).sort({ createdAt: -1 }).limit(200);
  res.json(users);
});

// PUT /api/admin/users/:id/role  { role }
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!User.ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${User.ROLES.join(", ")}` });
  }
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = role;
  if (role === "recruiter") user.recruiterRequest = "approved";
  if (role === "candidate") user.recruiterRequest = "none";
  await user.save();
  invalidateAdminStats();

  res.json(user.toPublic());
});

// PUT /api/admin/users/:id/recruiter-request  { action: "approve" | "reject" }
const reviewRecruiterRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: 'action must be "approve" or "reject"' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.recruiterRequest !== "pending") {
    return res.status(400).json({ message: "This user has no pending employer request" });
  }

  if (action === "approve") {
    user.role = "recruiter";
    user.recruiterRequest = "approved";
  } else {
    user.recruiterRequest = "rejected";
  }
  await user.save();
  invalidateAdminStats();

  const notification = await Notification.create({
    user: user._id,
    type: "system",
    title: action === "approve" ? "Employer access approved" : "Employer access request declined",
    message:
      action === "approve"
        ? `You can now post job listings${user.company ? ` for ${user.company}` : ""} from the Explore Jobs page.`
        : "An admin reviewed your employer access request and declined it. You can contact support or re-apply from Settings.",
  });

  try {
    emitToUser(user._id, "notification:new", notification.toObject());
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }

  res.json(user.toPublic());
});

// GET /api/admin/listings
const getAllListings = asyncHandler(async (req, res) => {
  const listings = await JobListing.find({})
    .sort({ createdAt: -1 })
    .populate("postedBy", "_id name email company");
  res.json(listings);
});

// DELETE /api/admin/listings/:id
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await JobListing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  await purgeListings([listing._id]);
  res.json({ message: "Listing and related conversations removed" });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const listings = await JobListing.find({ postedBy: user._id }).select("_id");
  await purgeListings(listings.map((l) => l._id));

  const conversations = await Conversation.find({ participants: user._id }).select("_id");
  const convIds = conversations.map((c) => c._id);

  await Promise.all([
    Message.deleteMany({ conversation: { $in: convIds } }),
    Conversation.deleteMany({ _id: { $in: convIds } }),
    Notification.deleteMany({ user: user._id }),
    Job.deleteMany({ user: user._id }),
  ]);
  await user.deleteOne();
  invalidateAdminStats();

  res.json({ message: "User and related data removed" });
});

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  reviewRecruiterRequest,
  getAllListings,
  deleteListing,
  deleteUser,
};
