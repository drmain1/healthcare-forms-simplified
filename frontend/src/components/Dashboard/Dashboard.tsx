import React, { useState } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import {
  Visibility,
  Person,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetResponsesQuery, useDeleteResponseMutation } from '../../store/api/responsesApi';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);

  const { data: responsesData, isLoading, error, refetch } = useGetResponsesQuery({ 
    page_size: 20, 
    ordering: '-submitted_at' 
  }, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [deleteResponse, { isLoading: isDeleting }] = useDeleteResponseMutation();

  const responses = React.useMemo(() => {
    const data = responsesData?.results || [];
    return [...data].sort((a, b) => {
      const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [responsesData?.results]);

  const handleDeleteClick = (responseId: string) => {
    setResponseToDelete(responseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setResponseToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (responseToDelete) {
      try {
        await deleteResponse(responseToDelete).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete the response: ', err);
      }
      handleDeleteCancel();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Recent form responses from your patients.
        </Typography>
      </Box>

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
                  <TableCell onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)} style={{ cursor: 'pointer'}}>
                    <Typography variant="body2" fontWeight="medium">
                      {response.form_title || response.form}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)} style={{ cursor: 'pointer'}}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="disabled" />
                      <Typography variant="body2">
                        {response.patient_name || 'Anonymous'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)} style={{ cursor: 'pointer'}}>
                    <Chip 
                      label={response.status ? response.status.replace('_', ' ') : ''} 
                      size="small" 
                      color={getStatusColor(response.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)} style={{ cursor: 'pointer'}}>
                    <Typography variant="body2">
                      {response.submitted_at 
                        ? new Date(response.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })
                        : 'Not submitted'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)} style={{ cursor: 'pointer'}}>
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
                    <Tooltip title="Delete Response">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => { 
                          e.stopPropagation();
                          handleDeleteClick(response.id);
                        }}
                      >
                        <DeleteIcon />
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

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this response? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};