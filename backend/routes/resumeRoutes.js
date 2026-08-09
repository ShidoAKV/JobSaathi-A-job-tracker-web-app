const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

console.log(
  "Gemini key loaded:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription } = req.body;

if (!jobDescription || !jobDescription.trim()) {
  return res.status(400).json({
    message: "Job description is required",
  });
}
    
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF resume",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Only PDF files are allowed",
      });
    }

    // Extract PDF text
    const parser = new PDFParse({
      data: req.file.buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    const resumeText = result.text;

    if (!resumeText.trim()) {
      return res.status(400).json({
        message: "Could not extract text from resume",
      });
    }

    // Gemini prompt
     const prompt = `
You are an expert technical recruiter and ATS resume reviewer.

Analyze the candidate's resume specifically against the provided job description.

IMPORTANT RULES:

1. Do NOT completely rewrite the resume.
2. Do NOT invent skills, projects, experience, certifications, or achievements.
3. Only recommend changes that are supported by the existing resume.
4. Preserve the candidate's original experience and projects.
5. Focus on small, targeted improvements that improve ATS relevance.
6. If a job keyword is missing and the candidate has no evidence of that skill, mark it as a missing keyword instead of telling the candidate to falsely add it.
7. Suggestions must be practical and specific.
8. Compare the resume against THIS job description, not a generic software engineering job.

Return ONLY valid JSON.

Use exactly this structure:

{
  "matchScore": 0,
  "summary": "",
  "matchedSkills": [],
  "missingKeywords": [],
  "strengths": [],
  "improvements": [
    {
      "section": "",
      "current": "",
      "suggested": "",
      "reason": ""
    }
  ]
}

Rules:

- matchScore must be between 0 and 100.
- matchedSkills must contain skills present in both the resume and job description.
- missingKeywords must contain relevant job-description keywords that are not supported by the resume.
- improvements must contain only targeted improvements.
- suggested text must preserve the original meaning.
- Do not fabricate experience.
- Keep the response concise.

RESUME:

${resumeText}

JOB DESCRIPTION:

${jobDescription}
`;

    // Gemini AI
    const response = await ai.models.generateContent({
     model: "gemini-3.5-flash",
      contents: prompt,
    });

    const aiText = response.text;

    console.log("Gemini Response:", aiText);

    let analysis;

    try {
      analysis = JSON.parse(aiText);
    } catch (error) {
      console.error("Gemini JSON Error:", aiText);

      return res.status(500).json({
        message: "Gemini returned an invalid response",
      });
    }

    res.status(200).json({
      message: "Resume analyzed successfully",
      analysis,
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;