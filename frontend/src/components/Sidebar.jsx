import {
  LayoutDashboard,
  Briefcase,
  Compass,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./ui/Logo";
import useAuthUser from "../hooks/useAuthUser";
import useUnreadMessages from "../hooks/useUnreadMessages";
import { clearSession, getInitials, isAdmin, roleLabel } from "../utils/auth";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-jobs", label: "My Applications", icon: Briefcase },
  { to: "/jobs", label: "Explore Jobs", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/resume", label: "Resume AI", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const user = useAuthUser();
  const unreadMessages = useUnreadMessages();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const renderLink = ({ to, label, icon: Icon, badge }) => (
    <NavLink
      key={to}
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge === "messages" && unreadMessages > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center">
          {unreadMessages > 99 ? "99+" : unreadMessages}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-72 bg-surface border-r border-line flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-line">
          <Logo showTagline />
          <button
            onClick={() => setSidebarOpen(false)}
            className="icon-btn w-9 h-9 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
            Workspace
          </p>
          {links.map(renderLink)}

          {isAdmin(user) && (
            <>
              <p className="px-3.5 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                Administration
              </p>
              {renderLink({ to: "/admin", label: "Admin", icon: ShieldCheck })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-line">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-fg-muted truncate">{roleLabel(user?.role)}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-fg-muted hover:text-danger transition-colors"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
