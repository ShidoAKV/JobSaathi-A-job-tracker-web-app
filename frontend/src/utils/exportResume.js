import { jsPDF } from "jspdf";
import { BULLET_RE, isBulletLine, isHeadingLine } from "./resumeInsights";

const safeName = (title) => (title || "resume").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") || "resume";

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportTxt = (text, title) =>
  download(new Blob([text], { type: "text/plain;charset=utf-8" }), `${safeName(title)}.txt`);

export const toMarkdown = (text) =>
  text
    .split("\n")
    .map((line, i) => {
      const t = line.trim();
      if (!t) return "";
      if (i === 0) return `# ${t}`;
      if (isHeadingLine(t)) return `\n## ${t}`;
      if (isBulletLine(t)) return `- ${t.replace(BULLET_RE, "")}`;
      return t;
    })
    .join("\n");

export const exportMarkdown = (text, title) =>
  download(new Blob([toMarkdown(text)], { type: "text/markdown;charset=utf-8" }), `${safeName(title)}.md`);

/** Clean, ATS-friendly single-column PDF built from the plain-text resume. */
export const exportPdf = (text, title) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const lines = text.split("\n");
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    const t = line.trim();

    if (!t) {
      y += 6;
      return;
    }

    if (i === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      ensureSpace(24);
      doc.text(t, margin, y);
      y += 24;
      return;
    }

    if (isHeadingLine(t)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      ensureSpace(22);
      y += 6;
      doc.text(t.toUpperCase(), margin, y);
      y += 4;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
      return;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    if (isBulletLine(t)) {
      const body = t.replace(BULLET_RE, "");
      const wrapped = doc.splitTextToSize(body, maxWidth - 14);
      ensureSpace(wrapped.length * 14);
      doc.text("•", margin + 2, y);
      doc.text(wrapped, margin + 14, y);
      y += wrapped.length * 14;
      return;
    }

    const wrapped = doc.splitTextToSize(t, maxWidth);
    ensureSpace(wrapped.length * 14);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14;
  });

  doc.save(`${safeName(title)}.pdf`);
};
