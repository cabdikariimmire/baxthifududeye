import axios from 'axios';

let tokenGetter = null;

export const setTokenGetter = (fn) => {
  tokenGetter = fn;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true, // Enables automatic cookie transmission
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Clerk bearer token to all outgoing API calls
api.interceptors.request.use(
  async (config) => {
    let token = null;
    if (tokenGetter && typeof tokenGetter === 'function') {
      try {
        token = await tokenGetter();
      } catch (err) {
        // Continue request even if token retrieval fails
        console.warn('Could not retrieve Clerk token for request:', err.message);
      }
    }

    // Fallback to localStorage auth_token if Clerk token is not available
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
