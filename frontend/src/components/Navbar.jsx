import { Bell, Moon, Sun, Menu, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import useNotifications from "../hooks/useNotifications";
import NotificationPanel from "./notifications/NotificationPanel";
import { clearSession, getInitials } from "../utils/auth";

const Navbar = ({ setSidebarOpen, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const user = useAuthUser();
  const notifications = useNotifications();

  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <header className="h-20 shrink-0 bg-surface border-b border-line px-4 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="icon-btn lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-fg tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-fg-muted truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="icon-btn"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className={`icon-btn relative ${bellOpen ? "text-primary border-primary/50" : ""}`}
            aria-label="Notifications"
            title="New job alerts"
          >
            <Bell size={18} />
            {notifications.unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                  {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary animate-ping-slow pointer-events-none" />
              </>
            )}
          </button>

          <NotificationPanel
            open={bellOpen}
            onClose={() => setBellOpen(false)}
            {...notifications}
          />
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-surface-2 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
              {getInitials(user?.name)}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-fg max-w-[140px] truncate">
              {user?.name || "User"}
            </span>
            <ChevronDown size={16} className="text-fg-muted hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 card shadow-pop p-2 z-[70] animate-pop">
              <div className="px-3 py-3 border-b border-line mb-1">
                <p className="font-semibold text-fg truncate">{user?.name}</p>
                <p className="text-xs text-fg-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fg hover:bg-surface-2 transition-colors"
              >
                <Settings size={16} />
                Profile settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger-soft transition-colors"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
