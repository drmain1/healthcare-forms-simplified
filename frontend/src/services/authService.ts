import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

// Get CSRF token on app initialization
let csrfToken: string | null = null;

export const initializeAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/csrf/`);
    csrfToken = response.data.csrfToken;
    // Set default header for all requests
    axios.defaults.headers.common['X-CSRFToken'] = csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }
};

export const authService = {
  async login(username: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login/`, {
      username,
      password,
    });
    
    // No need to store tokens - they're in httpOnly cookies
    return response.data;
  },

  async logout() {
    await axios.post(`${API_URL}/auth/logout/`);
    // Clear any local state if needed
  },

  async refreshToken() {
    try {
      await axios.post(`${API_URL}/auth/refresh/`);
      return true;
    } catch (error) {
      return false;
    }
  },

  async checkAuth() {
    try {
      const response = await axios.get(`${API_URL}/auth/check/`);
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  },

  // Set up axios interceptor for token refresh
  setupInterceptor() {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await this.refreshToken();
          if (refreshed) {
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  },
};

// Initialize auth on module load
// Disabled - using Firebase Auth instead
// initializeAuth();
// authService.setupInterceptor();