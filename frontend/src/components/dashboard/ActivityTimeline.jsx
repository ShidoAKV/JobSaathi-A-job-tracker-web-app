import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CalendarCheck,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { getAnalytics } from "../../services/analyticsService";



const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);

useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setActivities(data.recentActivities);
    } catch (err) {
      console.log(err);
    }
  };

  fetchAnalytics();
}, []);

const getIcon = (status) => {
  switch (status) {
    case "Applied":
      return <CheckCircle2 className="text-blue-500" />;

    case "Interview":
      return <CalendarCheck className="text-yellow-500" />;

    case "Offer":
      return <CheckCircle2 className="text-green-500" />;

    case "Rejected":
      return <XCircle className="text-red-500" />;

    default:
      return <Clock3 className="text-gray-500" />;
  }
};
  return (
    
    

    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/30 p-6 transition-colors duration-300">

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Recent Activity
      </h2>

      <div className="space-y-6">

        {activities.map((item, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-5 last:border-none last:pb-0"
          >

            <div className="mt-1">
              {getIcon(item.status)}
            </div>

            <div>

              <p className="font-medium text-slate-800 dark:text-white">
               {item.status} • {item.company}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
              {item.role}
             </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
               {formatDistanceToNow(new Date(item.date), {
               addSuffix: true,
              })}
              </p>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default ActivityTimeline;