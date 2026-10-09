import { useEffect, useState } from "react";
import { FileText, Upload, X, Sparkles, FolderOpen, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Spinner from "../ui/Spinner";
import { deleteDraft, listDrafts } from "../../services/resumeService";
import { getErrorMessage } from "../../services/api";

/** Step 1: upload a PDF + job description, or reopen a saved draft. */
const UploadPanel = ({ onAnalyze, onOpenDraft, analyzing }) => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const loadDrafts = async () => {
    try {
      setDrafts(await listDrafts());
    } catch {
      /* non-fatal */
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") return toast.error("Please upload a PDF file");
    if (selected.size > 5 * 1024 * 1024) return toast.error("PDF must be under 5 MB");
    setFile(selected);
  };

  const remove = async (draft) => {
    if (!window.confirm(`Delete "${draft.title}" and all its versions?`)) return;
    try {
      await deleteDraft(draft._id);
      setDrafts((prev) => prev.filter((d) => d._id !== draft._id));
      toast.success("Draft deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete draft"));
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-6">
        <div className="card p-6">
          <h2 className="card-title mb-1">1. Upload your resume</h2>
          <p className="text-sm text-fg-muted mb-4">We extract the text so you can edit it right here afterwards.</p>

          {!file ? (
            <label
              htmlFor="resume-upload"
              className="border-2 border-dashed border-line rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-soft/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <Upload size={22} />
              </div>
              <p className="mt-4 font-semibold text-fg">Click to choose a PDF</p>
              <p className="text-xs text-fg-muted mt-1">Max 5 MB · text-based PDF (not a scan)</p>
              <input id="resume-upload" type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-line">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-danger-soft text-danger flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-fg truncate">{file.name}</p>
                  <p className="text-xs text-fg-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="icon-btn w-8 h-8" aria-label="Remove">
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="card-title mb-1">2. Paste the job description</h2>
          <p className="text-sm text-fg-muted mb-4">Used for the match score, keyword coverage and the evidence checker.</p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={9}
            className="input resize-none"
          />
          <button
            onClick={() => onAnalyze(file, jobDescription)}
            disabled={analyzing || !file || !jobDescription.trim()}
            className="btn-primary w-full mt-4 py-3"
          >
            {analyzing ? (
              <>
                <Spinner size={16} /> Extracting & analyzing with Gemini…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analyze match
              </>
            )}
          </button>
        </div>
      </div>

      <div className="xl:col-span-2">
        <div className="card p-6 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <FolderOpen size={18} />
            </div>
            <div>
              <h2 className="card-title">Saved drafts</h2>
              <p className="text-xs text-fg-muted">Reopen a resume to keep editing its versions.</p>
            </div>
          </div>

          {loadingDrafts ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-fg-muted py-6 text-center">
              No drafts yet. Analyze a resume and it will be saved here automatically.
            </p>
          ) : (
            <ul className="space-y-2">
              {drafts.map((d) => (
                <li key={d._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-line hover:border-primary/50 transition-colors">
                  <button onClick={() => onOpenDraft(d._id)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-fg truncate">{d.title}</p>
                    <p className="text-[11px] text-fg-muted truncate">{d.jobDescription || "No job description"}</p>
                    <p className="text-[11px] text-fg-subtle mt-1 flex items-center gap-1">
                      <Clock size={10} /> {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })} · {d.versionsCount} version
                      {d.versionsCount === 1 ? "" : "s"}
                    </p>
                  </button>
                  {typeof d.matchScore === "number" && (
                    <span
                      className={`badge ${
                        d.matchScore >= 70 ? "badge-offer" : d.matchScore >= 40 ? "badge-interview" : "badge-rejected"
                      }`}
                    >
                      {d.matchScore}
                    </span>
                  )}
                  <button onClick={() => remove(d)} className="icon-btn w-8 h-8 text-danger" aria-label="Delete draft">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;
