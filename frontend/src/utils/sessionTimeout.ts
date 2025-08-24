import { store } from '../store';
import { fullLogout } from '../store/actions/authActions';
import { clearPatientData } from '../store/slices/patientSlice';
import { clearResponseData } from '../store/slices/responseSlice';
import { clearEncryptionKey } from './encryption';
import { clearCSRFToken } from './csrfToken';

const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
const VISIBILITY_EVENTS = ['visibilitychange', 'focus'];

let timeoutId: NodeJS.Timeout | null = null;
let warningTimeoutId: NodeJS.Timeout | null = null;
let lastActivity = Date.now();
let isWarningShown = false;
let sessionExpired = false;

// Callback for showing warning
let onWarningCallback: ((timeRemaining: number) => void) | null = null;

export const setWarningCallback = (callback: (timeRemaining: number) => void) => {
  onWarningCallback = callback;
};

// Clear all PHI and log out user
const handleTimeout = () => {
  sessionExpired = true;
  
  // Clear all PHI from Redux
  store.dispatch(clearPatientData());
  store.dispatch(clearResponseData());
  
  // Clear encryption keys and CSRF tokens
  clearEncryptionKey();
  clearCSRFToken();
  
  // Log out the user
  store.dispatch(fullLogout() as any); // Use `as any` because store.dispatch is not typed for thunks here
  
  // Force reload to clear any cached state
  window.location.href = '/login';
};

// Show warning before timeout
const showWarning = () => {
  if (!isWarningShown) {
    isWarningShown = true;
    const timeRemaining = Math.floor((TIMEOUT_DURATION - WARNING_DURATION) / 1000);
    
    if (onWarningCallback) {
      onWarningCallback(timeRemaining);
    } else {
      // Fallback to browser confirm
      const shouldContinue = window.confirm(
        `Your session will expire in ${timeRemaining} seconds due to inactivity. ` +
        `Click OK to continue working or Cancel to log out now.`
      );
      
      if (shouldContinue) {
        resetTimeout();
      } else {
        handleTimeout();
      }
    }
  }
};

// Reset the timeout on user activity
export const resetTimeout = () => {
  // Don't reset if session already expired
  if (sessionExpired) {
    return;
  }
  
  lastActivity = Date.now();
  isWarningShown = false;
  
  // Clear existing timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
  }
  
  // Set warning timeout
  warningTimeoutId = setTimeout(() => {
    showWarning();
  }, TIMEOUT_DURATION - WARNING_DURATION);
  
  // Set final timeout
  timeoutId = setTimeout(() => {
    handleTimeout();
  }, TIMEOUT_DURATION);
};

// Track user activity
const handleActivity = () => {
  const now = Date.now();
  
  // Only reset if it's been at least 1 second since last activity
  // This prevents excessive resets
  if (now - lastActivity > 1000 && !sessionExpired) {
    resetTimeout();
  }
};

// Check session validity on visibility change
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && !sessionExpired) {
    const now = Date.now();
    const elapsed = now - lastActivity;
    
    // If more time has passed than the timeout duration, session expired
    if (elapsed >= TIMEOUT_DURATION) {
      console.log('Session expired while app was in background');
      handleTimeout();
    } else if (elapsed >= TIMEOUT_DURATION - WARNING_DURATION) {
      // Show warning if in warning period
      showWarning();
    } else {
      // Resume normal timeout
      resetTimeout();
    }
  }
};

// Initialize session timeout monitoring
export const initializeSessionTimeout = () => {
  sessionExpired = false;
  
  // Add event listeners for user activity
  ACTIVITY_EVENTS.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Add visibility change listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);
  
  // Start the timeout
  resetTimeout();
};

// Cleanup function
export const cleanupSessionTimeout = () => {
  // Remove event listeners
  ACTIVITY_EVENTS.forEach(event => {
    document.removeEventListener(event, handleActivity);
  });
  
  // Remove visibility change listeners
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleVisibilityChange);
  
  // Clear timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
    warningTimeoutId = null;
  }
};

// Get remaining time in seconds
export const getRemainingTime = (): number => {
  const elapsed = Date.now() - lastActivity;
  const remaining = Math.max(0, TIMEOUT_DURATION - elapsed);
  return Math.floor(remaining / 1000);
};

// Check if warning should be shown
export const shouldShowWarning = (): boolean => {
  const elapsed = Date.now() - lastActivity;
  return elapsed >= (TIMEOUT_DURATION - WARNING_DURATION) && !isWarningShown;
};

// Check if session is expired
export const isSessionExpired = (): boolean => {
  return sessionExpired;
};