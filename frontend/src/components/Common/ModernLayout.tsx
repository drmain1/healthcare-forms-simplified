import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { ModernSidebar } from '../Layout/ModernSidebar';

interface ModernLayoutProps {
  children: React.ReactNode;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if we're in form builder mode
  const isFormBuilder = location.pathname.includes('/forms/') && 
    (location.pathname.includes('/edit') || location.pathname.includes('/create'));

  // Mock user data - replace with actual auth data
  const user = {
    name: 'Admin User',
    email: 'admin@easydocforms.com',
  };

  // If in form builder mode, render without sidebar
  if (isFormBuilder) {
    return (
      <Box sx={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <CssBaseline />
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Modern Sidebar */}
      <ModernSidebar user={user} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};