import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 z-50
          h-screen w-72
       bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
          flex flex-col justify-between p-6
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div>
          {/* Mobile Close Button */}
          <div className="flex justify-between items-center lg:hidden mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              JobSathi
            </h1>

            <button onClick={() => setSidebarOpen(false)}>
             <X size={24} className="text-slate-800 dark:text-white" />
            </button>
          </div>

          {/* Desktop Logo */}
          <div className="hidden lg:block mb-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              JobSathi
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track Your Career
            </p>
          </div>

          <nav className="space-y-3">

            <NavLink
            to="/dashboard"
            className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl ${
              isActive
             ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
           : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800"
            }`
            }
            >
          <LayoutDashboard size={20} />
          Dashboard
         </NavLink>

            <NavLink
            to="/my-jobs"
             className={({ isActive }) =>
             `flex items-center gap-3 px-4 py-3 rounded-xl ${
              isActive
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
             : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800"
             }`
            }
            >
          <Briefcase size={20} />
          My Jobs
        </NavLink>

<NavLink
  to="/analytics"
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
        :  "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`
  }
>
  <BarChart3 size={20} />
  Analytics
</NavLink>


<NavLink
  to="/settings"
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
        : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
    }`
  }
>
  <Settings size={20} />
  Settings
</NavLink>

</nav>
</div>

        
      </aside>
    </>
  );
};

export default Sidebar;