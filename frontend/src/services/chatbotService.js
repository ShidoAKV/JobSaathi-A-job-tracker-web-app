import api from "./api";

export const askChatbot = async (message, history = []) => {
  const { data } = await api.post("/chatbot/ask", { message, history });
  return data;
};

export const getAiStatus = async () => {
  const { data } = await api.get("/chatbot/status");
  return data.ai;
};
