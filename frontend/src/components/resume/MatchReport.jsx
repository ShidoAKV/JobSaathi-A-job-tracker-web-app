import { CheckCircle2, AlertCircle, Lightbulb, ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import ScoreRing from "./ScoreRing";
import Spinner from "../ui/Spinner";

/** Gemini match analysis for the current text, with before/after score when available. */
const MatchReport = ({ analysis, originalAnalysis, onReanalyze, reanalyzing, dirty, onContinue }) => {
  if (!analysis) return null;

  const before = originalAnalysis?.matchScore;
  const after = analysis.matchScore;
  const delta = typeof before === "number" && typeof after === "number" ? after - before : null;

  return (
    <div className="space-y-6 animate-rise">
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={after} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Match score</p>
            {delta !== null && delta !== 0 && (
              <span className={`badge ${delta > 0 ? "badge-offer" : "badge-rejected"}`}>
                <TrendingUp size={12} /> {delta > 0 ? "+" : ""}
                {delta} vs original
              </span>
            )}
          </div>
          <p className="text-fg mt-2 leading-relaxed">{analysis.summary}</p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
            <button onClick={onReanalyze} disabled={reanalyzing} className="btn-secondary">
              {reanalyzing ? <Spinner size={15} /> : <RefreshCw size={15} />}
              {dirty ? "Re-analyze edited text" : "Re-analyze with AI"}
            </button>
            {onContinue && (
              <button onClick={onContinue} className="btn-primary">
                Improve bullets safely <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="card-title flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-success" /> Matched skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.matchedSkills || []).length === 0 && <p className="text-sm text-fg-muted">No direct matches found.</p>}
            {(analysis.matchedSkills || []).map((s, i) => (
              <span key={i} className="badge-offer">{s}</span>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="card-title flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-danger" /> Missing keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.missingKeywords || []).length === 0 && <p className="text-sm text-fg-muted">Nothing critical missing.</p>}
            {(analysis.missingKeywords || []).map((k, i) => (
              <span key={i} className="badge-rejected">{k}</span>
            ))}
          </div>
          <p className="text-xs text-fg-subtle mt-3">
            Only add these if you genuinely have the experience. The evidence checker will flag anything unsupported.
          </p>
        </div>
      </div>

      {(analysis.strengths || []).length > 0 && (
        <div className="card p-6">
          <h3 className="card-title mb-3">Strengths</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-fg-muted">
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.improvements || []).length > 0 && (
        <div className="card p-6">
          <h3 className="card-title flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-warning" /> Targeted improvements
          </h3>
          <div className="space-y-4">
            {analysis.improvements.map((imp, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{imp.section}</p>
                {imp.current && (
                  <p className="text-sm text-fg-muted mt-2">
                    <span className="font-semibold text-fg">Current:</span> {imp.current}
                  </p>
                )}
                <p className="text-sm text-fg mt-1.5">
                  <span className="font-semibold">Suggested:</span> {imp.suggested}
                </p>
                {imp.reason && <p className="text-xs text-fg-subtle mt-2">{imp.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchReport;
