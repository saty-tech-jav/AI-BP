import axios from 'axios';

// In production (Railway), uses REACT_APP_API_URL env variable
// In local development, falls back to proxy (/api → localhost:8080)
const API = axios.create({ 
  baseURL: 'https://ai-bp-production.up.railway.app/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

export const readingsAPI = {
  save: (data) => API.post('/readings', data),
  parseVoice: (text) => API.post('/readings/parse', { text }),
  voiceSave: (text) => API.post('/readings/voice-save', { text }),
  getAll: () => API.get('/readings/all'),
  getByRange: (range) => API.get(`/readings?range=${range}`),
  getGraph: (range) => API.get(`/readings/graph?range=${range}`),
  getSummary: (range) => API.get(`/readings/summary?range=${range}`),
  delete: (id) => API.delete(`/readings/${id}`),
};

export default API;
