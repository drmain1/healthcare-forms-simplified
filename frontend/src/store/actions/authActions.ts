import { ThunkAction } from '@reduxjs/toolkit';
import { Action } from 'redux';
import { RootState } from '../store.config';
import { logout } from '../slices/authSlice';
import { clearPatientData } from '../slices/patientSlice';
import { firebaseAuth } from '../../services/firebaseAuth';
import { authService } from '../../services/authService';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const fullLogout = (): AppThunk => async (dispatch) => {
  // Dispatch all cleanup actions for a secure logout
  dispatch(clearPatientData());
  dispatch(logout());
  
  // Call backend logout to clean up Redis sessions and CSRF tokens
  try {
    await authService.logout();
  } catch (error) {
    console.error('Failed to logout from backend:', error);
  }
  
  // Sign out from Firebase to ensure auth state is cleared
  try {
    await firebaseAuth.signOut();
  } catch (error) {
    console.error('Failed to sign out from Firebase:', error);
  }
  
  // Clear session storage and local storage (redundant but safe)
  sessionStorage.clear();
  localStorage.clear();
};