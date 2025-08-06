import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearPatientData } from '../store/slices/patientSlice';
import { clearResponseData } from '../store/slices/responseSlice';

interface UseJustInTimePHIOptions {
  clearOnUnmount?: boolean;
  clearDelay?: number;
  dataType?: 'patients' | 'responses' | 'both';
}

/**
 * Hook for just-in-time PHI fetching with automatic cleanup
 * Ensures PHI is only in memory when actively needed
 */
export const useJustInTimePHI = (
  fetchFunction: () => Promise<void>,
  dependencies: any[] = [],
  options: UseJustInTimePHIOptions = {}
) => {
  const {
    clearOnUnmount = true,
    clearDelay = 0,
    dataType = 'both'
  } = options;

  const dispatch = useDispatch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Clear PHI data based on type
  const clearPHI = useCallback(() => {
    console.log(`[HIPAA] Clearing PHI data: ${dataType}`);
    
    if (dataType === 'patients' || dataType === 'both') {
      dispatch(clearPatientData());
    }
    
    if (dataType === 'responses' || dataType === 'both') {
      dispatch(clearResponseData());
    }
  }, [dispatch, dataType]);

  // Fetch data with cleanup handling
  const fetchWithCleanup = useCallback(async () => {
    try {
      // Clear any pending cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Fetch the data
      await fetchFunction();
      
      // Schedule cleanup if delay is set
      if (clearDelay > 0 && isMountedRef.current) {
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            clearPHI();
          }
        }, clearDelay);
      }
    } catch (error) {
      console.error('[HIPAA] Error fetching PHI:', error);
      // Clear data on error for security
      clearPHI();
    }
  }, [fetchFunction, clearDelay, clearPHI]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchWithCleanup();
  }, [...dependencies, fetchWithCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clear PHI if requested
      if (clearOnUnmount) {
        clearPHI();
      }
    };
  }, [clearOnUnmount, clearPHI]);

  return {
    refetch: fetchWithCleanup,
    clearPHI
  };
};

/**
 * Hook for components that display PHI
 * Automatically clears PHI when component unmounts
 */
export const usePHIComponent = (dataType: 'patients' | 'responses' | 'both' = 'both') => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(`[HIPAA] PHI component mounted: ${dataType}`);
    
    return () => {
      console.log(`[HIPAA] PHI component unmounting, clearing ${dataType}`);
      
      if (dataType === 'patients' || dataType === 'both') {
        dispatch(clearPatientData());
      }
      
      if (dataType === 'responses' || dataType === 'both') {
        dispatch(clearResponseData());
      }
    };
  }, [dispatch, dataType]);
};

/**
 * Hook for temporary PHI access
 * Automatically clears data after specified duration
 */
export const useTemporaryPHI = (
  data: any,
  duration: number = 5 * 60 * 1000 // 5 minutes default
) => {
  const dispatch = useDispatch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (data) {
      console.log(`[HIPAA] Temporary PHI access granted for ${duration}ms`);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        
        dispatch(clearPatientData());
        dispatch(clearResponseData());
      }, duration);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, duration, dispatch]);
};