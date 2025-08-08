import { ThunkAction } from '@reduxjs/toolkit';
import { Action } from 'redux';
import { RootState } from '../store.config';
import { logout } from '../slices/authSlice';
import { clearPatientData } from '../slices/patientSlice';
import { firebaseAuth } from '../../services/firebaseAuth';

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
  
  // Sign out from Firebase to ensure auth state is cleared
  try {
    await firebaseAuth.signOut();
  } catch (error) {
    console.error('Failed to sign out from Firebase:', error);
  }
  
  // Clear session storage and local storage
  sessionStorage.clear();
  localStorage.clear();
};