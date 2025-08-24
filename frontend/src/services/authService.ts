import axios from 'axios';
import { setCSRFToken, clearCSRFToken, getCSRFToken } from '../utils/csrfToken';

const API_URL = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');

// --- Session Management ---
// Sessions are handled via httpOnly cookies - no client-side token management needed

// --- API Service ---

export const authService = {
  /**
   * Exchanges a Firebase ID token for a session cookie and CSRF token.
   */
  async sessionLogin(idToken: string): Promise<void> {
    const response = await axios.post(`${API_URL}/auth/session-login`, { idToken });
    const { csrfToken } = response.data;
    
    if (!csrfToken) {
      throw new Error('CSRF token not received from backend');
    }
    
    setCSRFToken(csrfToken);
    // Session cookie is automatically set by the browser via httpOnly cookie
  },

  /**
   * Logs the user out by calling backend logout endpoint and clearing local tokens.
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to clean up Redis sessions and CSRF tokens
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            'X-CSRF-Token': csrfToken
          }
        });
      }
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local cleanup:', error);
    } finally {
      // Clear CSRF token - session cookie will be cleared by backend
      clearCSRFToken();
    }
  },

  /**
   * Sets up an Axios interceptor to automatically add the
   * session token and CSRF token to all outgoing API requests.
   */
  setupInterceptor(): void {
    axios.interceptors.request.use(
      (config) => {
        // Session authentication handled automatically via httpOnly cookies
        // No need to add Authorization header - cookies are sent automatically
        
        // Add CSRF token for state-changing requests
        if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
          const csrfToken = getCSRFToken();
          if (csrfToken && config.headers) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
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