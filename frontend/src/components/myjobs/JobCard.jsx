import { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

const statusColor = {
  Applied:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",

  Interview:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",

  Offer:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",

  Rejected:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const JobCard = ({
  job,
   index,
  searchTerm,
  setJobs,
  setOpenModal,
  setEditingJob,
   handleDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  return (
    
    
  <Draggable
    draggableId={job._id.toString()}
    index={index}
  >
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
       className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >

      {/* Top */}
      <div className="flex justify-between items-start">

        <div className="flex gap-3">

          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg">
           {job.company?.charAt(0).toUpperCase() || "J"}
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {job.company}
            </h3>

            <p className="text-slate-500 dark:text-slate-400">
              {job.role}
            </p>
          </div>

        </div>

  <div className="relative" ref={menuRef}>

  <button
    onClick={() => setMenuOpen(!menuOpen)}
  >
    <MoreVertical
      size={20}
      className="text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
    />
  </button>

  {menuOpen && (
    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20">

      <button
  onClick={() => {
    setEditingJob(job);
    setOpenModal(true);
    setMenuOpen(false);
  }}
  className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition"
>
  <Pencil size={16} />
  Edit Job
</button>

      <button
  onClick={() => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (confirmDelete) {
     handleDelete(job._id);
    }

    setMenuOpen(false);
  }}
  className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
>
  <Trash2 size={16} />
  Delete Job
</button>

    </div>
  )}

</div>

      </div>

      {/* Details */}

      <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400">

  <div className="flex items-center gap-2">
    <MapPin size={16} />
    <span>{job.location || "Location not specified"}</span>
  </div>

 {job.salary && (
  <div className="flex items-center gap-2">
    💰
    <span>{job.salary}</span>
  </div>
)}
  <div className="flex items-center gap-2">
    <CalendarDays size={16} />
    <span>{job.appliedDate || "No date"}</span>
  </div>

  {job.jobLink && (
    <a
      href={job.jobLink}
      target="_blank"
      rel="noreferrer"
     className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 hover:underline"
    >
      <ExternalLink size={16} />
      View Job
    </a>
  )}

  {job.notes && (
    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 mt-2">
      <p className="text-slate-600 dark:text-slate-300 text-sm">
        📝 {job.notes}
      </p>
    </div>
  )}

</div>

      {/* Bottom */}

      <div className="mt-6 flex justify-end">

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[job.status]}`}
        >
          {job.status}
        </span>

      </div>

         </div>
    )}
  </Draggable>
);
};

export default JobCard;