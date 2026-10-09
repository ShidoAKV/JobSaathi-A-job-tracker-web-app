import { CheckCircle2, CalendarCheck, Trophy, XCircle, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmptyState from "../ui/EmptyState";

const iconFor = {
  Applied: { Icon: CheckCircle2, tone: "text-primary bg-primary-soft" },
  Interview: { Icon: CalendarCheck, tone: "text-warning bg-warning-soft" },
  Offer: { Icon: Trophy, tone: "text-success bg-success-soft" },
  Rejected: { Icon: XCircle, tone: "text-danger bg-danger-soft" },
};

const ActivityTimeline = ({ activities, loading }) => (
  <div className="card p-6">
    <h2 className="card-title mb-5">Recent activity</h2>

    {loading ? (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    ) : activities.length === 0 ? (
      <EmptyState icon={Activity} title="No activity yet" compact />
    ) : (
      <ol className="relative border-l border-line ml-4 space-y-6">
        {activities.map((item, i) => {
          const { Icon, tone } = iconFor[item.status] || iconFor.Applied;
          return (
            <li key={i} className="pl-7 relative">
              <span
                className={`absolute -left-4 top-0 w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center ${tone}`}
              >
                <Icon size={14} />
              </span>
              <p className="font-medium text-fg text-sm">
                {item.status} · {item.company}
              </p>
              <p className="text-sm text-fg-muted">{item.role}</p>
              <p className="text-xs text-fg-subtle mt-0.5">
                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
              </p>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);

export default ActivityTimeline;
