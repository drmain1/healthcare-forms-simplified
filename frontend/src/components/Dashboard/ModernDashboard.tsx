import React from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Stack,
  IconButton,
  Chip,
  LinearProgress,
  Button,
  Avatar,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Description as FormsIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, bgColor }) => (
  <Card
    sx={{
      p: 3,
      height: '100%',
      border: 'none',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: color,
      },
    }}
  >
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            backgroundColor: bgColor,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: trend > 0 ? '#10B981' : '#EF4444' }} />
            <Typography variant="caption" sx={{ color: trend > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {title}
        </Typography>
      </Box>
    </Stack>
  </Card>
);

const RecentSubmission = ({ form, patient, status, time }: any) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 2,
      backgroundColor: '#FAFAFA',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#F3F4F6',
        transform: 'translateX(4px)',
      },
    }}
  >
    <Avatar sx={{ width: 40, height: 40, bgcolor: '#E5E7EB', color: '#6B7280' }}>
      {patient.charAt(0)}
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
        {patient}
      </Typography>
      <Typography variant="caption" sx={{ color: '#6B7280' }}>
        {form}
      </Typography>
    </Box>
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: status === 'Reviewed' ? '#DEF7EC' : '#FEF3C7',
          color: status === 'Reviewed' ? '#065F46' : '#92400E',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
        {time}
      </Typography>
    </Stack>
  </Box>
);

export const ModernDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Forms',
      value: 6,
      icon: <FormsIcon />,
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      trend: 12,
    },
    {
      title: 'Total Submissions',
      value: 5,
      icon: <CheckIcon />,
      color: '#10B981',
      bgColor: '#D1FAE5',
      trend: 8,
    },
    {
      title: 'Completion Rate',
      value: '20%',
      icon: <TrendingUpIcon />,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      title: 'Active Today',
      value: 1,
      icon: <PendingIcon />,
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      trend: -5,
    },
  ];

  const recentSubmissions = [
    { form: 'UI getting better', patient: 'David Main', status: 'Reviewed', time: '2 hours ago' },
    { form: 'Patient Information Form', patient: 'SWANK CHIROPRACTIC', status: 'Reviewed', time: '5 hours ago' },
    { form: 'Patient Information Form', patient: 'SWANK CHIROPRACTIC', status: 'Pending', time: '1 day ago' },
  ];

  return (
    <Box sx={{ backgroundColor: '#F9FAFB', minHeight: '100vh', p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280' }}>
          Here's what's happening with your forms today
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activity - Now full width */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              border: 'none',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                Recent Submissions
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{ textTransform: 'none', color: '#3B82F6' }}
              >
                View all
              </Button>
            </Box>
            
            <Stack spacing={2}>
              {recentSubmissions.map((submission, index) => (
                <RecentSubmission key={index} {...submission} />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Form Performance */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              border: 'none',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              Form Performance
            </Typography>
            
            <Grid container spacing={3}>
              {['UI getting better', 'Patient Information Form', 'Medical History'].map((form, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: '#F3F4F6',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                        {form}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {20 + index * 30}% complete
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={20 + index * 30}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: '#3B82F6',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {2 + index} submissions
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        Avg. {5 + index * 2} min
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};