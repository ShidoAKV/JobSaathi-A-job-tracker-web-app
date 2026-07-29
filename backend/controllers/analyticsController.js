const Job = require("../models/Job");

const getAnalytics = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id });

    // =======================
    // Recent Activity
    // =======================
    const recentActivities = jobs
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((job) => ({
        id: job._id,
        company: job.company,
        role: job.role,
        status: job.status,
        date: job.updatedAt,
      }));

    // =======================
    // Recent Applications
    // =======================
    const recentApplications = jobs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((job) => ({
        id: job._id,
        company: job.company,
        role: job.role,
        status: job.status,
        createdAt: job.createdAt,
      }));

    // =======================
    // Upcoming Interviews
    // =======================
    const upcomingInterviews = jobs
      .filter(
        (job) =>
          job.status === "Interview" &&
          job.interviewDate &&
          new Date(job.interviewDate) >= new Date()
      )
      .sort(
        (a, b) =>
          new Date(a.interviewDate) - new Date(b.interviewDate)
      )
      .slice(0, 5)
      .map((job) => ({
        id: job._id,
        company: job.company,
        role: job.role,
        interviewDate: job.interviewDate,
        status: job.status,
      }));

    // =======================
    // Status Count
    // =======================
    const statusCount = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    jobs.forEach((job) => {
      statusCount[job.status]++;
    });

    // =======================
    // Monthly Applications
    // =======================
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthly = new Array(12).fill(0);

    jobs.forEach((job) => {
      const month = new Date(job.createdAt).getMonth();
      monthly[month]++;
    });

    const monthlyApplications = months.map((month, index) => ({
      month,
      applications: monthly[index],
    }));

    res.json({
      totalJobs: jobs.length,
      statusCount,
      monthlyApplications,
      recentActivities,
      recentApplications,
      upcomingInterviews,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = { getAnalytics };