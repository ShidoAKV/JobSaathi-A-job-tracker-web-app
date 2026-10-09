const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const ResumeDraft = require("../models/ResumeDraft");
const resumeService = require("../services/resumeService");

const JD_PREVIEW = 160;

const findOwnedDraft = async (req) =>
  ResumeDraft.findOne({ _id: req.params.id, user: req.user._id });

const titleFromFile = (file) => {
  const base = path.basename(file.originalname || "", path.extname(file.originalname || ""));
  return base.trim() || "Untitled resume";
};

// POST /api/resume/analyze  (multipart: resume PDF + jobDescription [+ title])
const analyzeResume = asyncHandler(async (req, res) => {
  const { jobDescription, title } = req.body;

  if (!jobDescription || !jobDescription.trim()) {
    return res.status(400).json({ message: "Job description is required" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF resume" });
  }
  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ message: "Only PDF files are allowed" });
  }

  const resumeText = await resumeService.extractPdfText(req.file.buffer);
  if (!resumeText.trim()) {
    return res.status(400).json({ message: "Could not extract text from resume" });
  }

  const jd = jobDescription.trim();
  const analysis = await resumeService.analyzeMatch(resumeText, jd);

  const draft = await ResumeDraft.create({
    user: req.user._id,
    title: (title && title.trim()) || titleFromFile(req.file),
    jobDescription: jd,
    originalText: resumeText,
    currentText: resumeText,
    analysis,
    originalAnalysis: analysis,
    analysisTextHash: resumeService.textHash(resumeText, jd),
    versions: [{ label: "Original", text: resumeText, matchScore: analysis.matchScore }],
  });

  res.status(200).json({
    message: "Resume analyzed successfully",
    draftId: draft._id,
    title: draft.title,
    resumeText,
    analysis,
  });
});

/** Shared "maybe update text, then run an AI step unless unchanged" logic. */
const runOnDraft = async (req, res, { hashField, resultField, run }) => {
  const draft = await findOwnedDraft(req);
  if (!draft) return res.status(404).json({ message: "Draft not found" });

  const { text } = req.body || {};
  if (typeof text === "string" && text.trim() && text !== draft.currentText) {
    draft.currentText = text;
  }

  const hash = resumeService.textHash(draft.currentText, draft.jobDescription);
  const cached = draft[hashField] === hash && Boolean(draft[resultField]);

  if (!cached) {
    draft[resultField] = await run(draft.currentText, draft.jobDescription);
    draft[hashField] = hash;
    draft.markModified(resultField);
  }

  await draft.save();
  return res.json({ [resultField]: draft[resultField], cached });
};

// POST /api/resume/drafts/:id/analyze  { text? }
const analyzeDraft = asyncHandler((req, res) =>
  runOnDraft(req, res, {
    hashField: "analysisTextHash",
    resultField: "analysis",
    run: resumeService.analyzeMatch,
  })
);

// POST /api/resume/drafts/:id/proofread  { text? }
const proofreadDraft = asyncHandler((req, res) =>
  runOnDraft(req, res, {
    hashField: "proofreadTextHash",
    resultField: "proofread",
    run: resumeService.proofread,
  })
);

// GET /api/resume/drafts
const listDrafts = asyncHandler(async (req, res) => {
  const drafts = await ResumeDraft.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(30)
    .select("title jobDescription createdAt updatedAt analysis.matchScore originalAnalysis.matchScore versions")
    .lean();

  res.json(
    drafts.map((d) => ({
      _id: d._id,
      title: d.title,
      jobDescription: (d.jobDescription || "").slice(0, JD_PREVIEW),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      matchScore: d.analysis && typeof d.analysis.matchScore === "number" ? d.analysis.matchScore : null,
      originalScore:
        d.originalAnalysis && typeof d.originalAnalysis.matchScore === "number"
          ? d.originalAnalysis.matchScore
          : null,
      versionsCount: Array.isArray(d.versions) ? d.versions.length : 0,
    }))
  );
});

// GET /api/resume/drafts/:id
const getDraft = asyncHandler(async (req, res) => {
  const draft = await findOwnedDraft(req);
  if (!draft) return res.status(404).json({ message: "Draft not found" });
  res.json(draft);
});

// PUT /api/resume/drafts/:id  { currentText?, jobDescription?, title?, saveVersion?, label? }
const updateDraft = asyncHandler(async (req, res) => {
  const draft = await findOwnedDraft(req);
  if (!draft) return res.status(404).json({ message: "Draft not found" });

  const { currentText, jobDescription, title, saveVersion, label } = req.body || {};

  if (typeof title === "string" && title.trim()) draft.title = title.trim();

  if (typeof currentText === "string") {
    if (!currentText.trim()) return res.status(400).json({ message: "Resume text cannot be empty" });
    draft.currentText = currentText;
  }

  if (typeof jobDescription === "string" && jobDescription.trim() !== draft.jobDescription) {
    draft.jobDescription = jobDescription.trim();
    draft.analysisTextHash = "";
    draft.proofreadTextHash = "";
  }

  if (saveVersion) {
    const matchScore =
      draft.analysis && typeof draft.analysis.matchScore === "number" ? draft.analysis.matchScore : null;
    draft.addVersion({
      label: (typeof label === "string" && label.trim()) || `Version ${draft.versions.length}`,
      text: draft.currentText,
      matchScore,
    });
  }

  await draft.save();
  res.json(draft);
});

// DELETE /api/resume/drafts/:id
const deleteDraft = asyncHandler(async (req, res) => {
  const draft = await findOwnedDraft(req);
  if (!draft) return res.status(404).json({ message: "Draft not found" });
  await draft.deleteOne();
  res.json({ message: "Draft deleted" });
});

module.exports = {
  analyzeResume,
  analyzeDraft,
  proofreadDraft,
  listDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
};
