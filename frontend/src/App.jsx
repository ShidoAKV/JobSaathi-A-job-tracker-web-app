import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MyJobs from "./pages/MyJobs";
import ExploreJobs from "./pages/ExploreJobs";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Resume from "./pages/Resume";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from "./components/ProtectedRoute";
import { ROLES } from "./utils/auth";

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/jobs" element={<ExploreJobs />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
