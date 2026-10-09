/**
 * Instant, deterministic resume insights computed in the browser on every edit.
 * Complements (does not replace) the Gemini analysis, which is rate-limited.
 */

const STOPWORDS = new Set(
  `a an and are as at be by for from has have in is it its of on or that the to was were will with you your we our this these those their they them can into over under about across after before during while than then also more most such very just not no yes any all each per via etc able team teams work working role roles job jobs candidate candidates experience experiences year years strong good great new using use used build built develop developed developing development design designed designing ensure ensuring including include includes required requirements requirement responsible responsibilities skills skill knowledge ability must should plus preferred nice bonus degree bachelor master related equivalent company companies product products customer customers business businesses looking join hiring hire`.split(
    /\s+/
  )
);

const ACTION_VERBS = new Set(
  `led built designed developed implemented launched shipped delivered architected migrated optimized optimised reduced increased improved automated scaled created owned drove managed mentored coached introduced established cut accelerated streamlined refactored deployed integrated engineered spearheaded championed negotiated grew generated achieved won secured transformed modernized modernised revamped consolidated partnered collaborated analyzed analysed researched presented published authored taught trained hired recruited resolved debugged diagnosed monitored measured tested validated standardized standardised documented defined prioritized prioritised planned coordinated orchestrated enabled unlocked boosted doubled tripled halved eliminated`.split(
    /\s+/
  )
);

const VAGUE_PHRASES = [
  "significantly",
  "various",
  "several",
  "many",
  "responsible for",
  "helped",
  "worked on",
  "assisted",
  "involved in",
  "participated in",
  "some",
  "a lot",
  "numerous",
  "effectively",
  "efficiently",
  "successfully",
  "etc",
  "hard-working",
  "team player",
  "results-driven",
  "detail-oriented",
];

export const BULLET_RE = /^\s*(?:[-•*·▪◦]|\d+[.)])\s+/;
export const PLACEHOLDER_RE = /\[ADD:[^\]]*\]/g;
const METRIC_RE = /(\d+(?:[.,]\d+)?\s*(?:%|percent|x|k|m|lpa|ms|s|sec|hrs?|hours?|days?|weeks?|months?|users?|customers?|requests?|events?|transactions?|crore|lakh|million|billion|\$|₹|€|£)|\b\d{2,}\b)/i;

export const isBulletLine = (line) => BULLET_RE.test(line);

export const isHeadingLine = (line) => {
  const t = line.trim();
  if (!t || t.length > 40 || isBulletLine(t)) return false;
  if (/[.:;,]$/.test(t) && !/:$/.test(t)) return false;
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;
  const upperRatio = letters.replace(/[^A-Z]/g, "").length / letters.length;
  return upperRatio > 0.8 || /^(summary|experience|education|skills|projects|certifications?|achievements?|awards?|publications?|interests|languages|work experience|professional experience|technical skills)\b/i.test(t);
};

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\- ]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

/** Pull likely keywords/skills out of a job description. */
export const extractKeywords = (jobDescription, limit = 30) => {
  if (!jobDescription?.trim()) return [];
  const freq = new Map();

  // Multi-word capitalised phrases ("Machine Learning", "System Design") and common tech bigrams.
  const phrases = jobDescription.match(/\b(?:[A-Z][a-zA-Z+#.]*\s){1,2}[A-Z][a-zA-Z+#.]*\b/g) || [];
  phrases.forEach((p) => {
    const key = p.toLowerCase();
    if (key.split(" ").every((w) => !STOPWORDS.has(w))) freq.set(key, (freq.get(key) || 0) + 2);
  });

  tokenize(jobDescription).forEach((t) => freq.set(t, (freq.get(t) || 0) + 1));

  // Prefer tech-looking tokens (contain digits/symbols or are in capitalised form in the JD).
  const capitalised = new Set((jobDescription.match(/\b[A-Z][a-zA-Z0-9+#.]{1,}\b/g) || []).map((w) => w.toLowerCase()));

  return [...freq.entries()]
    .map(([word, count]) => ({
      word,
      score: count + (capitalised.has(word) ? 2 : 0) + (/[+#.\d]/.test(word) ? 2 : 0) + (word.includes(" ") ? 1 : 0),
    }))
    .filter((k) => k.word.length >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((k) => k.word);
};

const containsKeyword = (haystack, keyword) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(haystack);
};

export const analyzeLocally = (text, jobDescription) => {
  const lines = (text || "").split("\n");
  const nonEmpty = lines.filter((l) => l.trim());
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const bullets = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isBulletLine(line) || (line.trim().length > 60 && !isHeadingLine(line)));

  const withMetrics = bullets.filter(({ line }) => METRIC_RE.test(line));
  const withActionVerb = bullets.filter(({ line }) => {
    const first = line.replace(BULLET_RE, "").trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    return first && ACTION_VERBS.has(first);
  });

  const vague = [];
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    VAGUE_PHRASES.forEach((phrase) => {
      if (lower.includes(phrase)) vague.push({ line: index + 1, phrase });
    });
  });

  const placeholders = (text.match(PLACEHOLDER_RE) || []).length;

  const keywords = extractKeywords(jobDescription);
  const lower = (text || "").toLowerCase();
  const covered = keywords.filter((k) => containsKeyword(lower, k));
  const missing = keywords.filter((k) => !covered.includes(k));

  const longBullets = bullets.filter(({ line }) => line.trim().split(/\s+/).length > 32).length;

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

  // A simple 0-100 "strength" heuristic for the live meter (clearly labelled as a heuristic in the UI).
  const strength = Math.round(
    0.4 * pct(covered.length, keywords.length || 1) +
      0.25 * pct(withMetrics.length, bullets.length || 1) +
      0.2 * pct(withActionVerb.length, bullets.length || 1) +
      0.15 * Math.max(0, 100 - vague.length * 10 - placeholders * 15)
  );

  return {
    wordCount: words.length,
    lineCount: nonEmpty.length,
    bulletCount: bullets.length,
    metricsPct: pct(withMetrics.length, bullets.length),
    actionVerbPct: pct(withActionVerb.length, bullets.length),
    longBullets,
    vague,
    placeholders,
    keywords,
    covered,
    missing,
    coveragePct: pct(covered.length, keywords.length),
    strength: Math.max(0, Math.min(100, strength)),
  };
};
