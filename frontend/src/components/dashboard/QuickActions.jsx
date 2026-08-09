import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  BarChart3,
  FileText,
  Briefcase,
} from "lucide-react";
const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
 {
  title: "Add Job",
  icon: <PlusCircle size={22} />,
  color: "from-blue-600 to-cyan-500",
  action: () =>
    navigate("/my-jobs", {
      state: { openModal: true },
    }),
},
  {
    title: "Analytics",
    icon: <BarChart3 size={22} />,
    color: "from-purple-500 to-pink-500",
    action: () => navigate("/analytics"),
  },
{
  title: "Resume",
  icon: <FileText size={28} />,
  color: "from-green-500 to-emerald-500",
  action: () => navigate("/resume"),
},
  {
    title: "My Jobs",
    icon: <Briefcase size={22} />,
    color: "from-orange-500 to-amber-500",
    action: () => navigate("/my-jobs"),
  },
];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/30 p-6 transition-colors duration-300">

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">

        {actions.map((action, index) => (
          <button
          key={index}
          onClick={action.action}
          className={`bg-gradient-to-r ${action.color} rounded-2xl p-5 text-white hover:scale-105 hover:shadow-lg transition-all duration-300`}
         >
            <div className="flex flex-col items-center gap-3">
              {action.icon}

              <span className="font-semibold">
                {action.title}
              </span>
            </div>
          </button>
        ))}

      </div>

    </div>
  );
};

export default QuickActions;