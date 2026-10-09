const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

// GET /api/user/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// PUT /api/user/profile  (role / recruiterRequest are never editable here)
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phone = req.body.phone || "";
  user.linkedin = req.body.linkedin || "";
  user.github = req.body.github || "";
  user.profileImage = req.body.profileImage || "";

  if (typeof req.body.company === "string" && ["recruiter", "admin"].includes(user.role)) {
    user.company = req.body.company.trim();
  }

  await user.save();

  const safe = user.toObject();
  delete safe.password;
  res.json(safe);
});

// PUT /api/user/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(400).json({ message: "Current password is incorrect" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully" });
});

// POST /api/user/request-recruiter  { company }
const requestRecruiter = asyncHandler(async (req, res) => {
  const company = (req.body.company || "").trim();
  if (!company) return res.status(400).json({ message: "Company name is required" });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (["recruiter", "admin"].includes(user.role)) {
    return res.status(400).json({ message: "You already have employer access" });
  }

  user.recruiterRequest = "pending";
  user.company = company;
  await user.save();

  res.json(user.toPublic());
});

module.exports = { getProfile, updateProfile, changePassword, requestRecruiter };
