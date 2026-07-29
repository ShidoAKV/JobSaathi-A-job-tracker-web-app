import JobCard from "./JobCard";
import { Droppable } from "@hello-pangea/dnd";

const JobColumn = ({
  title,
  jobs,
  setJobs,
  setOpenModal,
  setEditingJob,
  handleDelete,
}) => {
  return (
    <Droppable droppableId={title}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-5 min-h-[500px] transition-colors duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {title}
            </h2>

            <span className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-300">
              {jobs.length}
            </span>

          </div>

          {/* Cards */}
          <div className="space-y-4">

            {jobs.map((job, index) => (
              <JobCard
               key={job._id}
                job={job}
                index={index}
                setJobs={setJobs}
                setOpenModal={setOpenModal}
                setEditingJob={setEditingJob}
                handleDelete={handleDelete}
              />
            ))}

            {provided.placeholder}

          </div>

        </div>
      )}
    </Droppable>
  );
};

export default JobColumn;