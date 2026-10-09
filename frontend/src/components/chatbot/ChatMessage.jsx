import ReactMarkdown from "react-markdown";
import LottiePlayer from "./LottiePlayer";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Building2 } from "lucide-react";
import botAnimation from "./lottie/bot.json";

const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-primary-soft border border-line shrink-0 overflow-hidden flex items-center justify-center">
    <LottiePlayer animation={botAnimation} className="w-8 h-8" />
  </div>
);

const StatChips = ({ data }) => {
  if (!data || typeof data.totalJobs !== "number") return null;
  const sc = data.statusCount || {};
  const chips = [
    { label: "Total", value: data.totalJobs, cls: "text-fg" },
    { label: "Applied", value: sc.Applied ?? 0, cls: "text-primary" },
    { label: "Interview", value: sc.Interview ?? 0, cls: "text-warning" },
    { label: "Offer", value: sc.Offer ?? 0, cls: "text-success" },
    { label: "Rejected", value: sc.Rejected ?? 0, cls: "text-danger" },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5 mt-3">
      {chips.map((c) => (
        <div key={c.label} className="bg-surface border border-line rounded-lg px-1.5 py-1.5 text-center">
          <p className={`text-sm font-bold ${c.cls}`}>{c.value}</p>
          <p className="text-[10px] text-fg-muted">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

const ListingChips = ({ listings }) => {
  if (!Array.isArray(listings) || listings.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {listings.slice(0, 10).map((l) => (
        <Link
          key={l._id}
          to={`/jobs?highlight=${l._id}`}
          className="flex items-center gap-2.5 bg-surface border border-line rounded-lg px-2.5 py-2 hover:border-primary/50 transition-colors group"
        >
          <div className="w-7 h-7 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Building2 size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-fg truncate">
              {l.role} <span className="text-fg-muted font-normal">at {l.company}</span>
            </p>
            <p className="text-[11px] text-fg-muted truncate flex items-center gap-1">
              {l.location && (
                <>
                  <MapPin size={10} /> {l.location}
                </>
              )}
              {l.salary && <span>· {l.salary}</span>}
            </p>
          </div>
          <ArrowUpRight size={14} className="text-fg-subtle group-hover:text-primary" />
        </Link>
      ))}
    </div>
  );
};

const ChatMessage = ({ message }) => {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-rise">
        <div className="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 animate-rise">
      <BotAvatar />
      <div className="max-w-[88%] bg-surface-2 border border-line rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-fg leading-relaxed">
        <div className="prose-chat">
          <ReactMarkdown
            components={{
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>

        {message.intent === "stats" && <StatChips data={message.data} />}
        {(message.intent === "top_jobs" || message.intent === "company") && (
          <ListingChips listings={message.data?.listings} />
        )}
        {message.error && (
          <p className="text-[11px] text-danger mt-2">{message.error}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
