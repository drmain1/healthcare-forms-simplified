import { Middleware, isAction } from '@reduxjs/toolkit';
import { encryptData, decryptData, containsPHI, initializeEncryption } from '../../utils/encryption';

// Initialize encryption on middleware load
initializeEncryption();

// Actions that contain PHI data
const PHI_ACTIONS = [
  'patients/setPatients',
  'patients/addPatient',
  'patients/updatePatient',
  'patients/setCurrentPatient',
  'responses/setResponses',
  'responses/addResponse',
  'responses/updateResponse',
  'responses/setCurrentResponse',
];

export const encryptionMiddleware: Middleware = (store) => (next) => (action) => {
  // Type guard to ensure action is a Redux action
  if (!isAction(action)) {
    return next(action);
  }
  
  // Create a properly typed action
  const typedAction = action as { type: string; payload?: any };
  
  // Check if action contains PHI
  if (PHI_ACTIONS.includes(typedAction.type) && typedAction.payload) {
    try {
      // Log that we're encrypting PHI
      console.log(`[HIPAA] Encrypting PHI data for action: ${typedAction.type}`);
      
      // Clone the action to avoid mutation
      const modifiedAction = { ...typedAction };
      
      // For arrays of data
      if (Array.isArray(typedAction.payload)) {
        modifiedAction.payload = typedAction.payload.map((item: any) => {
          if (containsPHI(item)) {
            return {
              ...item,
              _encrypted: true,
              _data: encryptData(item),
            };
          }
          return item;
        });
      } 
      // For single objects
      else if (typeof typedAction.payload === 'object' && containsPHI(typedAction.payload)) {
        modifiedAction.payload = {
          ...typedAction.payload,
          _encrypted: true,
          _data: encryptData(typedAction.payload),
        };
      }
      
      return next(modifiedAction);
    } catch (error) {
      console.error('[HIPAA] Encryption middleware error:', error);
    }
  }
  
  return next(action);
};

// Selector wrapper to decrypt data when accessing from store
export const createEncryptedSelector = <T>(
  selector: (state: any) => any
) => {
  return (state: any): T => {
    const data = selector(state);
    
    if (!data) return data;
    
    // Handle encrypted arrays
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item?._encrypted && item?._data) {
          try {
            return decryptData<T>(item._data);
          } catch (error) {
            console.error('[HIPAA] Decryption error in selector:', error);
            return item;
          }
        }
        return item;
      }) as T;
    }
    
    // Handle encrypted objects
    if (data?._encrypted && data?._data) {
      try {
        return decryptData<T>(data._data);
      } catch (error) {
        console.error('[HIPAA] Decryption error in selector:', error);
        return data;
      }
    }
    
    return data;
  };
};