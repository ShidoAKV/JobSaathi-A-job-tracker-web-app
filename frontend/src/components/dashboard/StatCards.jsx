import {
  Briefcase,
  Send,
  CalendarCheck,
  Trophy,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getAnalytics } from "../../services/analyticsService";

const StatCards = () => {
  const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.log(err);
    }
  };

  fetchAnalytics();
}, []);

  const stats = [
  {
    title: "Total Jobs",
    value: analytics?.totalJobs || 0,
    icon: <Briefcase size={24} />,
    color: "from-blue-600 to-cyan-500",
  },
  {
    title: "Applied",
    value: analytics?.statusCount?.Applied || 0,
    icon: <Send size={24} />,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Interviews",
    value: analytics?.statusCount?.Interview || 0,
    icon: <CalendarCheck size={24} />,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Offers",
    value: analytics?.statusCount?.Offer || 0,
    icon: <Trophy size={24} />,
    color: "from-green-500 to-emerald-500",
  },
];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((item, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 dark:text-slate-400">{item.title}</p>

              <h2 className="text-4xl font-bold mt-2 text-slate-800 dark:text-white" >
                {item.value}
              </h2>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center`}
            >
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;