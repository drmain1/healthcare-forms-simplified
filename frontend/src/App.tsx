import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import { AppRoutes } from './components/Routes';
import { AuthInitializer } from './components/Auth/AuthInitializer';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import { initializeSessionTimeout, cleanupSessionTimeout } from './utils/sessionTimeout';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { logBuildInfo } from './config/buildInfo';

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

function App() {
  useEffect(() => {
    // Log build information to console
    logBuildInfo();
    
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
          <AuthInitializer>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <AppRoutes />
              <SessionTimeoutWarning />
            </ThemeProvider>
          </AuthInitializer>
        </BrowserRouter>
      </FirebaseAuthProvider>
    </Provider>
  );
}

export default App;