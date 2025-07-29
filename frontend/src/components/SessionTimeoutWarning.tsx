import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, LinearProgress } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { setWarningCallback, resetTimeout, getRemainingTime } from '../utils/sessionTimeout';

const SessionTimeoutWarning: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Set up the warning callback
    setWarningCallback((time) => {
      setTimeRemaining(time);
      setOpen(true);
    });

    // Update remaining time every second when dialog is open
    let intervalId: NodeJS.Timeout | null = null;
    
    if (open) {
      intervalId = setInterval(() => {
        const remaining = getRemainingTime();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setOpen(false);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [open]);

  const handleContinue = () => {
    resetTimeout();
    setOpen(false);
  };

  const handleLogout = () => {
    // The timeout handler will handle the logout
    setOpen(false);
  };

  const progress = (timeRemaining / 120) * 100; // 120 seconds = 2 minutes warning

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      aria-labelledby="session-timeout-dialog"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="session-timeout-dialog" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session will expire in <strong>{timeRemaining} seconds</strong> due to inactivity.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          For HIPAA compliance, sessions automatically expire after 15 minutes of inactivity to protect patient data.
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mt: 2, mb: 1 }}
          color={timeRemaining < 30 ? 'error' : 'warning'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogout} color="inherit">
          Log Out Now
        </Button>
        <Button onClick={handleContinue} variant="contained" color="primary" autoFocus>
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutWarning;