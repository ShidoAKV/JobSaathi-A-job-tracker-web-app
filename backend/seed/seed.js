/* Seeds demo "company" users and public job listings.
   Usage: npm run seed   (idempotent: re-running skips existing users/listings) */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { env } = require("../config/env");
const User = require("../models/User");
const JobListing = require("../models/JobListing");

const COMPANY_PASSWORD = "Company@123";

const companies = [
  { name: "Google Careers", company: "Google", email: "careers@google.demo", site: "https://careers.google.com" },
  { name: "Microsoft Talent", company: "Microsoft", email: "talent@microsoft.demo", site: "https://careers.microsoft.com" },
  { name: "Amazon Hiring", company: "Amazon", email: "hiring@amazon.demo", site: "https://www.amazon.jobs" },
  { name: "Razorpay People", company: "Razorpay", email: "people@razorpay.demo", site: "https://razorpay.com/jobs" },
  { name: "Zomato Talent", company: "Zomato", email: "talent@zomato.demo", site: "https://www.zomato.com/careers" },
  { name: "Flipkart Careers", company: "Flipkart", email: "careers@flipkart.demo", site: "https://www.flipkartcareers.com" },
];

const listings = [
  // Google
  { company: "Google", poster: "careers@google.demo", role: "Software Engineer II, Backend", location: "Bengaluru, India", salary: "28-40 LPA", type: "Full-time", skills: ["Go", "Java", "Distributed Systems", "gRPC", "Kubernetes"], description: "Build and scale backend services that power Google Search and Ads infrastructure. You will design APIs, own reliability for high-QPS systems, and collaborate with SRE teams across regions." },
  { company: "Google", poster: "careers@google.demo", role: "Frontend Engineer, Workspace", location: "Hyderabad, India", salary: "24-34 LPA", type: "Full-time", skills: ["TypeScript", "Angular", "Web Performance", "Accessibility"], description: "Ship delightful, accessible UI for Google Workspace apps used by billions. Work closely with UX and product on performance budgets and design systems." },
  { company: "Google", poster: "careers@google.demo", role: "Software Engineering Intern, Summer 2027", location: "Remote (India)", salary: "1.2 L/month stipend", type: "Internship", skills: ["C++", "Python", "Data Structures", "Algorithms"], description: "12-week internship working on a real product team with a dedicated host. Strong fundamentals in data structures and algorithms are required." },
  // Microsoft
  { company: "Microsoft", poster: "talent@microsoft.demo", role: "Software Engineer, Azure Core", location: "Noida, India", salary: "22-32 LPA", type: "Full-time", skills: ["C#", ".NET", "Azure", "Microservices", "SQL"], description: "Join the Azure Core team to build control-plane services that provision compute at planetary scale. You will own features end-to-end from design to live-site." },
  { company: "Microsoft", poster: "talent@microsoft.demo", role: "Data Scientist, Copilot", location: "Hyderabad, India", salary: "26-38 LPA", type: "Full-time", skills: ["Python", "PyTorch", "LLMs", "Experimentation", "SQL"], description: "Measure and improve Copilot quality with offline evals and online A/B experiments. Partner with applied scientists on retrieval and ranking models." },
  // Amazon
  { company: "Amazon", poster: "hiring@amazon.demo", role: "SDE I", location: "Bengaluru, India", salary: "18-26 LPA", type: "Full-time", skills: ["Java", "AWS", "DynamoDB", "System Design"], description: "Deliver customer-facing features for Amazon.in retail. You will work in a two-pizza team with full ownership of services and on-call rotation." },
  { company: "Amazon", poster: "hiring@amazon.demo", role: "SDE II, Alexa AI", location: "Chennai, India", salary: "30-45 LPA", type: "Full-time", skills: ["Python", "Java", "ML Infrastructure", "Spark", "AWS"], description: "Build the training and inference platforms behind Alexa's conversational models. Experience with large-scale data pipelines is a plus." },
  { company: "Amazon", poster: "hiring@amazon.demo", role: "Cloud Support Engineer", location: "Remote (India)", salary: "10-15 LPA", type: "Remote", skills: ["Linux", "Networking", "AWS", "Troubleshooting"], description: "Help AWS customers resolve complex technical issues across EC2, VPC and S3. Strong communication and debugging skills required." },
  // Razorpay
  { company: "Razorpay", poster: "people@razorpay.demo", role: "Backend Engineer, Payments", location: "Bengaluru, India", salary: "20-30 LPA", type: "Full-time", skills: ["Go", "PHP", "MySQL", "Kafka", "Redis"], description: "Own the core payment gateway services processing millions of transactions daily. You will work on idempotency, reconciliation and latency-critical flows." },
  { company: "Razorpay", poster: "people@razorpay.demo", role: "Product Designer", location: "Bengaluru, India (Hybrid)", salary: "16-24 LPA", type: "Full-time", skills: ["Figma", "Design Systems", "User Research", "Prototyping"], description: "Design merchant-facing dashboards and checkout experiences. Partner with PMs and engineers from discovery to ship." },
  { company: "Razorpay", poster: "people@razorpay.demo", role: "SRE Contractor", location: "Remote (India)", salary: "1.5-2 L/month", type: "Contract", skills: ["Kubernetes", "Terraform", "Prometheus", "AWS"], description: "6-month contract to harden observability and incident tooling for payments infrastructure." },
  // Zomato
  { company: "Zomato", poster: "talent@zomato.demo", role: "Android Engineer", location: "Gurugram, India", salary: "18-28 LPA", type: "Full-time", skills: ["Kotlin", "Jetpack Compose", "Coroutines", "MVVM"], description: "Build the consumer Android app used by millions of food lovers every day. Focus on performance, animations and offline-first flows." },
  { company: "Zomato", poster: "talent@zomato.demo", role: "Data Analyst, Growth", location: "Gurugram, India", salary: "12-18 LPA", type: "Full-time", skills: ["SQL", "Python", "Tableau", "A/B Testing"], description: "Turn delivery and ordering data into growth insights for city teams. Build dashboards and run experiments with product managers." },
  // Flipkart
  { company: "Flipkart", poster: "careers@flipkart.demo", role: "SDE II, Search & Discovery", location: "Bengaluru, India", salary: "28-40 LPA", type: "Full-time", skills: ["Java", "Elasticsearch", "Kafka", "Microservices"], description: "Improve search relevance and discovery for India's largest e-commerce catalogue. Work on ranking services handling peak Big Billion Days traffic." },
  { company: "Flipkart", poster: "careers@flipkart.demo", role: "Frontend Engineer, Part-time", location: "Remote (India)", salary: "60-80 K/month", type: "Part-time", skills: ["React", "TypeScript", "Next.js", "Testing"], description: "Part-time role (20 hrs/week) building internal seller tools in React. Ideal for experienced engineers looking for flexible hours." },
  { company: "Flipkart", poster: "careers@flipkart.demo", role: "Machine Learning Engineer", location: "Bengaluru, India", salary: "30-45 LPA", type: "Full-time", skills: ["Python", "TensorFlow", "Recommendation Systems", "Spark"], description: "Build recommendation and personalisation models that power the Flipkart home feed. Deploy models at scale with the ML platform team." },
];

const run = async () => {
  if (!env.MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB");

  const hashed = await bcrypt.hash(COMPANY_PASSWORD, 10);
  const userByEmail = {};
  let usersCreated = 0;
  let usersUpdated = 0;

  for (const c of companies) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        name: c.name,
        email: c.email,
        password: hashed,
        role: "recruiter",
        recruiterRequest: "approved",
        company: c.company,
      });
      usersCreated += 1;
    } else if (user.role !== "recruiter" || user.recruiterRequest !== "approved" || user.company !== c.company) {
      user.role = user.role === "admin" ? "admin" : "recruiter";
      user.recruiterRequest = "approved";
      user.company = c.company;
      await user.save();
      usersUpdated += 1;
    }
    userByEmail[c.email] = { user, site: c.site };
  }

  let listingsCreated = 0;
  let listingsSkipped = 0;

  for (const l of listings) {
    const { user, site } = userByEmail[l.poster];
    const exists = await JobListing.findOne({ company: l.company, role: l.role });
    if (exists) {
      listingsSkipped += 1;
      continue;
    }
    await JobListing.create({
      company: l.company,
      role: l.role,
      location: l.location,
      salary: l.salary,
      type: l.type,
      skills: l.skills,
      description: l.description,
      applyLink: site,
      companyEmail: user.email,
      postedBy: user._id,
      notified: false,
    });
    listingsCreated += 1;
  }

  console.log("\nSeed summary");
  console.log(
    `  company users created: ${usersCreated} (${companies.length - usersCreated} already existed, ${usersUpdated} updated to recruiter role)`
  );
  console.log(`  listings created:      ${listingsCreated} (${listingsSkipped} skipped, already existed)`);
  console.log("\nDemo company logins (password for all: " + COMPANY_PASSWORD + ")");
  companies.forEach((c) => console.log(`  ${c.name.padEnd(18)} ${c.email}`));
  console.log("\nNew listings are announced to all users by the notification cron (or POST /api/notifications/run).");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
