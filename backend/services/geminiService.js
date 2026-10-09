const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");

let client = null;
let lastError = null;
const loggedErrors = new Set();

const NOT_CONFIGURED = "Gemini API key is not configured";

const geminiError = (message) => {
  const err = new Error(message);
  err.statusCode = 503;
  return err;
};

const getClient = () => {
  if (!env.GEMINI_API_KEY) throw geminiError(NOT_CONFIGURED);
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
};

const isConfigured = () => Boolean(env.GEMINI_API_KEY);

const getGeminiStatus = () => ({ configured: isConfigured(), lastError });

/** Turn an SDK/HTTP error into a short, key-free human message. */
const describeError = (err) => {
  const raw = String((err && err.message) || err || "");
  const status = (err && (err.status || err.code)) || (raw.match(/"code":\s*(\d{3})/) || [])[1];
  const code = Number(status);

  if (/CONSUMER_SUSPENDED/i.test(raw)) return "Gemini API key belongs to a suspended Google project";
  if (/API_KEY_INVALID/i.test(raw) || [400, 401, 403].includes(code)) {
    return "Gemini rejected the API key (invalid or unauthorized)";
  }
  if (code === 429 || /RESOURCE_EXHAUSTED/i.test(raw)) return "Gemini quota exceeded, try again shortly";

  // Strip anything that looks like our key before trimming.
  const safe = raw.replace(env.GEMINI_API_KEY || "\u0000", "[redacted]");
  return safe.slice(0, 120) || "Gemini request failed";
};

const handleFailure = (err) => {
  lastError = describeError(err);
  if (!loggedErrors.has(lastError)) {
    loggedErrors.add(lastError);
    console.error(`Gemini error: ${lastError}`);
  }
  throw geminiError(lastError);
};

const buildRequest = (prompt, { system, json } = {}) => {
  const config = {};
  if (system) config.systemInstruction = system;
  if (json) config.responseMimeType = "application/json";
  return {
    model: env.GEMINI_MODEL,
    contents: prompt,
    ...(Object.keys(config).length ? { config } : {}),
  };
};

const generateText = async (prompt, { system } = {}) => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent(buildRequest(prompt, { system }));
    lastError = null;
    return (response.text || "").trim();
  } catch (err) {
    return handleFailure(err);
  }
};

// Strip ```json fences and pull out the first JSON object/array in the text.
const extractJson = (text) => {
  if (!text) throw new Error("Empty response from Gemini");
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = Math.min(...["{", "["].map((c) => cleaned.indexOf(c)).filter((i) => i >= 0));
    if (!Number.isFinite(start)) throw new Error("Gemini returned an invalid response");
    const open = cleaned[start];
    const close = open === "{" ? "}" : "]";
    const end = cleaned.lastIndexOf(close);
    if (end <= start) throw new Error("Gemini returned an invalid response");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const generateJson = async (prompt, { system } = {}) => {
  const ai = getClient();
  let text = "";
  try {
    const response = await ai.models.generateContent(buildRequest(prompt, { system, json: true }));
    lastError = null;
    text = response.text || "";
  } catch (err) {
    return handleFailure(err);
  }
  return extractJson(text);
};

module.exports = { generateText, generateJson, extractJson, isConfigured, getGeminiStatus };
