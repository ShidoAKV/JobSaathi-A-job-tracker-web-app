import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { STATUS_COLORS, tooltipStyle } from "./chartTheme";

const StatusChart = ({ statusCount, loading }) => {
  const data = Object.entries(STATUS_COLORS).map(([name, color]) => ({
    name,
    color,
    value: statusCount?.[name] || 0,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-6 h-full">
      <h2 className="card-title">Status distribution</h2>
      <p className="text-sm text-fg-muted mb-5">Where your applications stand today</p>

      {loading ? (
        <div className="h-80 rounded-xl bg-surface-2 animate-pulse" />
      ) : total === 0 ? (
        <div className="h-80 flex items-center justify-center text-sm text-fg-muted">
          Add applications to see your distribution.
        </div>
      ) : (
        <>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold text-fg">{total}</p>
              <p className="text-xs text-fg-muted">total</p>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 border border-line text-sm">
                <span className="flex items-center gap-2 text-fg-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-fg">
                  {d.value}
                  <span className="text-fg-subtle font-normal ml-1">
                    ({Math.round((d.value / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default StatusChart;
