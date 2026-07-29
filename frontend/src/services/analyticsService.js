import api from "./api";

export const getAnalytics = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/analytics", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};