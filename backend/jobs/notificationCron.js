const cron = require("node-cron");
const { env } = require("../config/env");
const { notifyNewListings } = require("../services/notificationService");

let isRunning = false;

const runSafely = async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await notifyNewListings();
  } catch (err) {
    console.error("Notification cron failed:", err.message);
  } finally {
    isRunning = false;
  }
};

const startNotificationCron = () => {
  if (!cron.validate(env.NOTIFY_CRON)) {
    console.error(`Invalid NOTIFY_CRON "${env.NOTIFY_CRON}", notification cron not started`);
    return null;
  }
  const task = cron.schedule(env.NOTIFY_CRON, runSafely);
  console.log(`⏰ Notification cron scheduled (${env.NOTIFY_CRON})`);
  runSafely();
  return task;
};

module.exports = { startNotificationCron, runNotificationJobNow: runSafely };
