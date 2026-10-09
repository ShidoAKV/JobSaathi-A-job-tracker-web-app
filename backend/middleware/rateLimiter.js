const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { env } = require("../config/env");

const windowMs = env.RATE_LIMIT_WINDOW_MIN * 60 * 1000;

const jsonHandler = (message) => (req, res, _next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  res.set("Retry-After", String(retryAfter));
  res.status(options.statusCode).json({
    message,
    retryAfterSeconds: retryAfter,
  });
};

// Key by authenticated user when available (fair per-account limits behind shared NATs), else IP.
const userOrIp = (req) => (req.user?._id ? `user:${req.user._id}` : `ip:${ipKeyGenerator(req.ip)}`);

/** Global ceiling for every /api route. */
const apiLimiter = rateLimit({
  windowMs,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  handler: jsonHandler("Too many requests. Please slow down and try again in a few minutes."),
});

/** Brute-force protection for login/signup (per IP). */
const authLimiter = rateLimit({
  windowMs,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count
  handler: jsonHandler("Too many login attempts. Please wait 15 minutes before trying again."),
});

/** Expensive Gemini-backed endpoints (chatbot + resume analysis), per user. */
const aiLimiter = rateLimit({
  windowMs,
  limit: env.AI_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIp,
  handler: jsonHandler("You've reached the AI usage limit for now. Please try again in a few minutes."),
});

/** Content creation (listings, messages via REST), per user. */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.WRITE_RATE_LIMIT_PER_MIN,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIp,
  handler: jsonHandler("You're doing that too often. Please wait a minute and try again."),
});

/**
 * Tiny token bucket for Socket.IO events (no HTTP request object to hand to express-rate-limit).
 * createSocketBucket(20, 10_000) allows 20 events per 10 seconds per socket.
 */
const createSocketBucket = (limit, intervalMs) => {
  let tokens = limit;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(limit, tokens + ((now - last) / intervalMs) * limit);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
};

module.exports = { apiLimiter, authLimiter, aiLimiter, writeLimiter, createSocketBucket };
