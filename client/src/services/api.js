import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://104.41.48.116:3000',
});

// Add request interceptor for authentication
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config);
    return config;
  },
  error => Promise.reject(error)
);

// Improved response interceptor with better logging
api.interceptors.response.use(
  response => {
    console.log(`API Response Success: ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.config.url}`, error.response.data);
      // Handle specific HTTP error codes
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden:', error.response.data);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error(`Error ${error.response.status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;