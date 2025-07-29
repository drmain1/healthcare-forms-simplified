import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  InputBase,
  Grid,
  Avatar,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Description as FormIcon,
  Edit as EditIcon,
  FileCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface FormCardProps {
  title: string;
  submissions: number;
  lastSubmission: string;
  status: 'active' | 'draft' | 'archived';
  completionRate: number;
  responseTime: string;
}

const FormCard: React.FC<FormCardProps> = ({
  title,
  submissions,
  lastSubmission,
  status,
  completionRate,
  responseTime,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const statusColors = {
    active: { bg: '#DEF7EC', text: '#065F46' },
    draft: { bg: '#E0E7FF', text: '#3730A3' },
    archived: { bg: '#F3F4F6', text: '#6B7280' },
  };

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        border: 'none',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              backgroundColor: '#EBF5FF',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FormIcon sx={{ color: '#3B82F6' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
              {title}
            </Typography>
            <Chip
              label={status}
              size="small"
              sx={{
                mt: 0.5,
                backgroundColor: statusColors[status].bg,
                color: statusColors[status].text,
                fontSize: '0.75rem',
                height: 24,
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 16, color: '#6B7280' }} />
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {submissions} submissions
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: '#6B7280' }} />
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Avg. {responseTime}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Completion rate
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1F2937' }}>
            {completionRate}%
          </Typography>
        </Box>
        <Box
          sx={{
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${completionRate}%`,
              backgroundColor: '#3B82F6',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
        Last submission: {lastSubmission}
      </Typography>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            mt: 1,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ViewIcon sx={{ mr: 2, fontSize: 20 }} /> View Submissions
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 2, fontSize: 20 }} /> Edit Form
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DuplicateIcon sx={{ mr: 2, fontSize: 20 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 2, fontSize: 20 }} /> Export Data
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: '#EF4444' }}>
          <DeleteIcon sx={{ mr: 2, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export const ModernFormsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const forms = [
    {
      title: 'UI getting better',
      submissions: 2,
      lastSubmission: '2 hours ago',
      status: 'active' as const,
      completionRate: 100,
      responseTime: '5 min',
    },
    {
      title: 'Patient Information Form',
      submissions: 3,
      lastSubmission: '5 hours ago',
      status: 'active' as const,
      completionRate: 67,
      responseTime: '8 min',
    },
    {
      title: 'Medical History Form',
      submissions: 0,
      lastSubmission: 'Never',
      status: 'draft' as const,
      completionRate: 0,
      responseTime: 'N/A',
    },
  ];

  return (
    <Box sx={{ backgroundColor: '#F9FAFB', minHeight: '100vh', p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
              Your Forms
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Create and manage your digital forms
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#3B82F6',
              textTransform: 'none',
              px: 3,
              py: 1.5,
              '&:hover': {
                backgroundColor: '#2563EB',
              },
            }}
          >
            Create New Form
          </Button>
        </Box>

        {/* Search Bar */}
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            maxWidth: 500,
          }}
        >
          <SearchIcon sx={{ color: '#9CA3AF', mr: 2 }} />
          <InputBase
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Paper>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#3B82F6', mb: 0.5 }}>
              6
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Total Forms
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#10B981', mb: 0.5 }}>
              5
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Total Submissions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#F59E0B', mb: 0.5 }}>
              83%
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Avg. Completion
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#8B5CF6', mb: 0.5 }}>
              6.5m
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Avg. Response Time
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Forms Grid */}
      <Grid container spacing={3}>
        {forms.map((form, index) => (
          <Grid item xs={12} md={4} key={index}>
            <FormCard {...form} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};