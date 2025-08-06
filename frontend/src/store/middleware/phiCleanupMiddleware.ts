import { Middleware, isAction, AnyAction } from '@reduxjs/toolkit';

const PHI_ACTIONS = [
  'navigation/navigateAway',
  'auth/logout',
  'ui/clearSensitiveData',
];

const PHI_CLEANUP_ROUTES = [
  '/patients',
  '/responses',
  '/forms/responses',
];

export const phiCleanupMiddleware: Middleware = (store) => (next) => (action) => {
  // Type guard to ensure action is a Redux action
  if (!isAction(action)) {
    return next(action);
  }
  
  const result = next(action);
  
  // Cast action to AnyAction for payload access
  const anyAction = action as AnyAction;
  
  // Check if we're navigating away from PHI-containing pages
  if (anyAction.type === '@@router/LOCATION_CHANGE') {
    const state = store.getState();
    const previousPath = (state as any).router?.location?.pathname || '';
    const newPath = anyAction.payload?.location?.pathname || '';
    
    // If navigating away from PHI pages, clear sensitive data
    if (PHI_CLEANUP_ROUTES.some(route => previousPath.includes(route)) && 
        !PHI_CLEANUP_ROUTES.some(route => newPath.includes(route))) {
      
      // Dispatch cleanup actions
      store.dispatch({ type: 'patient/clearPatientData' });
      store.dispatch({ type: 'response/clearResponseData' });
      
      // Log the cleanup for audit purposes
      store.dispatch({
        type: 'audit/logPhiCleanup',
        payload: {
          timestamp: new Date().toISOString(),
          previousPath,
          newPath,
          dataCleared: ['patients', 'responses']
        }
      });
    }
  }
  
  // Handle explicit cleanup actions
  if (PHI_ACTIONS.includes(anyAction.type)) {
    store.dispatch({ type: 'patient/clearPatientData' });
    store.dispatch({ type: 'response/clearResponseData' });
  }
  
  return result;
};

// Utility function to manually trigger PHI cleanup
export const clearAllPHI = () => {
  return {
    type: 'ui/clearSensitiveData',
    payload: {
      timestamp: new Date().toISOString(),
      reason: 'Manual PHI cleanup triggered'
    }
  };
};