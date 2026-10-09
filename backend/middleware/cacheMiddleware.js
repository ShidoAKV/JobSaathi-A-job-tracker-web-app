const cacheService = require("../services/cacheService");

/**
 * Caches successful (2xx) JSON responses of GET handlers.
 *   router.get("/", protect, cacheResponse((req) => `analytics:${req.user.id}`, 60), handler)
 * Pass `ttl` in seconds; omit to use the default TTL. Sets an `X-Cache: HIT|MISS` header.
 */
const cacheResponse = (keyFn, ttl) => (req, res, next) => {
  if (req.method !== "GET") return next();

  const key = keyFn(req);
  if (!key) return next();

  const hit = cacheService.get(key);
  if (hit !== undefined) {
    res.set("X-Cache", "HIT");
    return res.json(hit);
  }

  res.set("X-Cache", "MISS");
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheService.set(key, body, ttl);
    }
    return originalJson(body);
  };

  return next();
};

module.exports = { cacheResponse };
