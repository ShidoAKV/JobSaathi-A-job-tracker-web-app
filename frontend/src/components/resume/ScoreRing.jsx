const ScoreRing = ({ score = 0, size = 112, label = "/ 100" }) => {
  const r = 44;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = value >= 70 ? "var(--success)" : value >= 40 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-fg" style={{ fontSize: size * 0.24 }}>
          {value}
        </span>
        <span className="text-[10px] text-fg-muted">{label}</span>
      </div>
    </div>
  );
};

export default ScoreRing;
