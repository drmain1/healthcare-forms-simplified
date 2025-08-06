import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FormResponse } from '../../types';

interface ResponseState {
  responses: FormResponse[];
  currentResponse: FormResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    formId: string;
    patientId: string;
    dateFrom: string;
    dateTo: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  analytics: {
    totalResponses: number;
    completedResponses: number;
    completionRate: number;
    averageTime: number;
  };
}

const initialState: ResponseState = {
  responses: [],
  currentResponse: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    formId: '',
    patientId: '',
    dateFrom: '',
    dateTo: '',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  analytics: {
    totalResponses: 0,
    completedResponses: 0,
    completionRate: 0,
    averageTime: 0,
  },
};

const responseSlice = createSlice({
  name: 'responses',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setResponses: (state, action: PayloadAction<FormResponse[]>) => {
      state.responses = action.payload;
    },
    addResponse: (state, action: PayloadAction<FormResponse>) => {
      state.responses.unshift(action.payload);
    },
    updateResponse: (state, action: PayloadAction<FormResponse>) => {
      const index = state.responses.findIndex(response => response.id === action.payload.id);
      if (index !== -1) {
        state.responses[index] = action.payload;
      }
      if (state.currentResponse?.id === action.payload.id) {
        state.currentResponse = action.payload;
      }
    },
    removeResponse: (state, action: PayloadAction<string>) => {
      state.responses = state.responses.filter(response => response.id !== action.payload);
      if (state.currentResponse?.id === action.payload) {
        state.currentResponse = null;
      }
    },
    setCurrentResponse: (state, action: PayloadAction<FormResponse | null>) => {
      state.currentResponse = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ResponseState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<ResponseState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setAnalytics: (state, action: PayloadAction<Partial<ResponseState['analytics']>>) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
    clearCurrentResponse: (state) => {
      state.currentResponse = null;
    },
    clearResponseData: (state) => {
      // Complete PHI cleanup for HIPAA compliance
      state.responses = [];
      state.currentResponse = null;
      state.error = null;
      // Reset analytics that might contain PHI
      state.analytics = {
        totalResponses: 0,
        completedResponses: 0,
        completionRate: 0,
        averageTime: 0,
      };
      state.pagination.total = 0;
    },
  },
});

export const {
  setLoading,
  setError,
  setResponses,
  addResponse,
  updateResponse,
  removeResponse,
  setCurrentResponse,
  setFilters,
  setPagination,
  setAnalytics,
  clearCurrentResponse,
  clearResponseData,
} = responseSlice.actions;

export default responseSlice.reducer;