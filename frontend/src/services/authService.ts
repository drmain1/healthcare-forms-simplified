import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// --- Token Management ---

const getSessionToken = (): string | null => {
  return localStorage.getItem('session_token');
};

const setSessionToken = (token: string): void => {
  localStorage.setItem('session_token', token);
};

const removeSessionToken = (): void => {
  localStorage.removeItem('session_token');
};

// --- API Service ---

export const authService = {
  /**
   * Exchanges a Firebase ID token for a short-lived session JWT.
   */
  async sessionLogin(idToken: string): Promise<string> {
    const response = await axios.post(`${API_URL}/auth/session-login`, { idToken });
    const { access_token } = response.data;
    if (!access_token) {
      throw new Error('Session token not received from backend');
    }
    setSessionToken(access_token);
    return access_token;
  },

  /**
   * Logs the user out by clearing the local session token.
   */
  logout(): void {
    removeSessionToken();
    // Optionally, notify the backend to invalidate the token if needed
  },

  /**
   * Sets up an Axios interceptor to automatically add the
   * session token to all outgoing API requests.
   */
  setupInterceptor(): void {
    axios.interceptors.request.use(
      (config) => {
        const token = getSessionToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  },
};

// --- Initialization ---

// Initialize the interceptor when the module is loaded
authService.setupInterceptor();