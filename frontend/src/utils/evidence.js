import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { PLACEHOLDER_RE } from "./resumeInsights";

export const EVIDENCE = {
  supported: { label: "Supported", Icon: ShieldCheck, cls: "badge-offer", ring: "border-success/40" },
  needs_confirmation: { label: "Needs confirmation", Icon: ShieldQuestion, cls: "badge-interview", ring: "border-warning/40" },
  unsupported: { label: "Unsupported", Icon: ShieldAlert, cls: "badge-rejected", ring: "border-danger/40" },
};

export const FLAG_LABEL = {
  vague: "Vague",
  missing_metric: "No metric",
  weak_verb: "Weak verb",
  passive: "Passive voice",
  too_long: "Too long",
  duty_not_impact: "Duty, not impact",
  jargon: "Jargon",
};

/** Replace [ADD: …] placeholders with the candidate's supplied evidence; unfilled ones stay. */
export const applyEvidence = (text, values = {}) =>
  text.replace(PLACEHOLDER_RE, (ph) => (values[ph] && values[ph].trim() ? values[ph].trim() : ph));

/** Same normalisation the backend applies before numbering lines (keeps `line` references stable). */
export const normalizeResumeText = (text = "") =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
