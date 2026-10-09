import { MessageSquare, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import EmptyState from "../ui/EmptyState";
import { getInitials } from "../../utils/auth";

const ConversationList = ({ conversations, activeId, onSelect, loading }) => {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const filtered = conversations.filter(
    (c) =>
      !q ||
      c.otherUser?.name?.toLowerCase().includes(q) ||
      c.listing?.company?.toLowerCase().includes(q) ||
      c.listing?.role?.toLowerCase().includes(q)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-line">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="input pl-9 py-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations"
            description="Open Explore Jobs and hit “Connect with company” on any role."
            compact
          />
        ) : (
          filtered.map((c) => {
            const active = c._id === activeId;
            return (
              <button
                key={c._id}
                onClick={() => onSelect(c)}
                className={`w-full text-left flex gap-3 px-3 py-3 border-b border-line transition-colors ${
                  active ? "bg-primary-soft" : "hover:bg-surface-2"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-3 text-fg flex items-center justify-center text-sm font-bold shrink-0">
                  {getInitials(c.otherUser?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${c.unreadCount ? "font-bold text-fg" : "font-semibold text-fg"}`}>
                      {c.otherUser?.name || "Company"}
                    </p>
                    {c.lastMessageAt && (
                      <span className="text-[10px] text-fg-subtle shrink-0">
                        {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary truncate">
                    {c.listing?.role} · {c.listing?.company}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${c.unreadCount ? "text-fg" : "text-fg-muted"}`}>
                      {c.lastMessage || "Say hello 👋"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
