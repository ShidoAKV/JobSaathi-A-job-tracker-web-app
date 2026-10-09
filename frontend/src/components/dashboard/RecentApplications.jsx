import { ArrowRight, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import EmptyState from "../ui/EmptyState";

const RecentApplications = ({ jobs, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="card-title">Recent applications</h2>
        <button onClick={() => navigate("/my-jobs")} className="btn-ghost text-xs px-2.5 py-1.5">
          View all <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No applications yet"
          description="Add your first application to start tracking your pipeline."
          action={
            <button
              onClick={() => navigate("/my-jobs", { state: { openModal: true } })}
              className="btn-primary"
            >
              Add application
            </button>
          }
          compact
        />
      ) : (
        <ul className="divide-y divide-line">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center font-bold text-fg">
                {job.company?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg truncate">{job.company}</p>
                <p className="text-sm text-fg-muted truncate">{job.role}</p>
              </div>
              <div className="text-right shrink-0">
                <StatusBadge status={job.status} />
                <p className="text-[11px] text-fg-subtle mt-1">
                  {new Date(job.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentApplications;
