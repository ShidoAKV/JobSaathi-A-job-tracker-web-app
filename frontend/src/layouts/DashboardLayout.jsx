import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";
import useAuthUser from "../hooks/useAuthUser";
import useProfileSync from "../hooks/useProfileSync";

const pageData = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your applications, interviews and activity at a glance.",
  },
  "/my-jobs": {
    title: "My Applications",
    subtitle: "Track every application through your pipeline.",
  },
  "/jobs": {
    title: "Explore Jobs",
    subtitle: "Browse open roles and connect with companies directly.",
  },
  "/messages": {
    title: "Messages",
    subtitle: "Chat with companies about the roles you're interested in.",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Measure how your job search is performing.",
  },
  "/resume": {
    title: "Resume AI",
    subtitle: "Match, proofread with an evidence checker, edit live and export a new version.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile, security and account type.",
  },
  "/admin": {
    title: "Admin",
    subtitle: "Review employer requests, manage users and moderate listings.",
  },
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useAuthUser();
  useProfileSync();

  const page = pageData[location.pathname] || { title: "JobSaathi", subtitle: "" };
  const title =
    location.pathname === "/dashboard" && user?.name
      ? `Welcome back, ${user.name.split(" ")[0]}`
      : page.title;

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={title}
          subtitle={page.subtitle}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 sm:pb-28 lg:pb-28">
          <div key={location.pathname} className="animate-rise max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default DashboardLayout;
