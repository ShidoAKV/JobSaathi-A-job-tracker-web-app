import ApplicationsChart from "../components/analytics/ApplicationsChart";
import StatusChart from "../components/analytics/StatusChart";
import StatCards from "../components/dashboard/StatCards";
import useAnalytics from "../hooks/useAnalytics";

const Analytics = () => {
  const { data, loading } = useAnalytics();

  return (
    <div className="space-y-6">
      <StatCards analytics={data} loading={loading} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <ApplicationsChart data={data?.monthlyApplications || []} loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <StatusChart statusCount={data?.statusCount} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
