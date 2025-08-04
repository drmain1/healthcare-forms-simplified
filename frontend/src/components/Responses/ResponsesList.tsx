import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TablePagination,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  GetApp,
  Delete,
  Search,
  ArrowBack,
  CheckCircle,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useGetFormResponsesQuery, useDeleteResponseMutation } from '../../store/api/responsesApi';
import { useGetFormQuery, useGenerateBlankFormPdfMutation } from '../../store/api/formsApi';

export const ResponsesList: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  // Pagination and filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // API queries
  const { data: formData, isLoading: formLoading } = useGetFormQuery(formId || '');
  const { 
    data: responsesData, 
    isLoading: responsesLoading,
    error: responsesError,
    refetch 
  } = useGetFormResponsesQuery({
    formId: formId || '',
    page: page + 1,
    page_size: rowsPerPage,
    search: searchTerm,
    status: statusFilter,
  });
  
  const [deleteResponse] = useDeleteResponseMutation();
  const [generateBlankPdf, { isLoading: isGeneratingPdf }] = useGenerateBlankFormPdfMutation();
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleViewResponse = (responseId: string) => {
    navigate(`/forms/${formId}/responses/${responseId}`);
  };
  
  const handleDeleteResponse = async (responseId: string) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
      try {
        await deleteResponse(responseId).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete response:', error);
      }
    }
  };
  
  const handleExportPdf = (responseId: string) => {
    // Navigate to response detail page where they can export the PDF
    navigate(`/forms/${formId}/responses/${responseId}`);
  };
  
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'completed':
      case 'submitted':
        return <CheckCircle fontSize="small" color="success" />;
      case 'in_progress':
        return <Schedule fontSize="small" color="info" />;
      case 'abandoned':
        return <Warning fontSize="small" color="warning" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'default';
    switch (status) {
      case 'completed':
      case 'submitted':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'abandoned':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  if (formLoading || responsesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (responsesError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load responses. Please try again.
        </Alert>
      </Box>
    );
  }
  
  const responses = responsesData?.results || [];
  const totalResponses = responsesData?.count || 0;
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/forms')}
          sx={{ mb: 2 }}
        >
          Back to Forms
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {formData?.title} - Responses
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage form submissions
            </Typography>
          </Box>
          
          {formData && (
            <Button
              variant="outlined"
              startIcon={isGeneratingPdf ? <CircularProgress size={16} /> : <GetApp />}
              disabled={isGeneratingPdf}
              onClick={async () => {
                try {
                  const url = await generateBlankPdf(formId!).unwrap();
                  
                  // Create download link
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${formData.title}_Blank_Template.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Failed to generate blank form PDF:', error);
                  alert('Failed to generate blank form PDF. Please try again.');
                }
              }}
            >
              Download Blank Form
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search responses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 300 }}
          />
          
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="abandoned">Abandoned</MenuItem>
          </TextField>
        </Box>
      </Paper>
      
      {/* Responses Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Completion Time</TableCell>
              <TableCell>Reviewed</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No responses found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              responses.map((response) => (
                <TableRow
                  key={response.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewResponse(response.id)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {response.patient_name || 'Anonymous'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(response.status) || undefined}
                      label={response.status ? response.status.replace('_', ' ').charAt(0).toUpperCase() + response.status.slice(1).replace('_', ' ') : 'Unknown'}
                      size="small"
                      color={getStatusColor(response.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {response.submitted_at
                      ? new Date(response.submitted_at).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {response.completion_time_seconds
                      ? `${Math.round(response.completion_time_seconds / 60)} min`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {response.status === 'reviewed' ? (
                      <Chip label="Reviewed" size="small" color="success" />
                    ) : (
                      <Chip label="Pending" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Response">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewResponse(response.id);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export PDF">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPdf(response.id);
                          }}
                        >
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResponse(response.id);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalResponses}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};