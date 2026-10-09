import api from "./api";

export const getListings = async (params = {}) => {
  const { data } = await api.get("/listings", { params });
  return data;
};

export const getMyListings = async () => {
  const { data } = await api.get("/listings/mine");
  return data;
};

export const getListing = async (id) => {
  const { data } = await api.get(`/listings/${id}`);
  return data;
};

export const createListing = async (payload) => {
  const { data } = await api.post("/listings", payload);
  return data;
};

export const deleteListing = async (id) => {
  const { data } = await api.delete(`/listings/${id}`);
  return data;
};
