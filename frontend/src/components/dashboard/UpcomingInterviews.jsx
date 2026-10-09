import { CalendarDays } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import EmptyState from "../ui/EmptyState";

const UpcomingInterviews = ({ interviews, loading }) => (
  <div className="card p-6">
    <h2 className="card-title mb-5">Upcoming interviews</h2>

    {loading ? (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    ) : interviews.length === 0 ? (
      <EmptyState
        icon={CalendarDays}
        title="No interviews scheduled"
        description="Move an application to Interview and set a date to see it here."
        compact
      />
    ) : (
      <ul className="space-y-3">
        {interviews.map((item) => {
          const date = new Date(item.interviewDate);
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-2 border border-line"
            >
              <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning flex flex-col items-center justify-center leading-none shrink-0">
                <span className="text-[10px] font-semibold uppercase">{format(date, "MMM")}</span>
                <span className="text-lg font-bold">{format(date, "d")}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg truncate">{item.company}</p>
                <p className="text-sm text-fg-muted truncate">{item.role}</p>
              </div>
              <p className="text-xs text-fg-subtle shrink-0">
                {formatDistanceToNow(date, { addSuffix: true })}
              </p>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default UpcomingInterviews;
