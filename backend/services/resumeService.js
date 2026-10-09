const crypto = require("crypto");
const { PDFParse } = require("pdf-parse");
const { generateJson } = require("./geminiService");
const cacheService = require("./cacheService");

const CACHE_TTL = 60 * 60; // 1 hour
const MAX_BULLETS = 25;
const MAX_ROADMAP = 5;

const FLAGS = ["vague", "missing_metric", "weak_verb", "passive", "too_long", "duty_not_impact", "jargon"];
const EVIDENCE = ["supported", "needs_confirmation", "unsupported"];
const CLAIM_TYPES = ["technology", "metric", "responsibility"];

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const BULLET_START = /^\s*(?:[-•*·▪◦]|\d+[.)])\s+/;
const CONNECTOR_END = /\b(?:and|or|with|of|for|to|in|on|at|by|a|an|the|from|into|using|via|per|across|within|over|under|through|as|that|which|while|where)$/i;
const SENTENCE_END = /[.!?:;)\]"'”]$/;

/**
 * PDF extractors emit hard line breaks wherever the PDF wrapped text, which splits
 * sentences (and sometimes words) across lines. Re-join a line with the next one when
 * it clearly continues: no terminal punctuation and the next line starts lowercase,
 * or the line ends with a connector word. Headings and bullet starts are never merged.
 */
const PAGE_MARKER = /^\s*-{2,}\s*\d+\s+of\s+\d+\s*-{2,}\s*$/i;
const unbalancedParens = (s) => (s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length;

const repairWrappedLines = (text) => {
  const lines = text.split("\n").filter((l) => !PAGE_MARKER.test(l));
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i].replace(/\s+$/, "");
    const cur = current.trim();
    const prev = out[out.length - 1];
    const prevTrim = prev === undefined ? "" : prev.trim();

    const continuesPrev =
      prevTrim &&
      cur &&
      !BULLET_START.test(current) &&
      !SENTENCE_END.test(prevTrim) &&
      prevTrim.length > 25 &&
      (/^[a-z]/.test(cur) || CONNECTOR_END.test(prevTrim) || unbalancedParens(prevTrim));

    if (continuesPrev) {
      // A word split across lines ("Kafk" + "a.", "AWS (E" + "CS, …") leaves a short alphabetic
      // fragment at the start of the next line; glue those without a space.
      const lastWord = prevTrim.split(/\s+/).pop();
      const lowerFragment = /^[a-z]{1,3}(?=[\s,.;:)]|$)/.test(cur) && !/^(?:a|an|in|on|at|to|of|or|by|as|is|it)\b/.test(cur);
      const parenFragment = /\([A-Za-z]{0,3}$/.test(lastWord) && /^[A-Za-z]{1,3}(?=[\s,.;:)])/.test(cur);
      const glue = (lowerFragment && !CONNECTOR_END.test(prevTrim) && /[A-Za-z]$/.test(lastWord)) || parenFragment;
      const joiner = glue ? "" : " ";
      out[out.length - 1] = `${prev}${joiner}${cur}`;
    } else {
      out.push(current);
    }
  }
  return out.join("\n");
};

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return repairWrappedLines((result.text || "").replace(/\r\n?/g, "\n"));
  } finally {
    await parser.destroy();
  }
};

const normalize = (text = "") => text.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();

const textHash = (text = "", jobDescription = "") =>
  crypto.createHash("sha1").update(`${normalize(text)}\n---\n${normalize(jobDescription)}`).digest("hex");

/** Split into lines (1-based numbering is applied by callers via index + 1). */
const toNumberedLines = (text = "") => normalize(text).split("\n");

const renderNumbered = (lines) => lines.map((l, i) => `L${i + 1}: ${l}`).join("\n");

// ---------------------------------------------------------------------------
// Coercion helpers
// ---------------------------------------------------------------------------

const asString = (v) => (v === null || v === undefined ? "" : String(v)).trim();
const asStringArray = (v) => (Array.isArray(v) ? v.map(asString).filter(Boolean) : []);
const clampInt = (v, min, max, fallback = min) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// ---------------------------------------------------------------------------
// Match analysis (existing feature, now cached + validated)
// ---------------------------------------------------------------------------

const ANALYSIS_SYSTEM = `You are an expert technical recruiter and ATS resume reviewer. You return only valid JSON.`;

const buildAnalysisPrompt = (resumeText, jobDescription) => `
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

Return ONLY valid JSON with exactly this structure:
{
  "matchScore": 0,
  "summary": "",
  "matchedSkills": [],
  "missingKeywords": [],
  "strengths": [],
  "improvements": [
    { "section": "", "current": "", "suggested": "", "reason": "" }
  ]
}

Rules:
- matchScore must be an integer between 0 and 100.
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

const coerceAnalysis = (raw = {}) => ({
  matchScore: clampInt(raw.matchScore, 0, 100, 0),
  summary: asString(raw.summary),
  matchedSkills: asStringArray(raw.matchedSkills),
  missingKeywords: asStringArray(raw.missingKeywords),
  strengths: asStringArray(raw.strengths),
  improvements: (Array.isArray(raw.improvements) ? raw.improvements : [])
    .map((i) => ({
      section: asString(i && i.section),
      current: asString(i && i.current),
      suggested: asString(i && i.suggested),
      reason: asString(i && i.reason),
    }))
    .filter((i) => i.suggested || i.current),
  generatedAt: new Date().toISOString(),
});

const analyzeMatch = async (resumeText, jobDescription) => {
  const key = `resume:analysis:${textHash(resumeText, jobDescription)}`;
  return cacheService.wrap(key, CACHE_TTL, async () => {
    const raw = await generateJson(buildAnalysisPrompt(resumeText, jobDescription), {
      system: ANALYSIS_SYSTEM,
    });
    return coerceAnalysis(raw);
  });
};

// ---------------------------------------------------------------------------
// Proofread + evidence checker
// ---------------------------------------------------------------------------

const PROOFREAD_SYSTEM = `You are an expert resume editor AND a strict evidence checker. You return only valid JSON.

Your job: rewrite weak resume bullet points for clarity, impact and action-oriented language, WITHOUT inventing anything.

Hard rules:
- NEVER invent experience, employers, job titles, technologies, tools, certifications, metrics, team sizes, dates or responsibilities that are not already in the resume.
- When an improved bullet needs a number/metric that the resume does not provide, keep a placeholder in the suggested text in EXACTLY this form: [ADD: <what is needed>]  (example: "Cut p95 latency by [ADD: percentage] for [ADD: number] daily users"). Then set evidence.status to "needs_confirmation" and evidence.askFor to the question the candidate must answer.
- evidence.status "supported": every fact in "suggested" already appears in the resume.
- evidence.status "needs_confirmation": the rewrite needs a detail (metric, scale, timeframe) the candidate must confirm; suggested contains [ADD: ...] placeholders.
- evidence.status "unsupported": a stronger rewrite would require a claim the resume does not support; in that case "suggested" must STILL only use supported facts, and evidence.note must explain what you did not add and why.
- Only propose changes for bullet points or achievement/experience sentences. Skip headings, names, contact details, section titles, dates-only lines, education entries and skill lists.
- Reference lines by their exact number from the numbered resume (L12 -> "line": 12). Copy "original" verbatim from that line.
- flags vocabulary (use only these): "vague", "missing_metric", "weak_verb", "passive", "too_long", "duty_not_impact", "jargon".
- At most 25 bullets; prefer the most impactful improvements. Keep suggestions one sentence, starting with a strong past-tense action verb.`;

const buildProofreadPrompt = (lines, jobDescription) => `
Proofread this resume against the target job description.

Return ONLY valid JSON with exactly this structure:
{
  "bullets": [
    {
      "id": "b1",
      "line": 12,
      "section": "Experience",
      "original": "<verbatim line text>",
      "suggested": "<improved bullet, with [ADD: ...] placeholders where evidence is missing>",
      "reason": "<why this is better>",
      "flags": ["vague", "missing_metric"],
      "evidence": { "status": "supported" | "needs_confirmation" | "unsupported", "note": "<evidence assessment>", "askFor": "<question for the candidate, or empty string>" }
    }
  ],
  "unsupportedClaims": [
    { "text": "Kubernetes", "type": "technology" | "metric" | "responsibility", "note": "<why the resume does not evidence this>" }
  ],
  "summary": "<2-3 sentence overall assessment of the resume's strength and evidence quality>",
  "roadmap": [
    { "skill": "<gap to close>", "priority": 1, "why": "<why it matters for this job>", "steps": ["<step>", "<step>"], "estimatedWeeks": 2 }
  ]
}

Notes:
- "unsupportedClaims" lists things the JOB DESCRIPTION asks for that the resume does NOT evidence (technologies, metrics, responsibilities). The candidate must not add these without real experience.
- "roadmap" gives up to 5 learning priorities (priority 1 = most important) to close those gaps, each with 2-4 concrete steps.

RESUME (numbered lines):
${renderNumbered(lines)}

JOB DESCRIPTION:
${jobDescription}
`;

const coerceEvidence = (raw = {}, suggested = "") => {
  const hasPlaceholder = /\[ADD:/i.test(suggested);
  let status = asString(raw && raw.status).toLowerCase();
  if (!EVIDENCE.includes(status)) status = hasPlaceholder ? "needs_confirmation" : "supported";
  if (hasPlaceholder && status === "supported") status = "needs_confirmation";
  return {
    status,
    note: asString(raw && raw.note),
    askFor: asString(raw && raw.askFor),
  };
};

const coerceProofread = (raw = {}, lines = []) => {
  const seen = new Set();
  const bullets = [];

  (Array.isArray(raw.bullets) ? raw.bullets : []).forEach((b) => {
    if (!b) return;
    const line = clampInt(b.line, 0, Number.MAX_SAFE_INTEGER, 0);
    if (line < 1 || line > lines.length || seen.has(line)) return;
    const original = lines[line - 1];
    if (!original || !original.trim()) return;
    const suggested = asString(b.suggested);
    if (!suggested) return;
    seen.add(line);

    const flags = asStringArray(b.flags)
      .map((f) => f.toLowerCase().replace(/[\s-]+/g, "_"))
      .filter((f) => FLAGS.includes(f));

    bullets.push({
      id: "",
      line,
      section: asString(b.section) || "Experience",
      original: original.trim(),
      suggested,
      reason: asString(b.reason),
      flags: [...new Set(flags)],
      evidence: coerceEvidence(b.evidence, suggested),
    });
  });

  bullets.sort((a, b) => a.line - b.line);
  const capped = bullets.slice(0, MAX_BULLETS).map((b, i) => ({ ...b, id: `b${i + 1}` }));

  const unsupportedClaims = (Array.isArray(raw.unsupportedClaims) ? raw.unsupportedClaims : [])
    .map((c) => ({
      text: asString(c && c.text),
      type: CLAIM_TYPES.includes(asString(c && c.type).toLowerCase())
        ? asString(c.type).toLowerCase()
        : "technology",
      note: asString(c && c.note),
    }))
    .filter((c) => c.text);

  const roadmap = (Array.isArray(raw.roadmap) ? raw.roadmap : [])
    .map((r, i) => ({
      skill: asString(r && r.skill),
      priority: clampInt(r && r.priority, 1, 99, i + 1),
      why: asString(r && r.why),
      steps: asStringArray(r && r.steps),
      estimatedWeeks: clampInt(r && r.estimatedWeeks, 1, 52, 2),
    }))
    .filter((r) => r.skill)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_ROADMAP)
    .map((r, i) => ({ ...r, priority: i + 1 }));

  return {
    bullets: capped,
    unsupportedClaims,
    summary: asString(raw.summary),
    roadmap,
    lineCount: lines.length,
    generatedAt: new Date().toISOString(),
  };
};

const proofread = async (resumeText, jobDescription) => {
  const key = `resume:proofread:${textHash(resumeText, jobDescription)}`;
  return cacheService.wrap(key, CACHE_TTL, async () => {
    const lines = toNumberedLines(resumeText);
    const raw = await generateJson(buildProofreadPrompt(lines, jobDescription), {
      system: PROOFREAD_SYSTEM,
    });
    return coerceProofread(raw, lines);
  });
};

module.exports = {
  extractPdfText,
  textHash,
  toNumberedLines,
  renderNumbered,
  analyzeMatch,
  proofread,
  coerceAnalysis,
  coerceProofread,
  FLAGS,
  EVIDENCE,
  CLAIM_TYPES,
};
