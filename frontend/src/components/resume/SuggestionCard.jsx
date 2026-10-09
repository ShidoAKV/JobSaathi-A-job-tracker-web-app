import { useMemo, useState } from "react";
import { Check, X, Wand2, Undo2 } from "lucide-react";
import { PLACEHOLDER_RE } from "../../utils/resumeInsights";
import { EVIDENCE, FLAG_LABEL, applyEvidence } from "../../utils/evidence";

/** Renders the suggested text with [ADD: …] placeholders highlighted. */
export const HighlightedText = ({ text, values = {} }) => {
  const parts = [];
  let last = 0;
  const re = new RegExp(PLACEHOLDER_RE.source, "g");
  let m;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={`t${idx++}`}>{text.slice(last, m.index)}</span>);
    const filled = values[m[0]];
    parts.push(
      <mark
        key={`p${idx++}`}
        className={`rounded px-1 ${filled ? "bg-success-soft text-success" : "bg-warning-soft text-warning"} font-medium`}
      >
        {filled || m[0]}
      </mark>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={`t${idx++}`}>{text.slice(last)}</span>);
  return <>{parts}</>;
};

/**
 * One inline suggestion under a resume line. The candidate can supply evidence for
 * placeholders, then accept (replace the line) or reject. Accepted suggestions can be undone.
 */
const SuggestionCard = ({ bullet, decision, onAccept, onReject, onUndo, stale }) => {
  const [values, setValues] = useState({});
  const placeholders = useMemo(() => [...new Set(bullet.suggested.match(PLACEHOLDER_RE) || [])], [bullet.suggested]);
  const ev = EVIDENCE[bullet.evidence?.status] || EVIDENCE.needs_confirmation;
  const missing = placeholders.filter((p) => !values[p]?.trim());

  if (decision === "rejected") {
    return (
      <div className="mt-1 mb-2 ml-6 flex items-center justify-between text-xs text-fg-subtle">
        <span>Suggestion dismissed</span>
        <button onClick={onUndo} className="btn-ghost px-2 py-1 text-xs">
          <Undo2 size={12} /> Undo
        </button>
      </div>
    );
  }

  if (decision === "accepted") {
    return (
      <div className="mt-1 mb-2 ml-6 flex items-center justify-between text-xs text-success">
        <span className="flex items-center gap-1">
          <Check size={12} /> Applied
        </span>
        <button onClick={onUndo} className="btn-ghost px-2 py-1 text-xs">
          <Undo2 size={12} /> Revert line
        </button>
      </div>
    );
  }

  return (
    <div className={`mt-2 mb-3 ml-0 sm:ml-6 rounded-xl border bg-surface-2 p-4 animate-pop ${ev.ring}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={ev.cls}>
          <ev.Icon size={12} /> {ev.label}
        </span>
        {(bullet.flags || []).map((f) => (
          <span key={f} className="badge bg-surface-3 text-fg-muted">
            {FLAG_LABEL[f] || f}
          </span>
        ))}
        {stale && <span className="badge bg-surface-3 text-fg-subtle">Line edited — suggestion may be outdated</span>}
      </div>

      <p className="text-sm text-fg leading-relaxed">
        <Wand2 size={13} className="inline text-primary mr-1.5 -mt-0.5" />
        <HighlightedText text={bullet.suggested} values={values} />
      </p>

      {bullet.reason && <p className="text-xs text-fg-muted mt-2">{bullet.reason}</p>}

      {bullet.evidence?.note && (
        <p className="text-xs text-fg-subtle mt-1">
          <span className="font-semibold text-fg-muted">Evidence check:</span> {bullet.evidence.note}
        </p>
      )}

      {placeholders.length > 0 && (
        <div className="mt-3 space-y-2">
          {bullet.evidence?.askFor && <p className="text-xs font-semibold text-warning">{bullet.evidence.askFor}</p>}
          {placeholders.map((p) => (
            <div key={p} className="flex items-center gap-2">
              <label className="text-[11px] text-fg-muted w-40 truncate shrink-0" title={p}>
                {p.replace(/^\[ADD:\s*/, "").replace(/\]$/, "")}
              </label>
              <input
                value={values[p] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
                placeholder="Your real figure, e.g. 35% or 2M users"
                className="input py-1.5 text-xs"
              />
            </div>
          ))}
          <p className="text-[11px] text-fg-subtle">
            Leave blank to keep the placeholder in the text (it stays highlighted until you fill it in).
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => onAccept(applyEvidence(bullet.suggested, values))} className="btn-primary px-3 py-1.5 text-xs">
          <Check size={13} /> {missing.length ? "Apply with placeholders" : "Accept"}
        </button>
        <button onClick={onReject} className="btn-secondary px-3 py-1.5 text-xs">
          <X size={13} /> Reject
        </button>
        {bullet.evidence?.status === "unsupported" && (
          <span className="text-[11px] text-danger ml-auto">Only accept if you truly have this experience.</span>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;
