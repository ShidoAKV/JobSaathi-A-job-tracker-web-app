export const ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
};

export const getToken = () => localStorage.getItem("token");

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("jobsaathi:auth"));
};

export const updateStoredUser = (partial) => {
  const current = getStoredUser() || {};
  localStorage.setItem("user", JSON.stringify({ ...current, ...partial }));
  window.dispatchEvent(new Event("jobsaathi:auth"));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("jobsaathi:auth"));
};

export const isAuthenticated = () => Boolean(getToken());

export const hasRole = (user, ...roles) => Boolean(user && roles.includes(user.role));
export const isAdmin = (user) => hasRole(user, ROLES.ADMIN);
export const canPostJobs = (user) => hasRole(user, ROLES.RECRUITER, ROLES.ADMIN);

export const roleLabel = (role) =>
  ({ candidate: "Job seeker", recruiter: "Employer", admin: "Admin" })[role] || "Member";

export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
