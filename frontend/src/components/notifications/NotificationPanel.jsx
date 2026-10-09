import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, Briefcase, CheckCheck, MapPin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";

/**
 * Dropdown panel listing newly posted jobs (one notification per listing).
 * Opened from the bell icon in the navbar.
 */
const NotificationPanel = ({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  markAllRead,
  markRead,
}) => {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const openListing = (n) => {
    if (!n.read) markRead(n._id);
    onClose();
    if (n.type === "system") {
      navigate("/settings");
      return;
    }
    navigate(n.listing?._id ? `/jobs?highlight=${n.listing._id}` : "/jobs");
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[400px] card shadow-pop z-[70] overflow-hidden animate-pop"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div>
          <p className="font-semibold text-fg">New job alerts</p>
          <p className="text-xs text-fg-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs px-2.5 py-1.5">
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications yet"
            description="You'll be notified here (and by email) whenever a new job is listed."
            compact
          />
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => openListing(n)}
              className={`w-full text-left px-4 py-3.5 flex gap-3 border-b border-line last:border-0 transition-colors hover:bg-surface-2 ${
                n.read ? "" : "bg-primary-soft/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                {n.type === "new_job" ? <Briefcase size={18} /> : <Sparkles size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-fg truncate">{n.title}</p>
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-fg-subtle">
                  {n.listing?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {n.listing.location}
                    </span>
                  )}
                  {n.listing?.salary && <span>{n.listing.salary}</span>}
                  <span className="ml-auto">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-line bg-surface-2/50">
        <button
          onClick={() => {
            onClose();
            navigate("/jobs");
          }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Browse all jobs
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
