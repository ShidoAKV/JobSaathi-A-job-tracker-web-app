import { useNavigate } from "react-router-dom";
import { PlusCircle, Compass, FileText, MessageSquare } from "lucide-react";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add application",
      desc: "Log a new job you applied to",
      icon: PlusCircle,
      tone: "text-primary bg-primary-soft",
      onClick: () => navigate("/my-jobs", { state: { openModal: true } }),
    },
    {
      title: "Explore jobs",
      desc: "Browse open roles",
      icon: Compass,
      tone: "text-info bg-info-soft",
      onClick: () => navigate("/jobs"),
    },
    {
      title: "Resume AI",
      desc: "Match against a JD",
      icon: FileText,
      tone: "text-success bg-success-soft",
      onClick: () => navigate("/resume"),
    },
    {
      title: "Messages",
      desc: "Chat with companies",
      icon: MessageSquare,
      tone: "text-warning bg-warning-soft",
      onClick: () => navigate("/messages"),
    },
  ];

  return (
    <div className="card p-6">
      <h2 className="card-title mb-5">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ title, desc, icon: Icon, tone, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="text-left p-4 rounded-xl bg-surface-2 border border-line hover:border-primary/50 hover:bg-surface-3 transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="font-semibold text-fg text-sm mt-3">{title}</p>
            <p className="text-xs text-fg-muted mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
