const http = require("http");
const express = require("express");
const cors = require("cors");
const { env, printStartupSummary, isAllowedOrigin } = require("./config/env");
const { initSocket } = require("./services/socketService");

const connectDB = require("./config/db");
const { startNotificationCron } = require("./jobs/notificationCron");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");
const cacheService = require("./services/cacheService");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const listingRoutes = require("./routes/listingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server requests with no Origin header.
      if (isAllowedOrigin(origin)) return callback(null, true);
      const err = new Error(`CORS: origin ${origin} not allowed`);
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Job Tracker API Running...");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cache: cacheService.stats(),
  });
});

// Global rate limit for every API route (health is skipped inside the limiter).
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  printStartupSummary();
  startNotificationCron();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} (REST + Socket.IO)`);
  });
};

start();

module.exports = app;
