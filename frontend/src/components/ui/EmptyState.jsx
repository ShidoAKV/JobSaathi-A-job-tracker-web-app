const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? "py-8" : "py-14"
    }`}
  >
    {Icon && (
      <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-fg-muted mb-4">
        <Icon size={22} />
      </div>
    )}
    <p className="font-semibold text-fg">{title}</p>
    {description && (
      <p className="text-sm text-fg-muted mt-1 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
