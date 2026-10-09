const Job = require("../models/Job");
const JobListing = require("../models/JobListing");
const gemini = require("./geminiService");
const cacheService = require("./cacheService");

const TOP_JOBS_TTL = 120; // seconds; also invalidated whenever a listing is created/deleted
const COMPANY_TTL = 6 * 60 * 60; // company profiles change rarely; keyed by listing ids too

const SYSTEM_PROMPT = `You are JobSaathi's career assistant, a friendly and concise helper inside a job-tracking web app.
Answer in Markdown. Keep replies under 180 words. Use short bullet points or numbered lists where helpful.
Never invent platform data: only use the JSON context you are given for anything about the user's applications or JobSaathi listings.`;

const STATS_RE =
  /\b(my (stats|statistics|progress|summary|applications|jobs|pipeline|interviews?|upcoming interviews?)|how am i doing|(show|see|get)( me)?( my)? stats|stats on the platform|upcoming interviews?|platform stats)\b/i;
const TOP_JOBS_RE = /\b(top|latest|new|recent|today'?s?)\b.*\bjobs?\b/i;
const JOBS_TODAY_RE = /\bjobs? (today|listed|available)\b/i;
// "…about Google as a company?" / "…about Google company" -> trailing filler removed first.
const COMPANY_SUFFIX_RE =
  /\s+(?:as\s+(?:a|an)\s+(?:company|employer|organi[sz]ation|brand)|the\s+company|company|employer|organi[sz]ation)\s*$/i;
const COMPANY_LEAD_RE =
  /\b(?:tell me about|about|details? (?:of|on|about)|info(?:rmation)? (?:on|about)|what is|what's|who is|who's|research)\s+(?:the\s+)?(?:company\s+)?([A-Za-z0-9&.\-' ]{2,60})$/i;
const COMPANY_TAIL_RE = /^([A-Za-z0-9&.\-' ]{2,60}?)\s+company[?.!]*$/i;

const extractCompany = (message) => {
  const original = message.trim();
  const cleaned = original.replace(/[?.!\s]+$/, "").replace(COMPANY_SUFFIX_RE, "").trim();

  const lead = cleaned.match(COMPANY_LEAD_RE);
  if (lead && lead[1]) return lead[1].trim().replace(/\s+/g, " ");

  const tail = original.match(COMPANY_TAIL_RE);
  if (tail && tail[1]) return tail[1].trim().replace(/\s+/g, " ");

  return null;
};

const detectIntent = (message) => {
  if (STATS_RE.test(message)) return { intent: "stats" };
  if (TOP_JOBS_RE.test(message) || JOBS_TODAY_RE.test(message)) return { intent: "top_jobs" };
  const company = extractCompany(message);
  if (company) return { intent: "company", company };
  return { intent: "general" };
};

const startOfTodayUtc = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const minimalListing = (l) => ({
  _id: l._id,
  company: l.company,
  role: l.role,
  location: l.location,
  salary: l.salary,
  type: l.type,
  skills: l.skills,
  createdAt: l.createdAt,
});

// ---------- data gathering ----------

const getUserStats = async (user) => {
  const jobs = await Job.find({ user: user._id }).lean();
  const now = new Date();
  const statusCount = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
  jobs.forEach((j) => {
    if (statusCount[j.status] !== undefined) statusCount[j.status] += 1;
  });

  const upcomingInterviews = jobs
    .filter((j) => j.status === "Interview" && j.interviewDate && new Date(j.interviewDate) >= now)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
    .slice(0, 5)
    .map((j) => ({ _id: j._id, company: j.company, role: j.role, interviewDate: j.interviewDate }));

  const recentApplications = [...jobs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((j) => ({ _id: j._id, company: j.company, role: j.role, status: j.status, createdAt: j.createdAt }));

  const total = jobs.length;
  const responseRate = total ? Math.round(((statusCount.Interview + statusCount.Offer) / total) * 100) : 0;

  const [totalListings, listingsToday] = await Promise.all([
    JobListing.countDocuments({}),
    JobListing.countDocuments({ createdAt: { $gte: startOfTodayUtc() } }),
  ]);

  return {
    name: user.name,
    totalJobs: total,
    statusCount,
    responseRate,
    upcomingInterviews,
    recentApplications,
    platform: { totalListings, listingsToday },
  };
};

const getTopJobs = async () => {
  const today = await JobListing.find({ createdAt: { $gte: startOfTodayUtc() } })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  let listings = today;
  if (listings.length < 10) {
    const ids = today.map((l) => l._id);
    const more = await JobListing.find({ _id: { $nin: ids } })
      .sort({ createdAt: -1 })
      .limit(10 - listings.length)
      .lean();
    listings = [...today, ...more];
  }
  return { listings: listings.map(minimalListing), fromToday: today.length };
};

const getCompanyListings = async (company) => {
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const listings = await JobListing.find({ company: new RegExp(escaped, "i") })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  return listings.map(minimalListing);
};

// ---------- deterministic fallbacks (no Gemini) ----------

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statsFallback = (s) => {
  const lines = [
    `**Your JobSaathi stats, ${s.name}**`,
    "",
    `- Total applications: **${s.totalJobs}**`,
    `- Applied: ${s.statusCount.Applied} · Interview: ${s.statusCount.Interview} · Offer: ${s.statusCount.Offer} · Rejected: ${s.statusCount.Rejected}`,
    `- Response rate (interviews + offers): **${s.responseRate}%**`,
  ];
  if (s.upcomingInterviews.length) {
    lines.push("", "**Upcoming interviews**");
    s.upcomingInterviews.forEach((i) => lines.push(`- ${i.company} — ${i.role} on ${fmtDate(i.interviewDate)}`));
  } else {
    lines.push("", "No upcoming interviews scheduled.");
  }
  lines.push("", `Platform: ${s.platform.totalListings} open listings, ${s.platform.listingsToday} posted today.`);
  return lines.join("\n");
};

const listingLine = (l, i) =>
  `${i + 1}. **${l.company}** — ${l.role}${l.location ? ` — ${l.location}` : ""}${l.salary ? ` — ${l.salary}` : ""} — ${l.type}`;

const topJobsFallback = ({ listings, fromToday }) => {
  if (!listings.length) return "There are no job listings on JobSaathi yet. Check back soon or post one yourself from the Jobs page.";
  const header =
    fromToday > 0
      ? `**Top ${listings.length} jobs** (${fromToday} posted today${fromToday < listings.length ? ", rest are the latest listings" : ""})`
      : `**Latest ${listings.length} jobs on JobSaathi** (none posted today yet)`;
  return [header, "", ...listings.map(listingLine)].join("\n");
};

const companyFallback = (company, listings) => {
  const lines = [`**${company}**`, "", "I can only show what's on the platform right now."];
  lines.push("", `On JobSaathi: **${listings.length}** open listing${listings.length === 1 ? "" : "s"}${listings.length ? ":" : "."}`);
  listings.forEach((l, i) => lines.push(listingLine(l, i)));
  return lines.join("\n");
};

const generalFallback = () =>
  "I can still show **my stats**, **top jobs today**, or listings for a company by name.";

// One-line reason why AI answers are not available (no key, suspended key, quota...).
const aiUnavailableNote = () => {
  const { configured, lastError } = gemini.getGeminiStatus();
  const reason = !configured ? "Gemini API key is not configured" : lastError || "Gemini request failed";
  return `_AI answers are unavailable: ${reason}._`;
};

const withNote = (text) => `${text}\n\n${aiUnavailableNote()}`;

// ---------- Gemini prompts ----------

const withGemini = async (prompt, fallback) => {
  if (!gemini.isConfigured()) return { reply: withNote(fallback()), ai: false };
  try {
    const reply = await gemini.generateText(prompt, { system: SYSTEM_PROMPT });
    if (reply) return { reply, ai: true };
    return { reply: withNote(fallback()), ai: false };
  } catch (_) {
    // geminiService already logged the (key-free) reason once.
    return { reply: withNote(fallback()), ai: false };
  }
};

const historyToText = (history) =>
  history
    .filter((h) => h && h.text)
    .map((h) => `${h.role === "model" ? "Assistant" : "User"}: ${h.text}`)
    .join("\n");

const answer = async ({ user, message, history = [] }) => {
  const detected = detectIntent(message);

  if (detected.intent === "stats") {
    const stats = await getUserStats(user);
    const prompt = `The user asked: "${message}".
Here is their JobSaathi data as JSON:
${JSON.stringify(stats)}

Give a concise, friendly Markdown summary with the key numbers (total applications, status breakdown, response rate, upcoming interviews) and one practical tip based on the numbers.`;
    const { reply } = await withGemini(prompt, () => statsFallback(stats));
    return { reply, intent: "stats", data: stats };
  }

  if (detected.intent === "top_jobs") {
    const data = await getTopJobs();
    const cacheKey = cacheService.KEYS.topJobs(startOfTodayUtc().toISOString().slice(0, 10));
    const cached = cacheService.get(cacheKey);
    if (cached) return { reply: cached, intent: "top_jobs", data, cached: true };
    const prompt = `The user asked: "${message}".
Here are the top JobSaathi listings as JSON (fromToday = how many were posted today; the rest are the latest listings):
${JSON.stringify(data)}

Reply with a one-line summary followed by a numbered Markdown list in the format: **Company** — Role — Location — Salary — Type. Only use listings from the JSON. If the list is empty say there are no listings yet.`;
    const { reply, ai } = await withGemini(prompt, () => topJobsFallback(data));
    if (ai) cacheService.set(cacheKey, reply, TOP_JOBS_TTL);
    return { reply, intent: "top_jobs", data };
  }

  if (detected.intent === "company") {
    const company = detected.company;
    const listings = await getCompanyListings(company);
    const companyKey = cacheService.KEYS.company(company, listings.map((l) => String(l._id)));
    const cachedCompany = cacheService.get(companyKey);
    if (cachedCompany) return { reply: cachedCompany, intent: "company", data: { company, listings }, cached: true };
    const prompt = `The user wants to know about the company "${company}".
Write a concise company profile from your own general knowledge: what they do, headquarters, approximate size/industry, typical roles they hire for, and 2 short interview tips. Clearly note that this is general knowledge and may be outdated. If you do not recognise the company, say so briefly and give generic research tips.
Then add a final section "On JobSaathi" using ONLY this JSON of platform listings for the company (${listings.length} found):
${JSON.stringify(listings)}
List them as "Role — Location — Salary — Type", or say there are no open listings on JobSaathi.`;
    const { reply, ai } = await withGemini(prompt, () => companyFallback(company, listings));
    if (ai) cacheService.set(companyKey, reply, COMPANY_TTL);
    return { reply, intent: "company", data: { company, listings } };
  }

  // general
  const stats = await getUserStats(user);
  const statsLine = `${stats.totalJobs} applications (${stats.statusCount.Applied} applied, ${stats.statusCount.Interview} interview, ${stats.statusCount.Offer} offer, ${stats.statusCount.Rejected} rejected), ${stats.platform.totalListings} listings on the platform.`;
  const prompt = `User name: ${user.name}. Their JobSaathi snapshot: ${statsLine}
${history.length ? `Conversation so far:\n${historyToText(history)}\n` : ""}
User: ${message}
Assistant:`;
  const { reply } = await withGemini(prompt, generalFallback);
  return { reply, intent: "general", data: null };
};

module.exports = { answer, detectIntent, extractCompany };
