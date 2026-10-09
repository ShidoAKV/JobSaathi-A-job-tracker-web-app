import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import { createListing } from "../../services/listingService";
import { getErrorMessage } from "../../services/api";

const TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"];

const emptyForm = () => ({
  company: "",
  role: "",
  location: "",
  salary: "",
  type: "Full-time",
  description: "",
  skills: "",
  applyLink: "",
  companyEmail: "",
});

const PostJobModal = ({ open, onClose, onCreated, defaultCompany = "" }) => {
  const [form, setForm] = useState(() => ({ ...emptyForm(), company: defaultCompany }));
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const close = () => {
    setForm({ ...emptyForm(), company: defaultCompany });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const listing = await createListing(form);
      toast.success("Job posted. All members will be notified.");
      onCreated(listing);
      close();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to post job"));
    } finally {
      setSaving(false);
    }
  };

  const valid = form.company.trim() && form.role.trim();

  return (
    <Modal
      open={open}
      onClose={close}
      title="Post a job"
      subtitle="Members will receive an in-app alert and email when this goes live. Candidates can message you directly."
      footer={
        <>
          <button type="button" onClick={close} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="post-job-form" disabled={!valid || saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : "Publish listing"}
          </button>
        </>
      }
    >
      <form id="post-job-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="label">Company *</label>
          <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" className="input" required />
        </div>
        <div>
          <label className="label">Role *</label>
          <input name="role" value={form.role} onChange={handleChange} placeholder="Frontend Engineer" className="input" required />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="Bengaluru / Remote" className="input" />
        </div>
        <div>
          <label className="label">Salary</label>
          <input name="salary" value={form.salary} onChange={handleChange} placeholder="18-25 LPA" className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Hiring contact email</label>
          <input type="email" name="companyEmail" value={form.companyEmail} onChange={handleChange} placeholder="careers@acme.com" className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Skills (comma separated)</label>
          <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, TypeScript, Node.js" className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Application link</label>
          <input type="url" name="applyLink" value={form.applyLink} onChange={handleChange} placeholder="https://careers.acme.com/jobs/123" className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea rows="4" name="description" value={form.description} onChange={handleChange} placeholder="What the role involves, team, requirements…" className="input resize-none" />
        </div>
      </form>
    </Modal>
  );
};

export default PostJobModal;
