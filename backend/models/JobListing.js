const mongoose = require("mongoose");

const jobListingSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    salary: { type: String, default: "", trim: true },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract", "Remote"],
      default: "Full-time",
    },
    description: { type: String, default: "" },
    skills: { type: [String], default: [] },
    applyLink: { type: String, default: "", trim: true },
    companyEmail: { type: String, default: "", trim: true, lowercase: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobListingSchema.index({ createdAt: -1 });
jobListingSchema.index({ notified: 1, createdAt: 1 });

module.exports = mongoose.model("JobListing", jobListingSchema);
