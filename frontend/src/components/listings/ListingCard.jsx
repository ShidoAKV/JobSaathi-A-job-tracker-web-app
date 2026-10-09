import { Building2, MapPin, IndianRupee, Clock, ExternalLink, MessageSquare, Trash2, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeTone = {
  "Full-time": "badge bg-primary-soft text-primary",
  "Part-time": "badge bg-info-soft text-info",
  Internship: "badge bg-warning-soft text-warning",
  Contract: "badge bg-surface-3 text-fg-muted",
  Remote: "badge bg-success-soft text-success",
};

const ListingCard = ({ listing, isOwner, canModerate = false, highlighted, onConnect, onDelete, connecting }) => {
  const isNew = Date.now() - new Date(listing.createdAt).getTime() < 48 * 3600 * 1000;

  return (
    <article
      id={`listing-${listing._id}`}
      className={`card p-5 flex flex-col transition-all ${
        highlighted ? "border-primary ring-2 ring-primary/40" : "hover:border-line-strong"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-fg font-bold text-lg shrink-0">
          {listing.company?.charAt(0).toUpperCase() || <Building2 size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-fg leading-snug">{listing.role}</h3>
          <p className="text-sm text-fg-muted truncate">{listing.company}</p>
        </div>
        {isNew && <span className="badge bg-success-soft text-success">New</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-fg-muted">
        {listing.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-fg-subtle" /> {listing.location}
          </span>
        )}
        {listing.salary && (
          <span className="flex items-center gap-1.5">
            <IndianRupee size={14} className="text-fg-subtle" /> {listing.salary}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-fg-subtle" />
          {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
        </span>
      </div>

      {listing.description && (
        <p className="mt-3 text-sm text-fg-muted leading-relaxed line-clamp-3">{listing.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={typeTone[listing.type] || typeTone["Full-time"]}>{listing.type}</span>
        {(listing.skills || []).slice(0, 5).map((s) => (
          <span key={s} className="badge bg-surface-2 border border-line text-fg-muted font-medium">
            {s}
          </span>
        ))}
        {(listing.skills || []).length > 5 && (
          <span className="badge text-fg-subtle">+{listing.skills.length - 5}</span>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-line flex items-center gap-2">
        {isOwner ? (
          <>
            <span className="text-xs text-fg-muted flex items-center gap-1.5 flex-1">
              <Mail size={13} /> Posted by you
            </span>
            <button onClick={() => onDelete(listing)} className="btn-danger px-3 py-2 text-xs">
              <Trash2 size={14} /> Remove
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onConnect(listing)}
              disabled={connecting}
              className="btn-primary flex-1 py-2.5"
            >
              <MessageSquare size={15} />
              {connecting ? "Opening…" : "Connect with company"}
            </button>
            {listing.applyLink && (
              <a
                href={listing.applyLink}
                target="_blank"
                rel="noreferrer"
                className="icon-btn"
                title="Open application page"
              >
                <ExternalLink size={16} />
              </a>
            )}
            {canModerate && (
              <button onClick={() => onDelete(listing)} className="icon-btn text-danger" title="Remove listing (admin)">
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default ListingCard;
