import { Briefcase, Send, CalendarCheck, Trophy, TrendingUp } from "lucide-react";

const StatCards = ({ analytics, loading }) => {
  const total = analytics?.totalJobs || 0;
  const sc = analytics?.statusCount || {};
  const responseRate = total
    ? Math.round((((sc.Interview || 0) + (sc.Offer || 0)) / total) * 100)
    : 0;

  const stats = [
    { title: "Total applications", value: total, icon: Briefcase, tone: "text-primary bg-primary-soft" },
    { title: "Applied", value: sc.Applied || 0, icon: Send, tone: "text-info bg-info-soft" },
    { title: "Interviews", value: sc.Interview || 0, icon: CalendarCheck, tone: "text-warning bg-warning-soft" },
    { title: "Offers", value: sc.Offer || 0, icon: Trophy, tone: "text-success bg-success-soft" },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      {stats.map(({ title, value, icon: Icon, tone }) => (
        <div key={title} className="card p-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-fg-muted">{title}</p>
            <p className="text-3xl font-bold text-fg mt-2 tabular-nums">
              {loading ? <span className="inline-block w-10 h-8 rounded bg-surface-2 animate-pulse" /> : value}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
            <Icon size={20} />
          </div>
        </div>
      ))}

      <div className="card p-5 col-span-2 xl:col-span-1 bg-primary text-on-primary border-primary">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">Response rate</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">{loading ? "—" : `${responseRate}%`}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
        <p className="text-xs opacity-80 mt-3">Interviews + offers over all applications</p>
      </div>
    </div>
  );
};

export default StatCards;
