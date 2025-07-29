import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { clearPatientData } from '../store/slices/patientSlice';
import { clearResponseData } from '../store/slices/responseSlice';
import { clearEncryptionKey } from './encryption';

const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

let timeoutId: NodeJS.Timeout | null = null;
let warningTimeoutId: NodeJS.Timeout | null = null;
let lastActivity = Date.now();
let isWarningShown = false;

// Callback for showing warning
let onWarningCallback: ((timeRemaining: number) => void) | null = null;

export const setWarningCallback = (callback: (timeRemaining: number) => void) => {
  onWarningCallback = callback;
};

// Clear all PHI and log out user
const handleTimeout = () => {
  console.log('[HIPAA] Session timeout - clearing all PHI and logging out');
  
  // Clear all PHI from Redux
  store.dispatch(clearPatientData());
  store.dispatch(clearResponseData());
  
  // Clear encryption keys
  clearEncryptionKey();
  
  // Log out the user
  store.dispatch(logout());
  
  // Redirect to login
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
  if (now - lastActivity > 1000) {
    resetTimeout();
  }
};

// Initialize session timeout monitoring
export const initializeSessionTimeout = () => {
  // Add event listeners for user activity
  ACTIVITY_EVENTS.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Start the timeout
  resetTimeout();
  
  console.log('[HIPAA] Session timeout initialized (15 minutes)');
};

// Cleanup function
export const cleanupSessionTimeout = () => {
  // Remove event listeners
  ACTIVITY_EVENTS.forEach(event => {
    document.removeEventListener(event, handleActivity);
  });
  
  // Clear timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
    warningTimeoutId = null;
  }
  
  console.log('[HIPAA] Session timeout cleanup completed');
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