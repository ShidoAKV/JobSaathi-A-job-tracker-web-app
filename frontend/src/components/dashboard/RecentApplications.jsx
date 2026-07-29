import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalytics } from "../../services/analyticsService";
import { useNavigate } from "react-router-dom";

const badgeColor = {
  Applied:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",

  Interview:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",

  Offer:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",

  Rejected:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const RecentApplications = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setJobs(data.recentApplications || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/30 p-6 transition-colors duration-300">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Recent Applications
        </h2>

       <button
      onClick={() => navigate("/my-jobs")}
       className="text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition"
      >
       View All
       <ArrowRight size={18} />
      </button>
      </div>

      <div className="space-y-4">

        {jobs.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-6">
            No recent applications
          </p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 last:border-none"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {job.company}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {job.role}
                </p>

                <p className="text-xs text-slate-400 mt-1">
               {new Date(job.createdAt).toLocaleDateString("en-IN")}
               </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor[job.status]}`}
              >
                {job.status}
              </span>
            </div>
          ))
        )}

      </div>

    </div>
  );
};

export default RecentApplications;