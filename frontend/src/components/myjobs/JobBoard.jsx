import { DragDropContext } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import JobColumn from "./JobColumn";
import { updateJob } from "../../services/jobService";
import { getErrorMessage } from "../../services/api";

const COLUMNS = ["Applied", "Interview", "Offer", "Rejected"];

const JobBoard = ({
  jobs,
  loading,
  searchTerm,
  statusFilter,
  setOpenModal,
  setEditingJob,
  handleDelete,
  fetchJobs,
}) => {
  const term = searchTerm.toLowerCase();

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(term) ||
      job.role.toLowerCase().includes(term) ||
      (job.location || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "All" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const job = jobs.find((j) => j._id.toString() === draggableId);
    if (!job || job.status === destination.droppableId) return;

    if (destination.droppableId === "Interview" && !job.interviewDate) {
      setEditingJob({ ...job, status: "Interview" });
      setOpenModal(true);
      return;
    }

    try {
      await updateJob(draggableId, { ...job, status: destination.droppableId });
      await fetchJobs();
      toast.success(`Moved to ${destination.droppableId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update status"));
    }
  };

  const visibleColumns =
    statusFilter === "All" ? COLUMNS : COLUMNS.filter((c) => c === statusFilter);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className={`grid gap-5 ${
          visibleColumns.length === 1
            ? "grid-cols-1 max-w-xl"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visibleColumns.map((status) => (
          <JobColumn
            key={status}
            title={status}
            loading={loading}
            jobs={filteredJobs.filter((job) => job.status === status)}
            setOpenModal={setOpenModal}
            setEditingJob={setEditingJob}
            handleDelete={handleDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default JobBoard;
