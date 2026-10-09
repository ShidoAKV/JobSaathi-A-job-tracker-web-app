import api from "./api";

/** Upload a PDF + job description → creates a draft and returns the match analysis. */
export const analyzeResume = async (file, jobDescription, title) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);
  if (title) formData.append("title", title);

  const { data } = await api.post("/resume/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return data; // { message, draftId, title, resumeText, analysis }
};

export const listDrafts = async () => {
  const { data } = await api.get("/resume/drafts");
  return data;
};

export const getDraft = async (id) => {
  const { data } = await api.get(`/resume/drafts/${id}`);
  return data;
};

export const updateDraft = async (id, payload) => {
  const { data } = await api.put(`/resume/drafts/${id}`, payload);
  return data;
};

export const deleteDraft = async (id) => {
  const { data } = await api.delete(`/resume/drafts/${id}`);
  return data;
};

export const reanalyzeDraft = async (id, text) => {
  const { data } = await api.post(`/resume/drafts/${id}/analyze`, { text }, { timeout: 120000 });
  return data; // { analysis, cached }
};

export const proofreadDraft = async (id, text) => {
  const { data } = await api.post(`/resume/drafts/${id}/proofread`, { text }, { timeout: 180000 });
  return data; // { proofread, cached }
};
