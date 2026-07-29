import JobColumn from "./JobColumn";
import { updateJob } from "../../services/jobService";
import {
  DragDropContext,
  Droppable,
} from "@hello-pangea/dnd";



const JobBoard = ({
  jobs,
  searchTerm,
  statusFilter,
  setJobs,
  setOpenModal,
  setEditingJob,
  handleDelete,
    fetchJobs,
}) => {
 const filteredJobs = jobs.filter((job) => {
  const matchesSearch =
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesStatus =
    statusFilter === "All" || job.status === statusFilter;

  return matchesSearch && matchesStatus;
});

const handleDragEnd = async (result) => {
  const { destination, draggableId } = result;

  if (!destination) return;

  const job = jobs.find(
    (j) => j._id.toString() === draggableId
  );

  if (!job) return;

  // Same column
  if (job.status === destination.droppableId) return;

  // Applied -> Interview
  if (
    destination.droppableId === "Interview" &&
    !job.interviewDate
  ) {
    setEditingJob({
      ...job,
      status: "Interview",
    });

    setOpenModal(true);
    return;
  }

  try {
    await updateJob(draggableId, {
      ...job,
      status: destination.droppableId,
    });

    await fetchJobs();
  } catch (err) {
    console.log(err);
  }
};

  return (
      <DragDropContext onDragEnd={handleDragEnd}>
   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 transition-colors duration-300">
      <JobColumn
        title="Applied"
        jobs={filteredJobs.filter((job) => job.status === "Applied")}
        setJobs={setJobs}
        setOpenModal={setOpenModal}
        setEditingJob={setEditingJob}
        handleDelete={handleDelete}
        
      />

      <JobColumn
        title="Interview"
        jobs={filteredJobs.filter((job) => job.status === "Interview")}
         setJobs={setJobs}
         setOpenModal={setOpenModal}
         setEditingJob={setEditingJob}
         handleDelete={handleDelete}

      />

      <JobColumn
        title="Offer"
        jobs={filteredJobs.filter((job) => job.status === "Offer")}
        setJobs={setJobs}
        setOpenModal={setOpenModal}
         setEditingJob={setEditingJob}
         handleDelete={handleDelete}


      />

      <JobColumn
        title="Rejected"
        jobs={filteredJobs.filter((job) => job.status === "Rejected")}
         setJobs={setJobs}
         setOpenModal={setOpenModal}
         setEditingJob={setEditingJob}
         handleDelete={handleDelete}
      />

    </div>
      </DragDropContext>
  );
};

export default JobBoard;