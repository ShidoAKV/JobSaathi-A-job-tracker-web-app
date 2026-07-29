import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import JobBoard from "../components/myjobs/JobBoard";
import AddJobModal from "../components/myjobs/AddJobModal";
import { useLocation } from "react-router-dom";



import {
  getJobs,
  deleteJob,
} from "../services/jobService";


const MyJobs = () => {
  const location = useLocation();

 
const [jobs, setJobs] = useState([]);

const fetchJobs = async () => {
  try {
    const data = await getJobs();
    setJobs(data);
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  fetchJobs();
}, []);

  const [openModal, setOpenModal] = useState(false);

   const [editingJob, setEditingJob] = useState(null);
 const handleDelete = async (id) => {
  try {
    await deleteJob(id);

    setJobs((prev) => prev.filter((job) => job._id !== id));
  } catch (error) {
    console.log(error);
  }
};
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");


useEffect(() => {
  if (location.state?.openModal) {
    setOpenModal(true);
    window.history.replaceState({}, document.title);
  }
}, [location]);


 return (
  <div className="flex flex-col gap-6 transition-colors duration-300">

    <SearchBar
      setOpenModal={setOpenModal}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
    />

    <JobBoard
      jobs={jobs}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      setJobs={setJobs}
      setOpenModal={setOpenModal}
      setEditingJob={setEditingJob}
      handleDelete={handleDelete}
         fetchJobs={fetchJobs}
    />

   <AddJobModal
  open={openModal}
  setOpen={setOpenModal}
  jobs={jobs}
  setJobs={setJobs}
  editingJob={editingJob}
  setEditingJob={setEditingJob}
  fetchJobs={fetchJobs}
/>

  </div>
);
};

export default MyJobs;