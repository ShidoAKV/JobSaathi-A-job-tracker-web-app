import api from "./api";

export const getAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const getAdminUsers = async (params = {}) => {
  const { data } = await api.get("/admin/users", { params });
  return data;
};

export const setUserRole = async (id, role) => {
  const { data } = await api.put(`/admin/users/${id}/role`, { role });
  return data;
};

export const handleRecruiterRequest = async (id, action) => {
  const { data } = await api.put(`/admin/users/${id}/recruiter-request`, { action });
  return data;
};

export const deleteUserAdmin = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

export const getAdminListings = async () => {
  const { data } = await api.get("/admin/listings");
  return data;
};

export const deleteListingAdmin = async (id) => {
  const { data } = await api.delete(`/admin/listings/${id}`);
  return data;
};
