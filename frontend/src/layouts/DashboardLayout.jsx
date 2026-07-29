import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

const pageData = {
  "/dashboard": {
    title: "Welcome Back ",
    subtitle: "Track your applications and interviews.",
  },

  "/my-jobs": {
    title: "My Jobs",
    subtitle: "Manage all your job applications.",
  },

  "/analytics": {
    title: "Analytics",
    subtitle: "Track your application performance.",
  },

  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile and preferences.",
  },
};

const currentPage =
  pageData[location.pathname] || {
    title: "Dashboard",
    subtitle: "",
  };
  return (
   <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

      <Navbar
  title={currentPage.title}
  subtitle={currentPage.subtitle}
  showSearch={location.pathname === "/dashboard"}
  setSidebarOpen={setSidebarOpen}
/>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;