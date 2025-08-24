import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { firebaseAuth } from '../../services/firebaseAuth';
import { getCSRFToken, setCSRFToken } from '../../utils/csrfToken';
import debugLogger from '../../utils/debugLogger';



const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || '/api'),
  credentials: 'include', // Include cookies in requests
  prepareHeaders: async (headers) => {
    // Add Firebase/Google ID token if available
    const idToken = await firebaseAuth.getIdToken();
    if (idToken) {
      headers.set('Authorization', `Bearer ${idToken}`);
    }
    
    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    debugLogger.debug('[BaseAPI] CSRF Token check', { 
      hasToken: !!csrfToken, 
      allCookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
    });
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
      debugLogger.debug('[BaseAPI] Added CSRF token to headers');
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // CSRF Migration: Check for generated CSRF token in response headers
  if (result.meta?.response?.headers) {
    const generatedToken = result.meta.response.headers.get('X-CSRF-Token-Generated');
    if (generatedToken) {
      debugLogger.info('[BaseAPI] Received generated CSRF token from backend migration');
      setCSRFToken(generatedToken);
    }
  }

  if (result.error && result.error.status === 401) {
    // With Firebase auth, we don't need to refresh tokens
    // The Firebase SDK handles token refresh automatically
    // Just dispatch logout action for Redux state
    api.dispatch({ type: 'auth/logout' });
    
    // Don't automatically redirect - let PrivateRoute handle it
    // This prevents redirect loops
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Organization', 
    'Form',
    'FormTemplate',
    'Patient',
    'Response',
    'Distribution',
    'Analytics'
  ],
  endpoints: () => ({}),
});

export default baseApi;