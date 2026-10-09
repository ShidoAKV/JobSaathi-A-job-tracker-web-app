const dotenv = require("dotenv");
dotenv.config();

const parseList = (value) =>
  (value || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const clientUrls = parseList(process.env.CLIENT_URL || "http://localhost:5173");
const adminEmails = parseList(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase());

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5001,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  CLIENT_URLS: clientUrls,
  APP_URL: process.env.APP_URL || clientUrls[0] || "http://localhost:5173",
  ADMIN_EMAILS: adminEmails,
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  NOTIFY_CRON: process.env.NOTIFY_CRON || "*/2 * * * *",

  // Rate limiting (express-rate-limit)
  RATE_LIMIT_WINDOW_MIN: Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 300, // all /api requests per window per IP
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10, // failed login/signup attempts
  AI_RATE_LIMIT_MAX: Number(process.env.AI_RATE_LIMIT_MAX) || 30, // chatbot + resume per user
  WRITE_RATE_LIMIT_PER_MIN: Number(process.env.WRITE_RATE_LIMIT_PER_MIN) || 30, // posts/messages per minute

  // Caching (node-cache)
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS) || 60,
};

env.isGeminiConfigured = Boolean(env.GEMINI_API_KEY);
env.isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const isAdminEmail = (email) => Boolean(email) && adminEmails.includes(String(email).trim().toLowerCase());

/** Origins allowed for both Express CORS and Socket.IO. */
const allowedOrigins = new Set([...env.CLIENT_URLS, "http://localhost:5173"]);
const isAllowedOrigin = (origin) => !origin || allowedOrigins.has(origin);

const printStartupSummary = () => {
  console.log(
    `Config: Gemini ${env.isGeminiConfigured ? `ON (${env.GEMINI_MODEL})` : "OFF (no GEMINI_API_KEY)"} | SMTP ${
      env.isSmtpConfigured ? `ON (${env.SMTP_HOST})` : "OFF (emails skipped)"
    } | cron "${env.NOTIFY_CRON}" | origins ${env.CLIENT_URLS.join(", ")} | admins ${adminEmails.length}`
  );
  console.log(
    `Limits: ${env.RATE_LIMIT_MAX} req/${env.RATE_LIMIT_WINDOW_MIN}min per IP, auth ${env.AUTH_RATE_LIMIT_MAX} fails, AI ${env.AI_RATE_LIMIT_MAX}/user, writes ${env.WRITE_RATE_LIMIT_PER_MIN}/min | cache TTL ${env.CACHE_TTL_SECONDS}s`
  );
};

module.exports = { env, printStartupSummary, isAdminEmail, isAllowedOrigin };
