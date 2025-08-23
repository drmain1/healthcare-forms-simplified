import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import { AppRoutes } from './components/Routes';

import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import { initializeSessionTimeout, cleanupSessionTimeout } from './utils/sessionTimeout';
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext';
import { logBuildInfo } from './config/buildInfo';
import { fetchCSRFToken } from './utils/csrfToken';
import debugLogger from './utils/debugLogger';

// Import SurveyJS CSS
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';

// Apply SurveyJS license key
import { setLicenseKey } from 'survey-core';
const licenseKey = process.env.REACT_APP_SURVEYJS_LICENSE_KEY;
if (licenseKey) {
  setLicenseKey(licenseKey);
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const AppContent = () => {
  const { loading } = useFirebaseAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <AppRoutes />
      <SessionTimeoutWarning />
    </>
  );
};

function App() {
  useEffect(() => {
    // Debug log to verify app is running
    debugLogger.info('[App] Application started', { cookies: document.cookie });
    
    // Log build information to console
    logBuildInfo();
    
    // Initialize CSRF token on app startup
    fetchCSRFToken().then(token => {
      if (token) {
        debugLogger.info('[App] CSRF token initialized successfully');
      } else {
        debugLogger.warn('[App] Failed to initialize CSRF token');
      }
    }).catch(err => {
      debugLogger.error('[App] Error initializing CSRF token', err);
    });
    
    // Initialize session timeout when app loads
    initializeSessionTimeout();
    
    // Cleanup on unmount
    return () => {
      cleanupSessionTimeout();
    };
  }, []);

  return (
    <Provider store={store}>
      <FirebaseAuthProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AppContent />
          </ThemeProvider>
        </BrowserRouter>
      </FirebaseAuthProvider>
    </Provider>
  );
}

export default App;