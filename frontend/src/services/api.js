import axios from "axios";
import toast from "react-hot-toast";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hadToken = Boolean(localStorage.getItem("token"));

    // Rate limited: surface the server's message once instead of a generic failure.
    if (status === 429) {
      const retry = error.response?.data?.retryAfterSeconds;
      const msg = error.response?.data?.message || "Too many requests. Please slow down.";
      toast.error(retry ? `${msg} (retry in ~${Math.ceil(retry / 60)} min)` : msg, { id: "rate-limit" });
    }

    // Expired / invalid session: clear and send the user back to login.
    if (status === 401 && hadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
