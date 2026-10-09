import { ShieldCheck, ShieldQuestion, ShieldAlert, Activity, AlertTriangle, Map, Gauge, Target } from "lucide-react";
import { EVIDENCE } from "../../utils/evidence";

const Meter = ({ label, value, hint }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-fg-muted">{label}</span>
      <span className="font-semibold text-fg tabular-nums">{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-danger"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
    {hint && <p className="text-[11px] text-fg-subtle mt-1">{hint}</p>}
  </div>
);

/**
 * Right-hand panel: evidence summary of the AI suggestions, live local insights that
 * update on every keystroke, unsupported claims from the JD, and the learning roadmap.
 */
const EvidenceSidebar = ({ proofread, decisions, insights }) => {
  const bullets = proofread?.bullets || [];
  const counts = bullets.reduce(
    (acc, b) => {
      acc[b.evidence?.status || "needs_confirmation"] += 1;
      return acc;
    },
    { supported: 0, needs_confirmation: 0, unsupported: 0 }
  );
  const decided = bullets.filter((b) => decisions[b.id]).length;
  const accepted = bullets.filter((b) => decisions[b.id] === "accepted").length;

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="card-title flex items-center gap-2 mb-3">
          <Gauge size={17} className="text-primary" /> Live insights
        </h3>
        <p className="text-[11px] text-fg-subtle mb-3">
          Updates as you type. Heuristic signals, not a prediction of hiring outcomes.
        </p>
        <div className="space-y-3">
          <Meter label="Resume strength (heuristic)" value={insights.strength} />
          <Meter
            label="JD keyword coverage"
            value={insights.coveragePct}
            hint={`${insights.covered.length} of ${insights.keywords.length} keywords present`}
          />
          <Meter label="Bullets with metrics" value={insights.metricsPct} />
          <Meter label="Bullets starting with an action verb" value={insights.actionVerbPct} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-lg bg-surface-2 border border-line p-2">
            <p className="text-sm font-bold text-fg">{insights.wordCount}</p>
            <p className="text-[10px] text-fg-muted">words</p>
          </div>
          <div className="rounded-lg bg-surface-2 border border-line p-2">
            <p className="text-sm font-bold text-fg">{insights.bulletCount}</p>
            <p className="text-[10px] text-fg-muted">bullets</p>
          </div>
          <div className="rounded-lg bg-surface-2 border border-line p-2">
            <p className={`text-sm font-bold ${insights.placeholders ? "text-warning" : "text-fg"}`}>{insights.placeholders}</p>
            <p className="text-[10px] text-fg-muted">placeholders</p>
          </div>
        </div>

        {insights.missing.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5 flex items-center gap-1">
              <Target size={11} /> Keywords not found
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.missing.slice(0, 14).map((k) => (
                <span key={k} className="badge bg-surface-3 text-fg-muted">{k}</span>
              ))}
            </div>
          </div>
        )}

        {insights.vague.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5 flex items-center gap-1">
              <AlertTriangle size={11} /> Vague phrases
            </p>
            <ul className="text-xs text-fg-muted space-y-0.5">
              {insights.vague.slice(0, 6).map((v, i) => (
                <li key={i}>
                  Line {v.line}: “{v.phrase}”
                </li>
              ))}
              {insights.vague.length > 6 && <li className="text-fg-subtle">+{insights.vague.length - 6} more</li>}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="card-title flex items-center gap-2 mb-3">
          <Activity size={17} className="text-primary" /> Evidence check
        </h3>
        {!proofread ? (
          <p className="text-sm text-fg-muted">Run the proofreader to label every suggested claim.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["supported", ShieldCheck, "text-success"],
                ["needs_confirmation", ShieldQuestion, "text-warning"],
                ["unsupported", ShieldAlert, "text-danger"],
              ].map(([key, Icon, tone]) => (
                <div key={key} className="rounded-lg bg-surface-2 border border-line p-2.5">
                  <Icon size={16} className={`${tone} mx-auto`} />
                  <p className="text-lg font-bold text-fg mt-1">{counts[key]}</p>
                  <p className="text-[10px] text-fg-muted leading-tight">{EVIDENCE[key].label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-fg-muted mt-3">
              {decided} of {bullets.length} suggestions reviewed · {accepted} applied
            </p>
            {proofread.summary && <p className="text-sm text-fg mt-3 leading-relaxed">{proofread.summary}</p>}
          </>
        )}
      </div>

      {proofread?.unsupportedClaims?.length > 0 && (
        <div className="card p-5 border-danger/30">
          <h3 className="card-title flex items-center gap-2 mb-2">
            <ShieldAlert size={17} className="text-danger" /> Don't claim these
          </h3>
          <p className="text-xs text-fg-muted mb-3">
            The job asks for these but your resume shows no evidence. Add them only with real experience.
          </p>
          <ul className="space-y-2">
            {proofread.unsupportedClaims.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-fg">{c.text}</span>
                <span className="badge bg-surface-3 text-fg-muted ml-2">{c.type}</span>
                {c.note && <p className="text-xs text-fg-muted mt-0.5">{c.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {proofread?.roadmap?.length > 0 && (
        <div className="card p-5">
          <h3 className="card-title flex items-center gap-2 mb-3">
            <Map size={17} className="text-primary" /> Learning roadmap
          </h3>
          <ol className="space-y-3">
            {proofread.roadmap.map((r, i) => (
              <li key={i} className="rounded-xl bg-surface-2 border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">
                    {r.priority}. {r.skill}
                  </p>
                  {r.estimatedWeeks && <span className="badge bg-primary-soft text-primary">~{r.estimatedWeeks} wk</span>}
                </div>
                {r.why && <p className="text-xs text-fg-muted mt-1">{r.why}</p>}
                {r.steps?.length > 0 && (
                  <ul className="list-disc pl-4 mt-1.5 text-xs text-fg-muted space-y-0.5">
                    {r.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default EvidenceSidebar;
