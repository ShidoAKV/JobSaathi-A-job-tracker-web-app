const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env, isAdminEmail } = require("../config/env");

/** Promote users listed in ADMIN_EMAILS the moment they sign up or log in. */
const ensureAdminRole = async (user) => {
  if (isAdminEmail(user.email) && user.role !== "admin") {
    user.role = "admin";
    user.recruiterRequest = "approved";
    await user.save();
  }
  return user;
};

const signup = async (req, res) => {
  try {
    const { name, email, password, accountType, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const wantsEmployer = accountType === "employer";

    let user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "candidate",
      recruiterRequest: wantsEmployer ? "pending" : "none",
      company: wantsEmployer ? (company || "").trim() : "",
    });

    user = await ensureAdminRole(user);

    res.status(201).json({
      message: wantsEmployer
        ? "Account created. Employer access is pending admin approval."
        : "User created successfully",
      user: user.toPublic(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password || "", user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user = await ensureAdminRole(user);

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: user.toPublic(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login };
