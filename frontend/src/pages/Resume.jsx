import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload, BarChart3, PenLine, History, Sparkles, Save, ChevronLeft, Eye, EyeOff, Check, CloudUpload } from "lucide-react";
import toast from "react-hot-toast";
import UploadPanel from "../components/resume/UploadPanel";
import MatchReport from "../components/resume/MatchReport";
import ResumeEditor from "../components/resume/ResumeEditor";
import EvidenceSidebar from "../components/resume/EvidenceSidebar";
import VersionsPanel from "../components/resume/VersionsPanel";
import Spinner from "../components/ui/Spinner";
import { analyzeLocally } from "../utils/resumeInsights";
import { normalizeResumeText } from "../utils/evidence";
import {
  analyzeResume,
  getDraft,
  proofreadDraft,
  reanalyzeDraft,
  updateDraft,
} from "../services/resumeService";
import { getErrorMessage } from "../services/api";

const STEPS = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "match", label: "Match report", icon: BarChart3 },
  { key: "editor", label: "Proofread & edit", icon: PenLine },
  { key: "versions", label: "Versions & export", icon: History },
];

const AUTOSAVE_MS = 1500;

const Resume = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState("upload");
  const [draft, setDraft] = useState(null);
  const [lines, setLines] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [proofreading, setProofreading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("saved"); // saved | dirty | saving
  const lastSavedRef = useRef("");

  const currentText = useMemo(() => lines.join("\n"), [lines]);
  const insights = useMemo(() => analyzeLocally(currentText, draft?.jobDescription || ""), [currentText, draft?.jobDescription]);
  const dirtySinceAnalysis = draft?.analysisText !== undefined ? currentText !== draft.analysisText : false;

  const loadIntoState = useCallback((d) => {
    setDraft({ ...d, analysisText: d.currentText });
    const normalized = normalizeResumeText(d.currentText || "");
    setLines(normalized.split("\n"));
    lastSavedRef.current = normalized;
    setDecisions({});
    setSaveState("saved");
  }, []);

  // Reopen ?draft=<id>
  useEffect(() => {
    const id = searchParams.get("draft");
    if (!id || draft?._id === id) return;
    getDraft(id)
      .then((d) => {
        loadIntoState(d);
        setStep(d.proofread ? "editor" : "match");
      })
      .catch((e) => toast.error(getErrorMessage(e, "Could not open draft")));
  }, [searchParams, draft?._id, loadIntoState]);

  // Autosave edits (no version) after the user stops typing.
  useEffect(() => {
    if (!draft?._id || currentText === lastSavedRef.current) return undefined;
    setSaveState("dirty");
    const id = setTimeout(async () => {
      try {
        setSaveState("saving");
        await updateDraft(draft._id, { currentText });
        lastSavedRef.current = currentText;
        setSaveState("saved");
      } catch {
        setSaveState("dirty");
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(id);
  }, [currentText, draft?._id]);

  const handleAnalyze = async (file, jobDescription) => {
    setAnalyzing(true);
    try {
      const data = await analyzeResume(file, jobDescription, file.name.replace(/\.pdf$/i, ""));
      const d = await getDraft(data.draftId);
      loadIntoState(d);
      setSearchParams({ draft: d._id });
      setStep("match");
      toast.success("Resume analyzed and saved as a draft");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to analyze resume"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!draft) return;
    setReanalyzing(true);
    try {
      const { analysis, cached } = await reanalyzeDraft(draft._id, currentText);
      setDraft((d) => ({ ...d, analysis, analysisText: currentText, currentText }));
      lastSavedRef.current = currentText;
      toast.success(cached ? "Analysis is up to date" : `New match score: ${analysis.matchScore}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to re-analyze"));
    } finally {
      setReanalyzing(false);
    }
  };

  const handleProofread = async () => {
    if (!draft) return;
    setProofreading(true);
    try {
      const { proofread, cached } = await proofreadDraft(draft._id, currentText);
      setDraft((d) => ({ ...d, proofread, currentText }));
      lastSavedRef.current = currentText;
      setDecisions({});
      setShowSuggestions(true);
      toast.success(cached ? "Suggestions loaded" : `${proofread.bullets.length} suggestions with evidence labels`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Proofread failed"));
    } finally {
      setProofreading(false);
    }
  };

  const handleDecision = (id, decision, meta = {}) => {
    setDecisions((prev) => {
      const next = { ...prev };
      if (!decision) delete next[id];
      else next[id] = decision;
      return next;
    });
    if (decision === "accepted") {
      // Remember what was applied so the suggestion can be found/undone after further edits.
      setDraft((d) => ({
        ...d,
        proofread: {
          ...d.proofread,
          bullets: d.proofread.bullets.map((b) => (b.id === id ? { ...b, ...meta } : b)),
        },
      }));
    }
  };

  const handleSaveVersion = async (label) => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await updateDraft(draft._id, { currentText, saveVersion: true, label });
      setDraft((d) => ({ ...d, versions: updated.versions, currentText }));
      lastSavedRef.current = currentText;
      setSaveState("saved");
      toast.success("Version saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save version"));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (version) => {
    if (!window.confirm(`Replace the editor text with "${version.label}"? Unsaved edits will be lost.`)) return;
    setLines(version.text.split("\n"));
    setDecisions({});
    setStep("editor");
    toast.success(`Restored "${version.label}"`);
  };

  const acceptAll = () => {
    const bullets = draft?.proofread?.bullets || [];
    let next = [...lines];
    const applied = {};
    bullets.forEach((b) => {
      if (decisions[b.id] || b.evidence?.status === "unsupported") return;
      const idx = next.findIndex((l) => l.trim() === b.original.trim());
      if (idx === -1) return;
      const prefix = (next[idx].match(/^\s*(?:[-•*·▪◦]|\d+[.)])\s+/) || [""])[0];
      const hasPrefix = /^\s*(?:[-•*·▪◦]|\d+[.)])\s+/.test(b.suggested);
      const text = hasPrefix || !prefix ? b.suggested : prefix + b.suggested;
      applied[b.id] = { appliedText: text, previousText: next[idx], lineIndex: idx };
      next[idx] = text;
    });
    if (!Object.keys(applied).length) return toast("Nothing left to apply (unsupported suggestions are skipped).");
    setLines(next);
    setDecisions((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(applied).map((id) => [id, "accepted"])) }));
    setDraft((d) => ({
      ...d,
      proofread: { ...d.proofread, bullets: d.proofread.bullets.map((b) => (applied[b.id] ? { ...b, ...applied[b.id] } : b)) },
    }));
    toast.success(`Applied ${Object.keys(applied).length} supported suggestions`);
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const canGo = (key) => key === "upload" || Boolean(draft);

  return (
    <div className="space-y-6">
      <div className="card p-2 flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = i < stepIndex && Boolean(draft);
          return (
            <button
              key={s.key}
              onClick={() => canGo(s.key) && setStep(s.key)}
              disabled={!canGo(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                active ? "bg-primary-soft text-primary" : "text-fg-muted hover:text-fg hover:bg-surface-2"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                  done ? "bg-success text-white" : active ? "bg-primary text-on-primary" : "bg-surface-3 text-fg-muted"
                }`}
              >
                {done ? <Check size={11} /> : i + 1}
              </span>
              {s.label}
            </button>
          );
        })}

        {draft && (
          <div className="ml-auto flex items-center gap-3 pr-2 text-xs text-fg-muted whitespace-nowrap">
            <span className="hidden md:inline font-semibold text-fg truncate max-w-[200px]">{draft.title}</span>
            <span className="flex items-center gap-1">
              {saveState === "saving" ? <Spinner size={12} /> : <CloudUpload size={13} className={saveState === "saved" ? "text-success" : "text-warning"} />}
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : "Unsaved edits"}
            </span>
          </div>
        )}
      </div>

      {step === "upload" && (
        <UploadPanel
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
          onOpenDraft={(id) => setSearchParams({ draft: id })}
        />
      )}

      {step === "match" && draft && (
        <MatchReport
          analysis={draft.analysis}
          originalAnalysis={draft.originalAnalysis}
          onReanalyze={handleReanalyze}
          reanalyzing={reanalyzing}
          dirty={dirtySinceAnalysis}
          onContinue={() => setStep("editor")}
        />
      )}

      {step === "editor" && draft && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <button onClick={() => setStep("match")} className="btn-ghost px-2">
              <ChevronLeft size={16} /> Report
            </button>
            <button onClick={handleProofread} disabled={proofreading} className="btn-primary">
              {proofreading ? <Spinner size={15} /> : <Sparkles size={15} />}
              {draft.proofread ? "Re-run proofreader" : "Proofread with evidence checker"}
            </button>
            {draft.proofread && (
              <>
                <button onClick={() => setShowSuggestions((v) => !v)} className="btn-secondary">
                  {showSuggestions ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showSuggestions ? "Hide suggestions" : "Show suggestions"}
                </button>
                <button onClick={acceptAll} className="btn-secondary">
                  <Check size={15} /> Apply all supported
                </button>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={handleReanalyze} disabled={reanalyzing} className="btn-secondary">
                {reanalyzing ? <Spinner size={15} /> : <BarChart3 size={15} />}
                Re-score
              </button>
              <button onClick={() => handleSaveVersion()} disabled={saving} className="btn-secondary">
                {saving ? <Spinner size={15} /> : <Save size={15} />} Save version
              </button>
              <button onClick={() => setStep("versions")} className="btn-primary">
                <History size={15} /> Compare & download
              </button>
            </div>
          </div>

          {!draft.proofread && !proofreading && (
            <div className="rounded-xl border border-dashed border-line p-4 text-sm text-fg-muted">
              Edit any line directly. Run the proofreader to get rewritten bullets with an evidence label on each one
              (<span className="text-success">supported</span>, <span className="text-warning">needs confirmation</span>,{" "}
              <span className="text-danger">unsupported</span>). Nothing changes until you accept it.
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
            <ResumeEditor
              lines={lines}
              setLines={setLines}
              suggestions={draft.proofread?.bullets || []}
              decisions={decisions}
              onDecision={handleDecision}
              showSuggestions={showSuggestions}
            />
            <div className="xl:sticky xl:top-0">
              <EvidenceSidebar proofread={draft.proofread} decisions={decisions} insights={insights} />
            </div>
          </div>
        </div>
      )}

      {step === "versions" && draft && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("editor")} className="btn-ghost px-2">
              <ChevronLeft size={16} /> Back to editor
            </button>
            {draft.analysis && (
              <span className="text-sm text-fg-muted">
                Current AI score: <span className="font-semibold text-fg">{draft.analysis.matchScore}</span>
                {typeof draft.originalAnalysis?.matchScore === "number" && ` (original ${draft.originalAnalysis.matchScore})`}
              </span>
            )}
          </div>
          <VersionsPanel draft={draft} currentText={currentText} onSaveVersion={handleSaveVersion} onRestore={handleRestore} saving={saving} />
        </div>
      )}
    </div>
  );
};

export default Resume;
