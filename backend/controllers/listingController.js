const asyncHandler = require("../utils/asyncHandler");
const JobListing = require("../models/JobListing");
const { invalidateListings } = require("../services/cacheService");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  if (typeof skills === "string") return skills.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const POSTED_BY_FIELDS = "_id name email";

// GET /api/listings?search=&location=&type=
const getListings = asyncHandler(async (req, res) => {
  const { search = "", location = "", type = "" } = req.query;
  const filter = {};

  if (search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ company: re }, { role: re }, { skills: re }];
  }
  if (location.trim()) filter.location = new RegExp(escapeRegex(location.trim()), "i");
  if (type.trim()) filter.type = type.trim();

  const listings = await JobListing.find(filter)
    .sort({ createdAt: -1 })
    .populate("postedBy", POSTED_BY_FIELDS);

  res.json(listings);
});

// GET /api/listings/mine
const getMyListings = asyncHandler(async (req, res) => {
  const listings = await JobListing.find({ postedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate("postedBy", POSTED_BY_FIELDS);
  res.json(listings);
});

// GET /api/listings/:id
const getListingById = asyncHandler(async (req, res) => {
  const listing = await JobListing.findById(req.params.id).populate("postedBy", POSTED_BY_FIELDS);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json(listing);
});

// POST /api/listings
const createListing = asyncHandler(async (req, res) => {
  const { company, role, location, salary, type, description, skills, applyLink, companyEmail } =
    req.body;

  const companyName = (company || "").trim() || (req.user.company || "").trim();

  if (!companyName || !role || !role.trim()) {
    return res.status(400).json({ message: "Company and Role are required" });
  }

  const listing = await JobListing.create({
    company: companyName,
    role: role.trim(),
    location: location || "",
    salary: salary || "",
    type: type || "Full-time",
    description: description || "",
    skills: normalizeSkills(skills),
    applyLink: applyLink || "",
    companyEmail: companyEmail || req.user.email || "",
    postedBy: req.user._id,
  });

  const populated = await listing.populate("postedBy", POSTED_BY_FIELDS);
  invalidateListings();
  res.status(201).json(populated);
});

// DELETE /api/listings/:id
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await JobListing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  const isOwner = listing.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "You can only delete your own listings" });
  }
  await listing.deleteOne();
  invalidateListings();
  res.json({ message: "Listing deleted successfully" });
});

module.exports = { getListings, getMyListings, getListingById, createListing, deleteListing };
