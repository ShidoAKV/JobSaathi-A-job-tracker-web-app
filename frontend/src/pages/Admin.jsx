import { useCallback, useEffect, useState } from "react";
import { Users, Building2, Briefcase, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import UsersTable from "../components/admin/UsersTable";
import ListingsTable from "../components/admin/ListingsTable";
import { getAdminStats } from "../services/adminService";
import { getErrorMessage } from "../services/api";

const TABS = [
  { key: "requests", label: "Employer requests" },
  { key: "users", label: "Users" },
  { key: "listings", label: "Listings" },
];

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("requests");

  const loadStats = useCallback(async () => {
    try {
      setStats(await getAdminStats());
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load admin stats"));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const cards = [
    { label: "Total users", value: stats?.users, icon: Users, tone: "text-primary bg-primary-soft" },
    { label: "Employers", value: stats?.recruiters, icon: Building2, tone: "text-info bg-info-soft" },
    { label: "Pending requests", value: stats?.pendingRequests, icon: Clock, tone: "text-warning bg-warning-soft" },
    { label: "Listings", value: stats?.listings, icon: Briefcase, tone: "text-success bg-success-soft" },
    { label: "Conversations", value: stats?.conversations, icon: MessageSquare, tone: "text-fg bg-surface-3" },
    { label: "Admins", value: stats?.admins, icon: ShieldCheck, tone: "text-danger bg-danger-soft" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-fg tabular-nums">{value ?? "—"}</p>
              <p className="text-xs text-fg-muted truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex gap-1 p-2 border-b border-line overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-primary-soft text-primary" : "text-fg-muted hover:text-fg hover:bg-surface-2"
              }`}
            >
              {t.label}
              {t.key === "requests" && stats?.pendingRequests > 0 && (
                <span className="ml-2 inline-flex min-w-5 h-5 px-1.5 rounded-full bg-warning text-white text-[11px] font-bold items-center justify-center">
                  {stats.pendingRequests}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {tab === "requests" && <UsersTable mode="requests" onChanged={loadStats} />}
          {tab === "users" && <UsersTable mode="all" onChanged={loadStats} />}
          {tab === "listings" && <ListingsTable onChanged={loadStats} />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
