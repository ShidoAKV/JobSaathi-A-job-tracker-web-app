import ApplicationsChart from "../components/analytics/ApplicationsChart";
import StatusChart from "../components/analytics/StatusChart";

const Analytics = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 transition-colors duration-300">
      <ApplicationsChart />
      <StatusChart />
    </div>
  );
};

export default Analytics;