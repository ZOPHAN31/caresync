import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: attach auth token if present
api.interceptors.request.use((config) => {
  // Token will be set by NextAuth session in Phase 3
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login in Phase 3
      console.warn('Unauthorized — redirect to login');
    }
    return Promise.reject(error);
  }
);

export default api;
