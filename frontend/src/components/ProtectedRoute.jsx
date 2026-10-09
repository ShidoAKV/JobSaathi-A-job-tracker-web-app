import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredUser, hasRole, isAuthenticated } from "../utils/auth";

export const ProtectedRoute = () => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/** Only renders children for the given roles; everyone else is sent to the dashboard. */
export const RoleRoute = ({ roles }) => {
  const user = getStoredUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, ...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
