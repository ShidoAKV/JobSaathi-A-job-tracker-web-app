import api from "./api";

export const getProfile = async () => {
  const { data } = await api.get("/user/profile");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/user/profile", payload);
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await api.put("/user/password", payload);
  return data;
};

export const requestRecruiterAccess = async (company) => {
  const { data } = await api.post("/user/request-recruiter", { company });
  return data;
};
