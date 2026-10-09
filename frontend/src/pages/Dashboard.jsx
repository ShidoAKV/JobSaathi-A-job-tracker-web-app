import StatCards from "../components/dashboard/StatCards";
import RecentApplications from "../components/dashboard/RecentApplications";
import UpcomingInterviews from "../components/dashboard/UpcomingInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import useAnalytics from "../hooks/useAnalytics";

const Dashboard = () => {
  const { data, loading } = useAnalytics();

  return (
    <div className="space-y-6">
      <StatCards analytics={data} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RecentApplications jobs={data?.recentApplications || []} loading={loading} />
          <ActivityTimeline activities={data?.recentActivities || []} loading={loading} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <UpcomingInterviews interviews={data?.upcomingInterviews || []} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
