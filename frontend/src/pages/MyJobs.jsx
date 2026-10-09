import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import JobBoard from "../components/myjobs/JobBoard";
import AddJobModal from "../components/myjobs/AddJobModal";
import { getJobs, deleteJob } from "../services/jobService";
import { getErrorMessage } from "../services/api";

const MyJobs = () => {
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchJobs = async () => {
    try {
      setJobs(await getJobs());
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load applications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (location.state?.openModal) {
      setOpenModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDelete = async (id) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((job) => job._id !== id));
      toast.success("Application deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SearchBar
        setOpenModal={setOpenModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        total={jobs.length}
      />

      <JobBoard
        jobs={jobs}
        loading={loading}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        setOpenModal={setOpenModal}
        setEditingJob={setEditingJob}
        handleDelete={handleDelete}
        fetchJobs={fetchJobs}
      />

      <AddJobModal
        open={openModal}
        setOpen={setOpenModal}
        editingJob={editingJob}
        setEditingJob={setEditingJob}
        fetchJobs={fetchJobs}
      />
    </div>
  );
};

export default MyJobs;
