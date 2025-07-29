import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Organization } from '../../types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  organization: JSON.parse(localStorage.getItem('organization') || 'null'),
  isAuthenticated: false, // Will be set by checkAuth
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ 
      user: User; 
      organization: Organization; 
    }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.organization = action.payload.organization;
      state.isAuthenticated = true;
      state.error = null;
      
      // Only store non-sensitive user info
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('organization', JSON.stringify(action.payload.organization));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.organization = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
    },
    setAuthStatus: (state, action: PayloadAction<{ authenticated: boolean; user?: User }>) => {
      state.isAuthenticated = action.payload.authenticated;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setAuthStatus,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;