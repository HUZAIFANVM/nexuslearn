import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // AI usage cap hit → broadcast so a global, graceful dialog can show
    // (instead of every page handling the 429 on its own).
    const detail = error.response?.data?.detail;
    if (error.response?.status === 429 && detail && detail.code === 'ai_quota_exceeded') {
      window.dispatchEvent(new CustomEvent('ai-limit-reached', { detail }));
    }
    return Promise.reject(error);
  }
);

export default client;
