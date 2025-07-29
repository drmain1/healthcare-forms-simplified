import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Divider,
  Avatar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as FormsIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

interface ModernSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ user }) => {
  const location = useLocation();
  // Permanently collapsed sidebar
  const isCollapsed = true;

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      color: '#3B82F6',
    },
    {
      title: 'Forms',
      icon: <FormsIcon />,
      path: '/forms',
      color: '#10B981',
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      color: '#6B7280',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box
      sx={{
        width: isCollapsed ? 80 : 280,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: '#3B82F6',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          EF
        </Box>
      </Box>

      {/* Create Form Button */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={!isCollapsed && <AddIcon />}
          component={Link}
          to="/forms/create"
          sx={{
            backgroundColor: '#3B82F6',
            color: 'white',
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#2563EB',
            },
            minWidth: isCollapsed ? 48 : 'auto',
          }}
        >
          {isCollapsed ? <AddIcon /> : 'Create New Form'}
        </Button>
      </Box>

      {/* Navigation Items */}
      <Stack spacing={0.5} sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <Tooltip
            key={item.path}
            title={isCollapsed ? item.title : ''}
            placement="right"
          >
            <Box
              component={Link}
              to={item.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                textDecoration: 'none',
                color: isActive(item.path) ? item.color : '#6B7280',
                backgroundColor: isActive(item.path) ? `${item.color}15` : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isActive(item.path) ? `${item.color}20` : '#F3F4F6',
                  color: isActive(item.path) ? item.color : '#374151',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                }}
              >
                {React.cloneElement(item.icon, {
                  sx: { fontSize: 24, color: 'inherit' },
                })}
              </Box>
              {!isCollapsed && (
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: isActive(item.path) ? 600 : 500,
                    color: 'inherit',
                  }}
                >
                  {item.title}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Stack>

      {/* User Section */}
      {user && (
        <>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#F9FAFB',
              }}
            >
              <Avatar
                src={user.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#3B82F6',
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              {!isCollapsed && (
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};