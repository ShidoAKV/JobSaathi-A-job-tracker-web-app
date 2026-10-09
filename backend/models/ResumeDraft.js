const mongoose = require("mongoose");

const MAX_VERSIONS = 20;

const versionSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Version" },
    text: { type: String, required: true },
    matchScore: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const resumeDraftSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled resume", trim: true },
    jobDescription: { type: String, default: "" },
    originalText: { type: String, required: true },
    currentText: { type: String, required: true },
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    originalAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    analysisTextHash: { type: String, default: "" },
    proofread: { type: mongoose.Schema.Types.Mixed, default: null },
    proofreadTextHash: { type: String, default: "" },
    versions: { type: [versionSchema], default: [] },
  },
  { timestamps: true }
);

resumeDraftSchema.index({ user: 1, updatedAt: -1 });

/** Push a version, keeping the first ("Original") entry and dropping the oldest others past the cap. */
resumeDraftSchema.methods.addVersion = function addVersion({ label, text, matchScore }) {
  this.versions.push({ label, text, matchScore: matchScore ?? null, createdAt: new Date() });
  while (this.versions.length > MAX_VERSIONS) {
    // Keep index 0 (Original); remove the oldest of the rest.
    this.versions.splice(1, 1);
  }
};

resumeDraftSchema.statics.MAX_VERSIONS = MAX_VERSIONS;

module.exports = mongoose.model("ResumeDraft", resumeDraftSchema);
