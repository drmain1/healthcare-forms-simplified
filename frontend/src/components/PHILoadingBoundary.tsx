import React, { Suspense, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { clearPatientData } from '../store/slices/patientSlice';
import { clearResponseData } from '../store/slices/responseSlice';

interface PHILoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  clearOnError?: boolean;
}

/**
 * Error boundary specifically for PHI components
 * Clears PHI data on error to prevent data leakage
 */
class PHIErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[HIPAA] PHI component error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Protected Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For security reasons, the data has been cleared. Please refresh the page.
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading boundary for PHI components with automatic cleanup
 */
const PHILoadingBoundary: React.FC<PHILoadingBoundaryProps> = ({
  children,
  fallback,
  clearOnError = true,
}) => {
  const dispatch = useDispatch();

  const handleError = (error: Error) => {
    if (clearOnError) {
      console.log('[HIPAA] Clearing PHI due to component error');
      dispatch(clearPatientData());
      dispatch(clearResponseData());
    }
  };

  const defaultFallback = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 4,
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading protected information...
      </Typography>
    </Box>
  );

  return (
    <PHIErrorBoundary onError={handleError}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </PHIErrorBoundary>
  );
};

export default PHILoadingBoundary;