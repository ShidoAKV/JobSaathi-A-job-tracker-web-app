import { Briefcase } from "lucide-react";

const Logo = ({ size = "md", showTagline = false }) => {
  const box = size === "lg" ? "w-12 h-12 rounded-2xl" : "w-9 h-9 rounded-xl";
  const text = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} bg-primary text-on-primary flex items-center justify-center shrink-0`}
      >
        <Briefcase size={size === "lg" ? 24 : 18} />
      </div>
      <div className="leading-tight">
        <p className={`${text} font-extrabold tracking-tight text-fg`}>
          Job<span className="text-primary">Saathi</span>
        </p>
        {showTagline && (
          <p className="text-xs text-fg-muted">Your career companion</p>
        )}
      </div>
    </div>
  );
};

export default Logo;
