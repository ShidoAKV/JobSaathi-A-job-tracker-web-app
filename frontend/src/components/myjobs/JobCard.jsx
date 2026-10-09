import { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  IndianRupee,
  StickyNote,
} from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "../ui/StatusBadge";

const JobCard = ({ job, index, setOpenModal, setEditingJob, handleDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <Draggable draggableId={job._id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card p-4 transition-shadow ${
            snapshot.isDragging ? "shadow-pop border-primary/60 rotate-[1deg]" : "hover:border-line-strong"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center font-bold text-fg shrink-0">
                {job.company?.charAt(0).toUpperCase() || "J"}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-fg truncate">{job.company}</h3>
                <p className="text-sm text-fg-muted truncate">{job.role}</p>
              </div>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
                aria-label="Actions"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-40 card shadow-pop p-1 z-20 animate-pop">
                  <button
                    onClick={() => {
                      setEditingJob(job);
                      setOpenModal(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-fg hover:bg-surface-2 transition-colors"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm("Delete this application?")) handleDelete(job._id);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger-soft transition-colors"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-fg-muted">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-fg-subtle" />
              <span className="truncate">{job.location || "Location not specified"}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2">
                <IndianRupee size={14} className="text-fg-subtle" />
                <span>{job.salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-fg-subtle" />
              <span>
                {job.status === "Interview" && job.interviewDate
                  ? `Interview ${format(new Date(job.interviewDate), "d MMM yyyy")}`
                  : job.appliedDate
                  ? `Applied ${job.appliedDate}`
                  : "No date"}
              </span>
            </div>
            {job.notes && (
              <div className="flex items-start gap-2 pt-1">
                <StickyNote size={14} className="text-fg-subtle mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed line-clamp-2">{job.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <StatusBadge status={job.status} />
            {job.jobLink && (
              <a
                href={job.jobLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View job <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default JobCard;
