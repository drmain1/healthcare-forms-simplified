import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Patient } from '../../types';

interface PatientState {
  patients: Patient[];
  currentPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    isActive: boolean | null;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const initialState: PatientState = {
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    isActive: null,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      state.patients = action.payload;
    },
    addPatient: (state, action: PayloadAction<Patient>) => {
      state.patients.unshift(action.payload);
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const index = state.patients.findIndex(patient => patient.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
      if (state.currentPatient?.id === action.payload.id) {
        state.currentPatient = action.payload;
      }
    },
    removePatient: (state, action: PayloadAction<string>) => {
      state.patients = state.patients.filter(patient => patient.id !== action.payload);
      if (state.currentPatient?.id === action.payload) {
        state.currentPatient = null;
      }
    },
    setCurrentPatient: (state, action: PayloadAction<Patient | null>) => {
      state.currentPatient = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<PatientState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<PatientState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    clearPatientData: (state) => {
      // Complete PHI cleanup for HIPAA compliance
      state.patients = [];
      state.currentPatient = null;
      state.error = null;
      // Reset pagination but keep filters for UX
      state.pagination.total = 0;
      console.log('[HIPAA] Patient data cleared from memory');
    },
  },
});

export const {
  setLoading,
  setError,
  setPatients,
  addPatient,
  updatePatient,
  removePatient,
  setCurrentPatient,
  setFilters,
  setPagination,
  clearCurrentPatient,
  clearPatientData,
} = patientSlice.actions;

export default patientSlice.reducer;