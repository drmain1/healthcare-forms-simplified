import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetResponsesQuery } from '../../store/api/responsesApi';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'submitted':
      return 'success';
    case 'reviewed':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Get form responses
  const { data: responsesData, isLoading, error } = useGetResponsesQuery({ 
    page_size: 20, 
    ordering: '-submitted_at' 
  });
  
  const responses = responsesData?.results || [];
  
  // Debug log
  
  
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ mb: 4 }}>
        <Alert severity="error">
          Failed to load form responses. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Recent form responses from your patients.
        </Typography>
      </Box>

      {/* Form Responses Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Form</strong></TableCell>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Submitted</strong></TableCell>
                <TableCell><strong>Completion Time</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {response.form_title || response.form}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="disabled" />
                      <Typography variant="body2">
                        {response.patient_name || 'Anonymous'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={response.status ? response.status.replace('_', ' ') : ''} 
                      size="small" 
                      color={getStatusColor(response.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {response.submitted_at 
                        ? new Date(response.submitted_at).toLocaleDateString()
                        : 'Not submitted'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {response.completion_time_seconds 
                        ? `${Math.round(response.completion_time_seconds / 60)} min`
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Response">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {responses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No form responses found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};