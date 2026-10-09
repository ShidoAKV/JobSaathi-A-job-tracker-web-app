import { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ open, onClose, title, subtitle, children, footer, size = "lg" }) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-4xl" }[size];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`card w-full ${width} max-h-[92vh] flex flex-col overflow-hidden animate-rise shadow-pop`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-fg">{title}</h2>
            {subtitle && <p className="text-sm text-fg-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="icon-btn w-9 h-9" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-line bg-surface-2/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
