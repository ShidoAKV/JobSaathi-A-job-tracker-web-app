import StatCards from "../components/dashboard/StatCards";
import RecentApplications from "../components/dashboard/RecentApplications";
import UpcomingInterviews from "../components/dashboard/UpcomingInterviews";
import QuickActions from "../components/dashboard/QuickActions";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";

const Dashboard = () => {
  return (
    <div className="space-y-6">
  <StatCards />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <RecentApplications />
        <UpcomingInterviews />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <QuickActions />
        <ActivityTimeline />
      </div>
   </div>
  );
};

export default Dashboard;