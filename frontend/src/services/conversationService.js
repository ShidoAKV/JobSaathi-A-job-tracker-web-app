import api from "./api";

export const startConversation = async (listingId) => {
  const { data } = await api.post("/conversations", { listingId });
  return data;
};

export const getConversations = async () => {
  const { data } = await api.get("/conversations");
  return data;
};

export const getMessages = async (conversationId, after) => {
  const { data } = await api.get(`/conversations/${conversationId}/messages`, {
    params: after ? { after } : undefined,
  });
  return data;
};

export const sendMessage = async (conversationId, text) => {
  const { data } = await api.post(
    `/conversations/${conversationId}/messages`,
    { text }
  );
  return data;
};
