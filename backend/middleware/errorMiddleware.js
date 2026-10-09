const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : err.status || 500);

  if (err.name === "CastError") status = 400;
  if (err.name === "ValidationError") status = 400;
  if (err.message === "Gemini API key is not configured") status = 503;

  if (status === 503) console.error("Service unavailable:", err.message);
  else if (status >= 500) console.error("Unhandled error:", err);

  res.status(status).json({ message: err.message || "Server error" });
};

module.exports = { notFound, errorHandler };
