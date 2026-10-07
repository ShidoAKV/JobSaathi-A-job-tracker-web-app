import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  LogOut,
  User
} from "lucide-react";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({
  setSidebarOpen,
  title,
  subtitle,
  showSearch = true,
}) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setProfileOpen(false);

    navigate("/login");
  };

  return (
    <header className="h-auto lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors duration-300">

      {/* Left */}
      <div className="flex items-center gap-4">

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
        >
          <Menu size={22} />
        </button>

        <div>
          {title && (
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        {showSearch && (
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 w-64">
            <Search
              size={20}
              className="text-slate-400"
            />

            <input
              type="text"
              placeholder="Search jobs..."
              className="bg-transparent outline-none ml-3 w-full text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Theme */}
        <button
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
          className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"
        >
          {mounted && (
            theme === "dark" ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-slate-600" />
            )
          )}
        </button>

      

        {/* Profile */}
        <div className="relative">

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-2 transition"
          >

            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="hidden sm:block text-left">
              <p className="font-semibold text-slate-900 dark:text-white">
                {user?.name
                  ? user.name.charAt(0).toUpperCase() +
                    user.name.slice(1)
                  : "User"}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Software Engineer
              </p>
            </div>

          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50">

              {/* User Info */}
              <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700">

                <p className="font-semibold text-slate-900 dark:text-white">
                  {user?.name || "User"}
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {user?.email || ""}
                </p>

              </div>

              {/* Profile */}
              

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
};

export default Navbar;