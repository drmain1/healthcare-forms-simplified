import { ThunkAction } from '@reduxjs/toolkit';
import { Action } from 'redux';
import { RootState } from '../store.config';
import { logout } from '../slices/authSlice';
import { clearPatientData } from '../slices/patientSlice';

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
  // Future cleanup actions can be added here
};