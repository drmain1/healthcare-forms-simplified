import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { firebaseAuth } from '../../services/firebaseAuth';

console.log('API URL:', process.env.REACT_APP_API_URL);

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || '/api/v1',
  credentials: 'include', // Include cookies in requests
  prepareHeaders: async (headers) => {
    // Add Firebase/Google ID token if available
    const idToken = await firebaseAuth.getIdToken();
    if (idToken) {
      headers.set('Authorization', `Bearer ${idToken}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

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