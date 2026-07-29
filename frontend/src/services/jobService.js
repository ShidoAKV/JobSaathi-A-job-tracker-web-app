import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/jobs",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export const getJobs = async () => {
  const { data } = await API.get("/");
  return data;
};

export const createJob = async (jobData) => {
  const { data } = await API.post("/", jobData);
  return data;
};

export const updateJob = async (id, jobData) => {
  const { data } = await API.put(`/${id}`, jobData);
  return data;
};

export const deleteJob = async (id) => {
  const { data } = await API.delete(`/${id}`);
  return data;
};