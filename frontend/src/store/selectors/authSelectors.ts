import { RootState } from '../store.config';

export const selectUser = (state: RootState) => state.auth.user;
export const selectOrganization = (state: RootState) => state.auth.organization;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;