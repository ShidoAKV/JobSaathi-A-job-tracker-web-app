import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import { getAnalytics } from "../../services/analyticsService";

const COLORS = [
  "#2563eb",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
];

const StatusChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const analytics = await getAnalytics();

      setData([
        {
          name: "Applied",
          value: analytics.statusCount.Applied,
        },
        {
          name: "Interview",
          value: analytics.statusCount.Interview,
        },
        {
          name: "Offer",
          value: analytics.statusCount.Offer,
        },
        {
          name: "Rejected",
          value: analytics.statusCount.Rejected,
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/30 p-6 transition-colors duration-300">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5">
        Status Distribution
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
            />

            <Legend
              wrapperStyle={{
                color: "#94a3b8",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusChart;