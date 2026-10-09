import { Droppable } from "@hello-pangea/dnd";
import JobCard from "./JobCard";

const dotColor = {
  Applied: "bg-primary",
  Interview: "bg-warning",
  Offer: "bg-success",
  Rejected: "bg-danger",
};

const JobColumn = ({ title, jobs, loading, setOpenModal, setEditingJob, handleDelete }) => (
  <Droppable droppableId={title}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`rounded-2xl border p-3 min-h-[420px] flex flex-col transition-colors ${
          snapshot.isDraggingOver
            ? "border-primary/60 bg-primary-soft/30"
            : "border-line bg-surface-2/40"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dotColor[title]}`} />
            <h2 className="font-semibold text-fg">{title}</h2>
          </div>
          <span className="text-xs font-semibold text-fg-muted bg-surface border border-line rounded-full px-2 py-0.5">
            {jobs.length}
          </span>
        </div>

        <div className="space-y-3 flex-1">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-surface animate-pulse" />
            ))
          ) : jobs.length === 0 ? (
            <div className="h-full min-h-[120px] rounded-xl border border-dashed border-line flex items-center justify-center text-xs text-fg-subtle">
              Drop applications here
            </div>
          ) : (
            jobs.map((job, index) => (
              <JobCard
                key={job._id}
                job={job}
                index={index}
                setOpenModal={setOpenModal}
                setEditingJob={setEditingJob}
                handleDelete={handleDelete}
              />
            ))
          )}
          {provided.placeholder}
        </div>
      </div>
    )}
  </Droppable>
);

export default JobColumn;
