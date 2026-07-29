import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  createJob,
  updateJob,
} from "../../services/jobService";


const AddJobModal = ({
  open,
  setOpen,
  editingJob,
  setEditingJob,
  fetchJobs,
}) => {
 

  const [formData, setFormData] = useState({
  company: "",
  role: "",
  location: "",
  salary: "",
  jobLink: "",
  appliedDate: new Date().toISOString().split("T")[0],
  interviewDate: "",
  status: "Applied",
  notes: "",
});

useEffect(() => {
  if (editingJob) {
    setFormData({
      ...editingJob,
      interviewDate: editingJob.interviewDate
        ? new Date(editingJob.interviewDate)
            .toISOString()
            .split("T")[0]
        : "",
    });
  }
}, [editingJob]);

const handleSubmit = async (e) => {
  console.log(formData);
  e.preventDefault();

  try {
    if (editingJob) {
      await updateJob(editingJob._id, formData);
    } else {
      await createJob(formData);
    }

    await fetchJobs();

    setFormData({
      company: "",
      role: "",
      location: "",
      salary: "",
      jobLink: "",
      appliedDate: new Date().toISOString().split("T")[0],
      interviewDate: "",
      status: "Applied",
      notes: "",
    });

    setEditingJob(null);
    setOpen(false);
  } catch (error) {
    console.log(error);
  }
};

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl dark:shadow-slate-900/50 relative max-h-[90vh] overflow-hidden transition-colors duration-300">
        {/* Close */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-700">

 <div>
  <h2 className="text-3xl font-bold text-slate-800">
    {editingJob ? "Edit Job" : "Add New Job"}
  </h2>

  <p className="text-slate-500 mt-1">
    {editingJob
      ? "Update your application details."
      : "Keep track of your applications."}
  </p>
</div>

  <button
    onClick={() => setOpen(false)}
    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
  >
    <X size={24} />
  </button>

</div>

       <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[65vh]">

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Company
            </label>

            <input
            type="text"
             name="company"
             value={formData.company}
             onChange={handleChange}
             placeholder="Google"
            className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>

            <input
              type="text"
               name="role"
              value={formData.role}
                onChange={handleChange}
                placeholder="Software Engineer"
               className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>

            <select
            name="status"
            value={formData.status}
             onChange={handleChange}
             className="w-full mt-2 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
             >
             {formData.status === "Interview" && (
           <div className="mt-4">
  <label className="font-medium text-slate-700 dark:text-slate-300">
    Interview Date & Time
  </label>

  <input
    type="datetime-local"
    name="interviewDate"
    value={formData.interviewDate}
    onChange={handleChange}
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
)}
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
             <option>Rejected</option>
           </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-slate-300">
              Job Link
            </label>

            <input
            type="url"
             name="jobLink"
              value={formData.jobLink}
              onChange={handleChange}
               placeholder="https://..."
              className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
          </div>

          

          <div>
  <label className="font-medium text-slate-700 dark:text-slate-300">
    Location
  </label>

  <input
    type="text"
    name="location"
    value={formData.location}
    onChange={handleChange}
    placeholder="Bangalore, India"
   className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

<div>
  <label className="font-medium text-slate-700 dark:text-slate-300">
    Salary
  </label>

  <input
    type="text"
    name="salary"
    value={formData.salary}
    onChange={handleChange}
    placeholder="12 LPA"
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

<div>
  <label className="font-medium text-slate-700 dark:text-slate-300">
    Applied Date
  </label>

  <input
    type="date"
    name="appliedDate"
    value={formData.appliedDate}
    onChange={handleChange}
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

<div className="md:col-span-2">
  <label className="font-medium text-slate-700 dark:text-slate-300">
    Notes
  </label>

  <textarea
    rows="4"
    name="notes"
    value={formData.notes}
    onChange={handleChange}
    placeholder="Any notes..."
   className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
<div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">

  <button
    type="button"
  onClick={() => {
  setOpen(false);
  setEditingJob(null);

  setFormData({
    company: "",
    role: "",
    location: "",
    salary: "",
    jobLink: "",
    appliedDate: new Date().toISOString().split("T")[0],
    status: "Applied",
    notes: "",
  });
}}
    className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
  >
    Cancel
  </button>

  <button
    type="submit"
    disabled={!formData.company.trim() || !formData.role.trim()}
    className={`px-8 py-3 rounded-xl font-semibold transition ${
      !formData.company.trim() || !formData.role.trim()
        ? "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-300 cursor-not-allowed"
        : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:scale-105"
    }`}
  >
 {editingJob ? "Update Job" : "Save Job"}
  </button>

</div>

        </form>

      </div>

    </div>
  );
};

export default AddJobModal;