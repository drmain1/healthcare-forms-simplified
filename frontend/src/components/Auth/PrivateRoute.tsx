import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { isSessionExpired } from '../../utils/sessionTimeout';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user, loading } = useFirebaseAuth();

  useEffect(() => {
    // Check session validity on every route change
    if (isSessionExpired()) {
      window.location.href = '/login';
    }
  }, [location]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || isSessionExpired()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};