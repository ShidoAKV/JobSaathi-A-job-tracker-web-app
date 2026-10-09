import api from "./api";

export const getJobs = async () => {
  const { data } = await api.get("/jobs");
  return data;
};

export const createJob = async (jobData) => {
  const { data } = await api.post("/jobs", jobData);
  return data;
};

export const updateJob = async (id, jobData) => {
  const { data } = await api.put(`/jobs/${id}`, jobData);
  return data;
};

export const deleteJob = async (id) => {
  const { data } = await api.delete(`/jobs/${id}`);
  return data;
};
