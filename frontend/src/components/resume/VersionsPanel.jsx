import { useMemo, useState } from "react";
import { Download, FileText, FileCode, History, RotateCcw, Save, GitCompare } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { diffLines, diffStats } from "../../utils/diff";
import { exportMarkdown, exportPdf, exportTxt } from "../../utils/exportResume";
import Spinner from "../ui/Spinner";

const DiffView = ({ before, after }) => {
  const ops = useMemo(() => diffLines(before, after), [before, after]);
  const stats = diffStats(ops);

  return (
    <div>
      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="badge-offer">+{stats.added} added</span>
        <span className="badge-rejected">−{stats.removed} removed</span>
        <span className="text-fg-subtle">{ops.filter((o) => o.type === "equal").length} unchanged</span>
      </div>
      <div className="rounded-xl border border-line bg-surface-2 overflow-hidden max-h-[520px] overflow-y-auto font-mono text-[12px] leading-relaxed">
        {ops.map((op, i) => (
          <div
            key={i}
            className={`px-3 py-0.5 whitespace-pre-wrap break-words ${
              op.type === "add"
                ? "bg-success-soft text-success"
                : op.type === "del"
                ? "bg-danger-soft text-danger line-through decoration-danger/50"
                : "text-fg-muted"
            }`}
          >
            <span className="inline-block w-4 select-none opacity-70">{op.type === "add" ? "+" : op.type === "del" ? "−" : " "}</span>
            {op.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Version history, side-by-side comparison against any version, and downloads. */
const VersionsPanel = ({ draft, currentText, onSaveVersion, onRestore, saving }) => {
  const versions = draft?.versions || [];
  const [compareIndex, setCompareIndex] = useState(0);
  const [label, setLabel] = useState("");

  const base = versions[compareIndex]?.text ?? draft?.originalText ?? "";

  const save = async () => {
    await onSaveVersion(label.trim() || undefined);
    setLabel("");
  };

  const dl = (fn) => {
    try {
      fn(currentText, draft?.title);
      toast.success("Download started");
    } catch (e) {
      toast.error(e.message || "Export failed");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="card-title flex items-center gap-2 mb-3">
            <Download size={17} className="text-primary" /> Download new version
          </h3>
          <p className="text-xs text-fg-muted mb-3">Exports the current text (with your accepted changes).</p>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => dl(exportPdf)} className="btn-primary justify-start">
              <FileText size={15} /> PDF (ATS-friendly)
            </button>
            <button onClick={() => dl(exportMarkdown)} className="btn-secondary justify-start">
              <FileCode size={15} /> Markdown
            </button>
            <button onClick={() => dl(exportTxt)} className="btn-secondary justify-start">
              <FileText size={15} /> Plain text
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="card-title flex items-center gap-2 mb-3">
            <History size={17} className="text-primary" /> Version history
          </h3>
          <div className="flex gap-2 mb-3">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Tailored for Stripe" className="input py-2 text-sm" />
            <button onClick={save} disabled={saving} className="btn-primary px-3 whitespace-nowrap">
              {saving ? <Spinner size={14} /> : <Save size={14} />} Save
            </button>
          </div>
          <ul className="space-y-2 max-h-[360px] overflow-y-auto">
            {versions.map((v, i) => (
              <li
                key={i}
                className={`rounded-xl border p-3 flex items-center gap-2 ${
                  compareIndex === i ? "border-primary bg-primary-soft/30" : "border-line bg-surface-2"
                }`}
              >
                <button onClick={() => setCompareIndex(i)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-fg truncate">
                    {v.label} {i === 0 && <span className="text-[10px] text-fg-subtle font-normal">(uploaded)</span>}
                  </p>
                  <p className="text-[11px] text-fg-muted">
                    {format(new Date(v.createdAt), "d MMM yyyy, h:mm a")}
                    {typeof v.matchScore === "number" && ` · score ${v.matchScore}`}
                  </p>
                </button>
                <button onClick={() => onRestore(v)} className="icon-btn w-8 h-8" title="Restore this version into the editor">
                  <RotateCcw size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="xl:col-span-2 card p-5">
        <h3 className="card-title flex items-center gap-2 mb-1">
          <GitCompare size={17} className="text-primary" /> Compare
        </h3>
        <p className="text-xs text-fg-muted mb-4">
          Showing changes from <span className="font-semibold text-fg">{versions[compareIndex]?.label || "Original"}</span> to the
          current text. Pick another version on the left to compare against it.
        </p>
        <DiffView before={base} after={currentText} />
      </div>
    </div>
  );
};

export default VersionsPanel;
