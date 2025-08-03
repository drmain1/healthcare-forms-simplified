import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Description,
  Description as FormsIcon,
  TrendingUp,
  GetApp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetFormsQuery, useDeleteFormMutation, useGetFormQuery, useGenerateBlankFormPdfMutation } from '../../store/api/formsApi';
import { Survey } from 'survey-react-ui';
import { createSurveyModel } from '../../utils/surveyConfig';


const statusColors = {
  active: 'success',
  draft: 'warning',
  paused: 'error',
  archived: 'default',
} as const;

export const FormsList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{ id: string; title: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [previewSurvey, setPreviewSurvey] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get forms from API
  const { data: formsResponse, isLoading, error } = useGetFormsQuery({
    search: searchTerm,
    status: statusFilter === 'all' ? '' : statusFilter,
    page: 1,
    page_size: 50,
  });

  // Delete form mutation
  const [deleteForm, { isLoading: isDeleting }] = useDeleteFormMutation();
  const [generateBlankPdf, { isLoading: isGeneratingPdf }] = useGenerateBlankFormPdfMutation();

  // Get full form data for preview
  const { data: fullFormData, isLoading: isLoadingFullForm } = useGetFormQuery(previewFormId || '', {
    skip: !previewFormId
  });

  const forms = formsResponse?.results || [];


  const handleDeleteClick = (form: any) => {
    setFormToDelete({ id: form.id, title: form.title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;

    try {
      await deleteForm(formToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: `Form "${formToDelete.title}" deleted successfully`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Failed to delete form. Please try again.',
        severity: 'error'
      });
    }

    setDeleteDialogOpen(false);
    setFormToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFormToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePreview = (form: any) => {
    setLoadingPreview(true);
    setPreviewFormId(form.id);
    setPreviewDialogOpen(true);
  };

  // Handle when full form data is loaded
  React.useEffect(() => {
    console.log('Form preview data:', fullFormData); // Debug log
    if (fullFormData && (fullFormData.surveyJson || (fullFormData as any).survey_json) && isLoadingFullForm === false) {
      try {
        const surveyJson = fullFormData.surveyJson || (fullFormData as any).survey_json;
        const survey = createSurveyModel(surveyJson);
        
        // Configure survey for preview mode
        survey.mode = 'display'; // Use display mode for preview (read-only)
        survey.showCompletedPage = false;
        
        setPreviewForm(fullFormData);
        setPreviewSurvey(survey);
        setLoadingPreview(false);
      } catch (error) {
        console.error('Preview error:', error);
        setSnackbar({
          open: true,
          message: 'Error creating preview. Please check the form configuration.',
          severity: 'error'
        });
        setPreviewDialogOpen(false);
        setLoadingPreview(false);
      }
    }
  }, [fullFormData, isLoadingFullForm]);

  // Client-side filtering is now handled by the API query parameters
  // but we can add additional filtering if needed
  const filteredForms = forms;

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  const getGradient = (formId: string) => {
    const hash = formId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const FormCard: React.FC<{ form: any }> = ({ form }) => (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: getGradient(form.id),
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 3, pt: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            mb: 1.5,
            color: '#1a1a1a',
            fontSize: '1.25rem',
            lineHeight: 1.3,
          }}
        >
          {form.title}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#666',
            mb: 3,
            minHeight: '40px',
            lineHeight: 1.6,
          }}
        >
          {form.description || 'No description available'}
        </Typography>
        
        <Box sx={{ mt: 'auto' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#999',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
            }}
          >
            Updated {new Date(form.updated_at).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions 
        sx={{ 
          p: 2,
          pt: 0,
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          gap: 1,
        }}
      >
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => handlePreview(form)}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
              color: '#667eea',
            },
          }}
        >
          Preview
        </Button>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/forms/${form.id}/edit`)}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
              color: '#667eea',
            },
          }}
        >
          Edit
        </Button>
        <Button
          size="small"
          startIcon={<SendIcon />}
          onClick={() => navigate(`/forms/${form.id}/send`)}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(72, 187, 120, 0.08)',
              color: '#48bb78',
            },
          }}
        >
          Send
        </Button>
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => handleDeleteClick(form)}
          sx={{ 
            color: '#e53e3e',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(229, 62, 62, 0.08)',
              color: '#c53030',
            },
          }}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Forms
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor all your healthcare forms
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/forms/create')}
          sx={{ borderRadius: 2 }}
        >
          Create Form
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('cards')}
                size="small"
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                size="small"
              >
                Table
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load forms. Please try again.
        </Alert>
      )}

      {/* Forms Content */}
      {!isLoading && !error && (viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredForms.map((form) => (
            <Grid item xs={12} sm={6} lg={4} key={form.id}>
              <FormCard form={form} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Form Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Responses</TableCell>
                <TableCell align="right">Completion Rate</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow key={form.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {form.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {form.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={form.status}
                      size="small"
                      color={statusColors[form.status as keyof typeof statusColors]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{form.response_count || 0}</TableCell>
                  <TableCell align="right">{form.completion_rate || 0}%</TableCell>
                  <TableCell>{new Date(form.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(form)}
                        title="Preview Form"
                      >
                        <ViewIcon />
                      </IconButton>
                      {form.response_count > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/forms/${form.id}/responses`)}
                          title="View Responses"
                          color="primary"
                        >
                          <Badge badgeContent={form.response_count} color="primary">
                            <Description />
                          </Badge>
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/forms/${form.id}/edit`)}
                        title="Edit Form"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/forms/${form.id}/send`)}
                        title="Send Form"
                      >
                        <SendIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          try {
                            const url = await generateBlankPdf(form.id).unwrap();
                            
                            // Create download link
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${form.title}_Blank_Template.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Failed to generate PDF:', error);
                            setSnackbar({
                              open: true,
                              message: 'Failed to generate PDF. Please try again.',
                              severity: 'error'
                            });
                          }
                        }}
                        title="Download Blank Form PDF"
                      >
                        <GetApp />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(form)}
                        sx={{ color: 'error.main' }}
                        title="Delete Form"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ))}


      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Form
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the form "{formToDelete?.title}"? This action cannot be undone.
            All responses and data associated with this form will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewFormId(null);
          setPreviewForm(null);
          setPreviewSurvey(null);
          setLoadingPreview(false);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Form Preview: {previewForm?.title || 'Loading...'}
        </DialogTitle>
        <DialogContent>
          {loadingPreview || isLoadingFullForm ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Loading form preview...</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                This is a preview of how the form will appear to patients.
              </Alert>
              {previewSurvey ? (
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50', 
                  borderRadius: 1,
                  '& .sv-root-modern': {
                    backgroundColor: 'transparent'
                  },
                  '& .sv-body': {
                    backgroundColor: 'white',
                    borderRadius: 1,
                    padding: 2
                  }
                }}>
                  <Survey model={previewSurvey} />
                </Box>
              ) : (
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Unable to generate preview. Please ensure the form has a valid configuration.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPreviewDialogOpen(false);
            setPreviewFormId(null);
            setPreviewForm(null);
            setPreviewSurvey(null);
            setLoadingPreview(false);
          }}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => navigate(`/forms/${previewForm?.id}/send`)}
            disabled={!previewForm || loadingPreview}
          >
            Send This Form
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};