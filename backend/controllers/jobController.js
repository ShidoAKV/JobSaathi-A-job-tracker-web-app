const Job = require("../models/Job");
const { invalidateAnalytics } = require("../services/cacheService");

const createJob = async (req, res) => {
  try {

    const { company, role } = req.body;

    if (!company || !role) {
      return res.status(400).json({
        message: "Company and Role are required",
      });
    }

    const job = await Job.create({
      ...req.body,
      user: req.user.id,
    });

    invalidateAnalytics(req.user.id);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
  user: req.user.id,
}).sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

 const job = await Job.findOneAndDelete({
  _id: id,
  user: req.user.id,
});
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    invalidateAnalytics(req.user.id);
    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

const updatedJob = await Job.findOneAndUpdate(
  {
    _id: id,
    user: req.user.id,
  },
  req.body,
  {
    returnDocument: "after",
    runValidators: true,
  }
);

    if (!updatedJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    invalidateAnalytics(req.user.id);
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  deleteJob,
  updateJob
};