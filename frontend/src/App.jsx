import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import MyJobs from "./pages/MyJobs";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <Routes>
      {/* Auth Pages */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard Layout */}
      <Route element={<DashboardLayout />}>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/my-jobs" element={<MyJobs />} />

        <Route path="/analytics" element={<Analytics />} />

        <Route path="/settings" element={<Settings />} />

      </Route>

    </Routes>
  );
}

export default App;