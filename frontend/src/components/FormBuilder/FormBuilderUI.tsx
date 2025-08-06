import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  ArrowBack as BackIcon,
  Description as PdfIcon,
  Build as BuildIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import { Survey } from 'survey-react-ui';
import { useNavigate } from 'react-router-dom';
import { FormBuilderToolbar } from './FormBuilderToolbar';
import { PdfUploader } from './PdfUploader';
import { ConversationalFormBuilder } from './ConversationalFormBuilder';
import { FormBuilderData } from './FormBuilderContainer';
import { designTokens } from '../../styles/design-tokens';
import '../../styles/main.css';

interface FormBuilderUIProps {
  creator: SurveyCreator | null;
  formTitle: string;
  formDescription: string;
  formCategory: string;
  isEditing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  currentFormJson: any;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onFormCategoryChange: (category: string) => void;
  onSave: (data: FormBuilderData) => Promise<void>;
  onPreview: () => any;
  onFormUpdate: (formJson: any) => void;
}

export const FormBuilderUI: React.FC<FormBuilderUIProps> = ({
  creator,
  formTitle,
  formDescription,
  formCategory,
  isEditing,
  isCreating,
  isUpdating,
  currentFormJson,
  onFormTitleChange,
  onFormDescriptionChange,
  onFormCategoryChange,
  onSave,
  onPreview,
  onFormUpdate,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previewSurvey, setPreviewSurvey] = useState<any>(null);

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setSnackbarMessage('Please enter a form title');
      setSnackbarOpen(true);
      return;
    }

    if (!creator) {
      setSnackbarMessage('Form builder not initialized');
      setSnackbarOpen(true);
      return;
    }

    try {
      let surveyjs_schema;
      try {
        surveyjs_schema = JSON.parse(creator.text);
      } catch (error) {
        setSnackbarMessage('Invalid form configuration. Please check your form design.');
        setSnackbarOpen(true);
        return;
      }

      await onSave({
        title: formTitle,
        description: formDescription,
        category: formCategory,
        surveyjs_schema,
      });

      setSnackbarMessage(isEditing ? 'Form updated successfully!' : 'Form created successfully!');
      setSnackbarOpen(true);
      setSaveDialogOpen(false);
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || 'Failed to save form. Please try again.';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handlePreview = () => {
    const survey = onPreview();
    if (survey) {
      setPreviewSurvey(survey);
      setPreviewDialogOpen(true);
    } else {
      setSnackbarMessage('Error creating preview. Please check your form configuration.');
      setSnackbarOpen(true);
    }
  };

  const handlePdfFormGenerated = (surveyJson: any) => {
    try {
      onFormUpdate(surveyJson);
      
      // Set form metadata
      onFormTitleChange(surveyJson.title || 'Generated from PDF');
      onFormDescriptionChange('Form automatically generated from PDF upload');
      onFormCategoryChange('intake');
      
      // Navigate to the form builder with the generated form
      navigate('/forms/create', { state: { generatedForm: surveyJson } });
      
      // Switch to the form builder tab
      setActiveTab(1);
      
      setSnackbarMessage('PDF form generated successfully! You can now edit it.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error setting generated form:', error);
      setSnackbarMessage('Error loading generated form');
      setSnackbarOpen(true);
    }
  };

  const handleTabSwitch = (tabIndex: number) => {
    setActiveTab(tabIndex);
    // Sync form state when switching tabs
    if (creator) {
      try {
        const json = JSON.parse(creator.text || '{}');
        onFormUpdate(json);
      } catch (e) {
        console.error('Error syncing form state:', e);
      }
    }
  };

  return (
    <Box className="form-builder-view tw-bg-surface-light tw-h-screen tw-overflow-hidden tw-flex tw-flex-col">
      {/* Header Toolbar */}
      <FormBuilderToolbar
        isEditing={isEditing}
        isCreating={isCreating}
        isUpdating={isUpdating}
        onBack={() => navigate('/forms')}
        onPreview={handlePreview}
        onSave={() => setSaveDialogOpen(true)}
      />

      {/* Content Container */}
      <Box className="tw-flex-1 tw-overflow-hidden tw-relative">
        {/* Method Selection Cards - Only show for new forms */}
        {!isEditing && activeTab === null && (
          <Box className="tw-p-6">
            <Typography variant="h5" className="tw-mb-2 tw-font-semibold tw-text-gray-900">
              Choose how to create your form
            </Typography>
            <Typography variant="body1" className="tw-mb-8 tw-text-gray-600">
              Select the method that works best for you
            </Typography>
            
            <Grid container spacing={3}>
              {/* Upload PDF Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  className="tw-p-6 tw-h-full tw-cursor-pointer tw-border-2 tw-border-transparent tw-transition-all tw-duration-300 tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 hover:tw-transform hover:tw--translate-y-1 hover:tw-shadow-lg hover:tw-border-primary-700"
                  onClick={() => handleTabSwitch(0)}
                >
                  <Box className="tw-text-center">
                    <Box className="tw-w-20 tw-h-20 tw-rounded-full tw-bg-gradient-to-br tw-from-purple-500 tw-to-indigo-600 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                      <PdfIcon className="tw-text-4xl tw-text-white" />
                    </Box>
                    <Typography variant="h6" className="tw-mb-4 tw-font-semibold">
                      Upload PDF
                    </Typography>
                    <Typography variant="body2" className="tw-text-gray-600">
                      Convert your existing PDF forms into interactive digital forms automatically
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Form Builder Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  className="tw-p-6 tw-h-full tw-cursor-pointer tw-border-2 tw-border-transparent tw-transition-all tw-duration-300 tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 hover:tw-transform hover:tw--translate-y-1 hover:tw-shadow-lg hover:tw-border-primary-700"
                  onClick={() => handleTabSwitch(1)}
                >
                  <Box className="tw-text-center">
                    <Box className="tw-w-20 tw-h-20 tw-rounded-full tw-bg-gradient-to-br tw-from-blue-600 tw-to-blue-800 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                      <BuildIcon className="tw-text-4xl tw-text-white" />
                    </Box>
                    <Typography variant="h6" className="tw-mb-4 tw-font-semibold">
                      Form Builder
                    </Typography>
                    <Typography variant="body2" className="tw-text-gray-600">
                      Create custom forms from scratch with our drag-and-drop builder
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* AI Builder Card */}
              <Grid item xs={12} md={4}>
                <Paper
                  className="tw-p-6 tw-h-full tw-cursor-pointer tw-border-2 tw-border-transparent tw-transition-all tw-duration-300 tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 hover:tw-transform hover:tw--translate-y-1 hover:tw-shadow-lg hover:tw-border-primary-700"
                  onClick={() => handleTabSwitch(2)}
                >
                  <Box className="tw-text-center">
                    <Box className="tw-w-20 tw-h-20 tw-rounded-full tw-bg-gradient-to-br tw-from-pink-500 tw-to-red-500 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                      <AIIcon className="tw-text-4xl tw-text-white" />
                    </Box>
                    <Typography variant="h6" className="tw-mb-4 tw-font-semibold">
                      AI Builder
                    </Typography>
                    <Typography variant="body2" className="tw-text-gray-600">
                      Describe your form in plain English and let AI create it for you
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* PDF Uploader Tab */}
        {!isEditing && activeTab === 0 && (
          <Box className="tw-p-6">
            <Paper className="tw-p-8 tw-rounded-lg tw-border tw-border-gray-300">
              <Typography variant="h5" className="tw-mb-2 tw-font-semibold tw-text-gray-900">
                Generate Form from PDF
              </Typography>
              <Typography variant="body1" className="tw-mb-6 tw-text-gray-600">
                Upload a PDF form and our AI will automatically convert it to an interactive digital form
              </Typography>
              
              <PdfUploader 
                onFormGenerated={handlePdfFormGenerated}
                onError={(error) => {
                  setSnackbarMessage(error);
                  setSnackbarOpen(true);
                }}
              />
            </Paper>
          </Box>
        )}

        {/* Form Builder Tab */}
        {(isEditing || activeTab === 1) && (
          <Box className="tw-h-full tw-w-full">
            <Box 
              className="tw-h-full tw-w-full tw-absolute tw-inset-0"
              sx={{
                fontFamily: designTokens.typography.fontFamily.secondary,
                '& .svc-creator': { 
                  height: '100% !important',
                  width: '100% !important',
                  fontFamily: `${designTokens.typography.fontFamily.secondary} !important`,
                  border: 'none !important',
                  display: 'flex !important',
                  flexDirection: 'column !important'
                },
              }}
            >
              {creator && (
                <SurveyCreatorComponent creator={creator} />
              )}
            </Box>
          </Box>
        )}

        {/* AI Builder Tab */}
        {!isEditing && activeTab === 2 && (
          <Box className="tw-p-6">
            <Box className="tw-mb-6">
              <Typography variant="h5" className="tw-mb-2 tw-font-semibold tw-text-gray-900">
                AI Form Builder
              </Typography>
              <Typography variant="body1" className="tw-mb-6 tw-text-gray-600">
                Chat with AI to create and modify your form iteratively
              </Typography>
            </Box>
            <Paper className="tw-p-0 tw-rounded-lg tw-border tw-border-gray-300 tw-overflow-hidden">
              <ConversationalFormBuilder 
                currentFormJson={currentFormJson || (creator ? JSON.parse(creator.text || '{}') : null)}
                onFormGenerated={(formJson) => {
                  try {
                    onFormUpdate(formJson);
                    
                    // Set form metadata if not already set
                    if (!formTitle) {
                      onFormTitleChange(formJson.title || 'AI Generated Form');
                      onFormDescriptionChange(formJson.description || 'Form generated using AI');
                      onFormCategoryChange('intake');
                    }
                  } catch (error) {
                    console.error('Error setting AI generated form:', error);
                    setSnackbarMessage('Error loading generated form');
                    setSnackbarOpen(true);
                  }
                }}
                onFormModified={(formJson) => {
                  try {
                    onFormUpdate(formJson);
                    
                    // Update title if it changed
                    if (formJson.title && formJson.title !== formTitle) {
                      onFormTitleChange(formJson.title);
                    }
                  } catch (error) {
                    console.error('Error updating form:', error);
                    setSnackbarMessage('Error updating form');
                    setSnackbarOpen(true);
                  }
                }}
              />
            </Paper>
            
            <Box className="tw-mt-6 tw-flex tw-gap-4">
              <Button
                variant="contained"
                startIcon={<BuildIcon />}
                onClick={() => handleTabSwitch(1)}
                disabled={!creator || !creator.text || creator.text === '{}'}
              >
                Edit in Form Builder
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
                disabled={!creator || !creator.text || creator.text === '{}'}
              >
                Preview Form
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Update Form' : 'Save New Form'}
        </DialogTitle>
        <DialogContent>
          <Box className="tw-pt-4">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Form Title"
                  value={formTitle}
                  onChange={(e) => onFormTitleChange(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formDescription}
                  onChange={(e) => onFormDescriptionChange(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formCategory}
                    label="Category"
                    onChange={(e) => onFormCategoryChange(e.target.value)}
                  >
                    <MenuItem value="intake">Patient Intake</MenuItem>
                    <MenuItem value="medical_history">Medical History</MenuItem>
                    <MenuItem value="consent">Consent Forms</MenuItem>
                    <MenuItem value="assessment">Assessment</MenuItem>
                    <MenuItem value="discharge">Discharge</MenuItem>
                    <MenuItem value="insurance">Insurance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={isCreating || isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Form Preview</DialogTitle>
        <DialogContent>
          <Alert severity="info" className="tw-mb-4">
            This is how your form will appear to patients. Test the flow and functionality.
          </Alert>
          {previewSurvey ? (
            <Box className="form-preview-view tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <Survey model={previewSurvey} />
            </Box>
          ) : (
            <Box className="tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <Typography variant="body2" color="text.secondary">
                Unable to generate preview. Please ensure your form has valid configuration.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button 
            variant="outlined"
            onClick={() => {
              if (previewSurvey) {
                console.log('Current Survey Data:', previewSurvey.data);
                
                setSnackbarMessage('Survey data logged to console');
                setSnackbarOpen(true);
              }
            }}
          >
            Log Current Data
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (previewSurvey) {
                previewSurvey.doComplete();
              }
            }}
          >
            Test Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};