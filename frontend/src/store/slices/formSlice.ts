import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Form, FormTemplate } from '../../types';

interface FormState {
  forms: Form[];
  templates: FormTemplate[];
  currentForm: Form | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string;
    category: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const initialState: FormState = {
  forms: [],
  templates: [],
  currentForm: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    category: 'all',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
};

const formSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setForms: (state, action: PayloadAction<Form[]>) => {
      state.forms = action.payload;
    },
    addForm: (state, action: PayloadAction<Form>) => {
      state.forms.unshift(action.payload);
    },
    updateForm: (state, action: PayloadAction<Form>) => {
      const index = state.forms.findIndex(form => form.id === action.payload.id);
      if (index !== -1) {
        state.forms[index] = action.payload;
      }
      if (state.currentForm?.id === action.payload.id) {
        state.currentForm = action.payload;
      }
    },
    removeForm: (state, action: PayloadAction<string>) => {
      state.forms = state.forms.filter(form => form.id !== action.payload);
      if (state.currentForm?.id === action.payload) {
        state.currentForm = null;
      }
    },
    setCurrentForm: (state, action: PayloadAction<Form | null>) => {
      state.currentForm = action.payload;
    },
    setTemplates: (state, action: PayloadAction<FormTemplate[]>) => {
      state.templates = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<FormState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<FormState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentForm: (state) => {
      state.currentForm = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setForms,
  addForm,
  updateForm,
  removeForm,
  setCurrentForm,
  setTemplates,
  setFilters,
  setPagination,
  clearCurrentForm,
} = formSlice.actions;

export default formSlice.reducer;