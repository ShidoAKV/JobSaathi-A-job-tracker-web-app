const JobListing = require("../models/JobListing");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendMail, newJobEmailTemplate } = require("./emailService");
const { emitToUser } = require("./socketService");

const listingPayload = (l) => ({
  _id: l._id,
  company: l.company,
  role: l.role,
  location: l.location,
  salary: l.salary,
  type: l.type,
  createdAt: l.createdAt,
});

// Fan out in-app notifications + emails for every listing not yet announced.
const notifyNewListings = async () => {
  const pending = await JobListing.find({ notified: false }).sort({ createdAt: 1 });

  let listingsProcessed = 0;
  let notificationsCreated = 0;
  let emailsSent = 0;

  for (const listing of pending) {
    const users = await User.find({ _id: { $ne: listing.postedBy } }).select("_id name email");

    if (users.length) {
      const docs = users.map((u) => ({
        user: u._id,
        type: "new_job",
        title: `New job: ${listing.role} at ${listing.company}`,
        message: `${listing.company} is hiring for ${listing.role}${listing.location ? ` in ${listing.location}` : ""}.`,
        listing: listing._id,
      }));
      const inserted = await Notification.insertMany(docs, { ordered: false });
      notificationsCreated += inserted.length;

      try {
        const listingData = listingPayload(listing);
        inserted.forEach((n) => {
          emitToUser(n.user, "notification:new", { ...n.toObject(), listing: listingData });
        });
      } catch (err) {
        console.error("Socket notification emit failed:", err.message);
      }

      const results = await Promise.allSettled(
        users.map((u) => {
          const mail = newJobEmailTemplate({ name: u.name, listing });
          return sendMail({ to: u.email, ...mail });
        })
      );
      emailsSent += results.filter((r) => r.status === "fulfilled" && r.value === true).length;
      results
        .filter((r) => r.status === "rejected")
        .slice(0, 1)
        .forEach((r) => console.error("Email send failed:", r.reason?.message || r.reason));
    }

    listing.notified = true;
    await listing.save();
    listingsProcessed += 1;
  }

  if (listingsProcessed > 0) {
    console.log(
      `Notifications: ${listingsProcessed} listing(s) announced, ${notificationsCreated} notification(s) created, ${emailsSent} email(s) sent`
    );
  }

  return { listingsProcessed, notificationsCreated, emailsSent };
};

module.exports = { notifyNewListings };
