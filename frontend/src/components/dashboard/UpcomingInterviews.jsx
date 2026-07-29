import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalytics } from "../../services/analyticsService";

const UpcomingInterviews = () => {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setInterviews(data.upcomingInterviews || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/30 p-6 transition-colors duration-300">

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Upcoming Interviews
      </h2>

      {interviews.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">
          No upcoming interviews
        </p>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-blue-50 dark:bg-slate-700 rounded-2xl p-5 transition-colors duration-300"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="text-blue-600 dark:text-cyan-400" />

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {item.company}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {item.role}
                  </p>

                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {new Date(item.interviewDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default UpcomingInterviews;