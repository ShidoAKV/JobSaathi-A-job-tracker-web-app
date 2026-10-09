import { useEffect, useMemo, useRef } from "react";
import { isBulletLine, isHeadingLine, PLACEHOLDER_RE } from "../../utils/resumeInsights";
import SuggestionCard from "./SuggestionCard";

const AutoTextarea = ({ value, onChange, onKeyDown, className, placeholder, lineRef }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (lineRef) lineRef(el);
      }}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      rows={1}
      spellCheck
      placeholder={placeholder}
      className={`w-full resize-none bg-transparent outline-none leading-relaxed overflow-hidden focus:bg-primary-soft/30 rounded px-1 -mx-1 transition-colors ${className}`}
    />
  );
};

/**
 * Document-style editor: one auto-growing textarea per line with inline AI suggestions beneath.
 * Enter splits a line, Backspace on an empty line removes it.
 */
const ResumeEditor = ({ lines, setLines, suggestions, decisions, onDecision, showSuggestions }) => {
  const refs = useRef([]);

  // Map each suggestion to its current line index (text match first, then original line number).
  const byLine = useMemo(() => {
    const map = new Map();
    suggestions.forEach((b) => {
      const target = b.original.trim();
      let idx = lines.findIndex((l) => l.trim() === target);
      let stale = false;
      if (idx === -1 && decisions[b.id] === "accepted") {
        idx = lines.findIndex((l) => l.trim() === (b.appliedText || "").trim());
      }
      if (idx === -1) {
        idx = Math.min(lines.length - 1, Math.max(0, b.line - 1));
        stale = true;
      }
      const list = map.get(idx) || [];
      list.push({ ...b, stale });
      map.set(idx, list);
    });
    return map;
  }, [lines, suggestions, decisions]);

  const update = (i, value) => {
    const next = [...lines];
    // Paste with newlines → expand into multiple lines.
    if (value.includes("\n")) {
      next.splice(i, 1, ...value.split("\n"));
    } else {
      next[i] = value;
    }
    setLines(next);
  };

  const handleKey = (i, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const el = e.target;
      const pos = el.selectionStart;
      const before = lines[i].slice(0, pos);
      const after = lines[i].slice(pos);
      const prefix = isBulletLine(lines[i]) && after.trim() === "" && before.trim().match(/^[-•*·]\s*$/) ? "" : isBulletLine(lines[i]) ? "- " : "";
      const next = [...lines];
      next.splice(i, 1, before, prefix + after);
      setLines(next);
      requestAnimationFrame(() => {
        const n = refs.current[i + 1];
        if (n) {
          n.focus();
          n.setSelectionRange(prefix.length, prefix.length);
        }
      });
    } else if (e.key === "Backspace" && lines[i] === "" && lines.length > 1) {
      e.preventDefault();
      const next = [...lines];
      next.splice(i, 1);
      setLines(next);
      requestAnimationFrame(() => {
        const p = refs.current[Math.max(0, i - 1)];
        if (p) {
          p.focus();
          const len = p.value.length;
          p.setSelectionRange(len, len);
        }
      });
    } else if (e.key === "ArrowUp" && e.target.selectionStart === 0 && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowDown" && e.target.selectionStart === e.target.value.length && i < lines.length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const accept = (i, bullet, text) => {
    const next = [...lines];
    const bulletPrefix = (lines[i].match(/^\s*(?:[-•*·▪◦]|\d+[.)])\s+/) || [""])[0];
    const hasPrefix = /^\s*(?:[-•*·▪◦]|\d+[.)])\s+/.test(text);
    next[i] = hasPrefix || !bulletPrefix ? text : bulletPrefix + text;
    setLines(next);
    onDecision(bullet.id, "accepted", { appliedText: next[i], previousText: lines[i], lineIndex: i });
  };

  const undo = (i, bullet) => {
    if (decisions[bullet.id] === "accepted" && bullet.previousText !== undefined) {
      const next = [...lines];
      const idx = lines.findIndex((l) => l === bullet.appliedText);
      next[idx === -1 ? i : idx] = bullet.previousText;
      setLines(next);
    }
    onDecision(bullet.id, null);
  };

  return (
    <div className="card p-6 sm:p-8 font-[inherit]">
      {lines.map((line, i) => {
        const heading = isHeadingLine(line);
        const bullet = isBulletLine(line);
        const first = i === 0;
        const placeholders = (line.match(PLACEHOLDER_RE) || []).length;
        const items = showSuggestions ? byLine.get(i) || [] : [];
        const hasOpen = items.some((b) => !decisions[b.id]);

        return (
          <div key={i} className="group relative">
            <div className="flex gap-3">
              <span className="w-6 shrink-0 text-right text-[10px] text-fg-subtle select-none pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </span>
              <div className={`flex-1 min-w-0 ${hasOpen ? "border-l-2 border-primary pl-3 -ml-3" : ""}`}>
                <AutoTextarea
                  value={line}
                  onChange={(e) => update(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  lineRef={(el) => (refs.current[i] = el)}
                  placeholder={i === 0 ? "Your name" : ""}
                  className={
                    first
                      ? "text-2xl font-bold text-fg"
                      : heading
                      ? "text-xs font-bold uppercase tracking-wider text-primary mt-4"
                      : bullet
                      ? "text-sm text-fg"
                      : "text-sm text-fg-muted"
                  }
                />
                {placeholders > 0 && (
                  <p className="text-[11px] text-warning -mt-1 mb-1">
                    {placeholders} placeholder{placeholders > 1 ? "s" : ""} to fill — search for “[ADD:” on this line.
                  </p>
                )}
              </div>
            </div>

            {items.map((b) => (
              <SuggestionCard
                key={b.id}
                bullet={b}
                stale={b.stale}
                decision={decisions[b.id]}
                onAccept={(text) => accept(i, b, text)}
                onReject={() => onDecision(b.id, "rejected")}
                onUndo={() => undo(i, b)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ResumeEditor;
