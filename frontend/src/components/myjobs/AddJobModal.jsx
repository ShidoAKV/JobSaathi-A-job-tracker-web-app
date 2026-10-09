import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import { createJob, updateJob } from "../../services/jobService";
import { getErrorMessage } from "../../services/api";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({
  company: "",
  role: "",
  location: "",
  salary: "",
  jobLink: "",
  appliedDate: today(),
  interviewDate: "",
  status: "Applied",
  notes: "",
});

const AddJobModal = ({ open, setOpen, editingJob, setEditingJob, fetchJobs }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setFormData({
        ...emptyForm(),
        ...editingJob,
        interviewDate: editingJob.interviewDate
          ? new Date(editingJob.interviewDate).toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData(emptyForm());
    }
  }, [editingJob, open]);

  const close = () => {
    setOpen(false);
    setEditingJob(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.status === "Interview" && !formData.interviewDate) {
      toast.error("Please set an interview date");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, interviewDate: formData.interviewDate || null };
      if (editingJob?._id) {
        await updateJob(editingJob._id, payload);
        toast.success("Application updated");
      } else {
        await createJob(payload);
        toast.success("Application added");
      }
      await fetchJobs();
      close();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const valid = formData.company.trim() && formData.role.trim();

  return (
    <Modal
      open={open}
      onClose={close}
      title={editingJob?._id ? "Edit application" : "Add application"}
      subtitle={
        editingJob?._id ? "Update the details of this application." : "Log a job you've applied to."
      }
      footer={
        <>
          <button type="button" onClick={close} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="job-form" disabled={!valid || saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : editingJob?._id ? "Save changes" : "Add application"}
          </button>
        </>
      }
    >
      <form id="job-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label">Company *</label>
          <input name="company" value={formData.company} onChange={handleChange} placeholder="Google" className="input" required />
        </div>
        <div>
          <label className="label">Role *</label>
          <input name="role" value={formData.role} onChange={handleChange} placeholder="Software Engineer" className="input" required />
        </div>

        <div>
          <label className="label">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input">
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {formData.status === "Interview" ? (
          <div>
            <label className="label">Interview date *</label>
            <input type="date" name="interviewDate" value={formData.interviewDate} onChange={handleChange} className="input" />
          </div>
        ) : (
          <div>
            <label className="label">Applied date</label>
            <input type="date" name="appliedDate" value={formData.appliedDate} onChange={handleChange} className="input" />
          </div>
        )}

        <div>
          <label className="label">Location</label>
          <input name="location" value={formData.location} onChange={handleChange} placeholder="Bengaluru, India" className="input" />
        </div>
        <div>
          <label className="label">Salary</label>
          <input name="salary" value={formData.salary} onChange={handleChange} placeholder="12 LPA" className="input" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Job link</label>
          <input type="url" name="jobLink" value={formData.jobLink} onChange={handleChange} placeholder="https://…" className="input" />
        </div>

        {formData.status === "Interview" && (
          <div className="md:col-span-2">
            <label className="label">Applied date</label>
            <input type="date" name="appliedDate" value={formData.appliedDate} onChange={handleChange} className="input" />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="label">Notes</label>
          <textarea rows="3" name="notes" value={formData.notes} onChange={handleChange} placeholder="Recruiter name, referral, next steps…" className="input resize-none" />
        </div>
      </form>
    </Modal>
  );
};

export default AddJobModal;
