const NodeCache = require("node-cache");
const { env } = require("../config/env");

/**
 * In-process cache (node-cache). Used for read-heavy, rarely-changing responses:
 * public listings, per-user analytics, admin stats and chatbot answers that are
 * expensive to compute (Gemini calls). Writers call the invalidate helpers below.
 *
 * Note: this is per-instance memory. On Render's single web instance that is
 * exactly what we want; with multiple instances you'd swap this for Redis.
 */
const cache = new NodeCache({
  stdTTL: env.CACHE_TTL_SECONDS,
  checkperiod: Math.max(30, Math.floor(env.CACHE_TTL_SECONDS / 2)),
  useClones: false,
});

const KEYS = {
  listings: (query = {}) => `listings:${JSON.stringify(query)}`,
  analytics: (userId) => `analytics:${userId}`,
  adminStats: "admin:stats",
  topJobs: (day) => `chatbot:topjobs:${day}`,
  company: (name, listingIds) => `chatbot:company:${name.toLowerCase()}:${listingIds.join(",")}`,
};

const get = (key) => cache.get(key);
const set = (key, value, ttl) => cache.set(key, value, ttl);
const del = (key) => cache.del(key);

const delByPrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
  return keys.length;
};

/** Get-or-compute helper. */
const wrap = async (key, ttl, compute) => {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = await compute();
  if (value !== undefined) cache.set(key, value, ttl);
  return value;
};

// ---- Domain-level invalidation (call these from controllers after writes) ----
const invalidateListings = () => {
  delByPrefix("listings:");
  delByPrefix("chatbot:topjobs:");
  delByPrefix("chatbot:company:");
  cache.del(KEYS.adminStats);
};

const invalidateAnalytics = (userId) => {
  if (userId) cache.del(KEYS.analytics(userId.toString()));
};

const invalidateAdminStats = () => cache.del(KEYS.adminStats);

const stats = () => {
  const s = cache.getStats();
  return { keys: s.keys, hits: s.hits, misses: s.misses, ttlSeconds: env.CACHE_TTL_SECONDS };
};

const flush = () => cache.flushAll();

module.exports = {
  cache,
  KEYS,
  get,
  set,
  del,
  delByPrefix,
  wrap,
  invalidateListings,
  invalidateAnalytics,
  invalidateAdminStats,
  stats,
  flush,
};
