import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem('customerToken');
  const staffToken = localStorage.getItem('token');
  
  // Prioritize customerToken for /customer routes, otherwise use staffToken (or customerToken fallback)
  const token = (config.url && config.url.includes('/customer') && customerToken)
    ? customerToken
    : (staffToken || customerToken);

  const sessionId = localStorage.getItem('sessionId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (sessionId) config.headers['x-session-id'] = sessionId;
  return config;
});

export default api;
