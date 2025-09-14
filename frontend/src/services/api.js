import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Agent API
export const agentAPI = {
  getTemplates: () => api.get('/agent/templates'),
  getProviders: () => api.get('/agent/providers'),
  create: (data) => api.post('/agent/create', data),
  list: () => api.get('/agent/list'),
  get: (id) => api.get(`/agent/${id}`),
  update: (id, data) => api.put(`/agent/${id}`, data),
  delete: (id) => api.delete(`/agent/${id}`)
};

// Call API
export const callAPI = {
  start: (data) => api.post('/call/start', data),
  batch: (data) => api.post('/call/batch', data),
  getStatus: (id) => api.get(`/call/status/${id}`),
  list: (params) => api.get('/call/list', { params }),
  end: (id) => api.post(`/call/${id}/end`)
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getTranscripts: (params) => api.get('/analytics/transcripts', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params })
};

// Knowledge Base API
export const knowledgeAPI = {
  list: () => api.get('/knowledge/list'),
  create: (data) => api.post('/knowledge/create', data),
  upload: (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/knowledge/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/knowledge/${id}`),
  search: (id, query) => api.get(`/knowledge/${id}/search?q=${query}`)
};

// Integrations API
export const integrationsAPI = {
  list: () => api.get('/integrations/list'),
  configure: (id, config) => api.post(`/integrations/${id}/configure`, config),
  disconnect: (id) => api.post(`/integrations/${id}/disconnect`)
};

// Call History API
export const callHistoryAPI = {
  list: () => api.get('/call-history/list'),
  save: (data) => api.post('/call-history/save', data),
  get: (id) => api.get(`/call-history/${id}`)
};

// Test API
export const testAPI = {
  testLLM: (data) => api.post('/test/llm', data),
  testTTS: (data) => api.post('/test/tts', data),
  testASR: (data) => api.post('/test/asr', data),
  getProviders: () => api.get('/test/providers')
};

// Conversation API
export const conversationAPI = {
  chat: (data) => api.post('/conversation/chat', data),
  voicePreview: (data) => api.post('/conversation/voice-preview', data, { responseType: 'blob' })
};

export default api;