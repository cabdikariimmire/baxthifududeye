import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true, // Enables automatic HttpOnly cookie transmission
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for consistent error unwrapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction
    const customMessage = error.response?.data?.message;
    if (customMessage) {
      error.friendlyMessage = customMessage;
    }
    return Promise.reject(error);
  }
);

export default api;
