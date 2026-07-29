import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getAnalytics } from "../../services/analyticsService";

const ApplicationsChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const analytics = await getAnalytics();
      setData(analytics.monthlyApplications);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/30 p-6 transition-colors duration-300">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5">
        Monthly Applications
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#475569"
            />

            <XAxis
              dataKey="month"
              stroke="#94a3b8"
            />

            <YAxis stroke="#94a3b8" />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
            />

            <Bar
              dataKey="applications"
              radius={[8, 8, 0, 0]}
              fill="#2563eb"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ApplicationsChart;