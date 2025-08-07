import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import formSlice from './slices/formSlice';
import responseSlice from './slices/responseSlice';
import patientSlice from './slices/patientSlice';
import uiSlice from './slices/uiSlice';
import { baseApi } from './api/baseApi';
import { organizationsApi } from './api/organizationsApi';
import { phiCleanupMiddleware } from './middleware/phiCleanupMiddleware';
import { encryptionMiddleware } from './middleware/encryptionMiddleware';

export const createStore = () => {
  const store = configureStore({
    reducer: {
      auth: authSlice,
      forms: formSlice,
      responses: responseSlice,
      patients: patientSlice,
      ui: uiSlice,
      [baseApi.reducerPath]: baseApi.reducer,
      [organizationsApi.reducerPath]: organizationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'audit/logPhiCleanup'],
        },
      })
      .concat(baseApi.middleware)
      .concat(organizationsApi.middleware)
      .concat(phiCleanupMiddleware)
      .concat(encryptionMiddleware),
  });

  setupListeners(store.dispatch);

  return store;
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];