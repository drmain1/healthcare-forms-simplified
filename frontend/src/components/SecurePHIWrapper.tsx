import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { Lock, Visibility } from '@mui/icons-material';
import { usePHIComponent } from '../hooks/useJustInTimePHI';

interface SecurePHIWrapperProps {
  children: React.ReactNode;
  dataType?: 'patients' | 'responses' | 'both';
  requireConfirmation?: boolean;
  confirmationMessage?: string;
  autoHideAfter?: number; // milliseconds
  onAccess?: () => void;
  onHide?: () => void;
}

/**
 * Wrapper component that adds security controls around PHI display
 * Requires user confirmation and provides auto-hide functionality
 */
const SecurePHIWrapper: React.FC<SecurePHIWrapperProps> = ({
  children,
  dataType = 'both',
  requireConfirmation = true,
  confirmationMessage = 'This section contains Protected Health Information (PHI). Click to view.',
  autoHideAfter,
  onAccess,
  onHide,
}) => {
  const [isVisible, setIsVisible] = useState(!requireConfirmation);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Use PHI component hook for automatic cleanup
  usePHIComponent(dataType);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    if (isVisible && autoHideAfter) {
      const endTime = Date.now() + autoHideAfter;
      
      // Update countdown every second
      intervalId = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining === 0) {
          handleHide();
        }
      }, 1000);

      // Set timeout for auto-hide
      timeoutId = setTimeout(() => {
        handleHide();
      }, autoHideAfter);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, autoHideAfter]);

  const handleShow = () => {
    setIsVisible(true);
    onAccess?.();
    
    if (autoHideAfter) {
      setTimeRemaining(Math.ceil(autoHideAfter / 1000));
    }
  };

  const handleHide = () => {
    setIsVisible(false);
    setTimeRemaining(null);
    onHide?.();
  };

  if (!isVisible) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
        }}
      >
        <Lock sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Protected Health Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {confirmationMessage}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={handleShow}
          size="large"
        >
          View PHI
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {timeRemaining !== null && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2">
            PHI will be hidden in {timeRemaining} seconds for security
          </Typography>
          <Button size="small" onClick={handleHide}>
            Hide Now
          </Button>
        </Alert>
      )}
      
      <Box sx={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s' }}>
        {children}
      </Box>
      
      {!requireConfirmation && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Lock />}
          onClick={handleHide}
          sx={{ mt: 2 }}
        >
          Hide PHI
        </Button>
      )}
    </Box>
  );
};

export default SecurePHIWrapper;

/**
 * HOC version for wrapping existing components
 */
export const withSecurePHI = <P extends object>(
  Component: React.ComponentType<P>,
  wrapperProps?: Omit<SecurePHIWrapperProps, 'children'>
) => {
  return (props: P) => (
    <SecurePHIWrapper {...wrapperProps}>
      <Component {...props} />
    </SecurePHIWrapper>
  );
};