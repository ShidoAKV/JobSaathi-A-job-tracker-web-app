import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { tooltipStyle } from "./chartTheme";

const ApplicationsChart = ({ data, loading }) => (
  <div className="card p-6 h-full">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="card-title">Monthly applications</h2>
        <p className="text-sm text-fg-muted">Applications logged per month this year</p>
      </div>
    </div>

    <div className="h-80">
      {loading ? (
        <div className="h-full rounded-xl bg-surface-2 animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={26}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--fg-muted)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--fg-muted)" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
            <Tooltip cursor={{ fill: "var(--primary-soft)" }} contentStyle={tooltipStyle} />
            <Bar dataKey="applications" radius={[6, 6, 0, 0]} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

export default ApplicationsChart;
