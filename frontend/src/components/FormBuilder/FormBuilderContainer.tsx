import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCreateFormMutation, useUpdateFormMutation, useGetFormQuery } from '../../store/api/formsApi';
import { SurveyCreator } from 'survey-creator-react';
import { createMinimalSurveyCreator, createMinimalSurveyModel } from '../../utils/surveyConfigMinimal';
import { applyCreatorTheme } from '../../config/surveyThemes';
import { FormBuilderUI } from './FormBuilderUI';
import { useAppSelector } from '../../store/hooks';
import { selectOrganization } from '../../store/selectors/authSelectors';

// Register custom components
import './BodyPainDiagramQuestion';
import './HeightWeightSlider';
import './DateOfBirthQuestion';
import './CustomDropdownItem';

export interface FormBuilderData {
  title: string;
  description: string;
  category: string;
  surveyjs_schema: any;
}

export const FormBuilderContainer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('intake');
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormJson, setCurrentFormJson] = useState<any>(null);
  const organization = useAppSelector(selectOrganization);

  // API hooks
  const [createForm, { isLoading: isCreating }] = useCreateFormMutation();
  const [updateForm, { isLoading: isUpdating }] = useUpdateFormMutation();
  const { data: existingForm, isLoading: isLoadingForm, error: formError } = useGetFormQuery(id || '', {
    skip: !id || id === 'create'
  });

  useEffect(() => {
    const surveyCreator = createMinimalSurveyCreator();
    
    // Apply standard theme
    applyCreatorTheme(surveyCreator);
    
    // Configure creator layout
    surveyCreator.showSidebar = true;
    surveyCreator.sidebarLocation = 'right';
    surveyCreator.showToolbox = true;
    
    // Set initial tab
    surveyCreator.makeNewViewActive('designer');
    
    // Set default or load existing form
    if (location.state?.generatedForm) {
      const { generatedForm } = location.state;
      console.log('Loading generated form:', generatedForm.title);
      setIsEditing(false);
      setFormTitle(generatedForm.title);
      setFormDescription(generatedForm.description);
      setFormCategory(getFormCategory(generatedForm));
      surveyCreator.text = JSON.stringify(generatedForm);
    } else if (id && id !== 'create' && existingForm) {
      console.log('Loading existing form:', existingForm.title);
      setIsEditing(true);
      setFormTitle(existingForm.title);
      setFormDescription(existingForm.description);
      setFormCategory(getFormCategory(existingForm));
      surveyCreator.text = JSON.stringify(existingForm.surveyJson);
    } else if (id === 'create' || !id) {
      console.log('Creating new form');
      setIsEditing(false);
      setFormTitle('');
      setFormDescription('');
      setFormCategory('intake');
      // Start with an empty form
      const emptyForm = {
        title: '',
        pages: [{
          name: 'page1',
          elements: []
        }]
      };
      surveyCreator.text = JSON.stringify(emptyForm);
    }

    // Add listener for creator modifications
    surveyCreator.onModified.add(() => {
      try {
        const json = JSON.parse(surveyCreator.text || '{}');
        setCurrentFormJson(json);
      } catch (e) {
        console.error('Error parsing form JSON:', e);
      }
    });

    // Ensure creator is fully initialized before setting state
    setTimeout(() => {
      setCreator(surveyCreator);
      // Set initial form JSON
      try {
        const json = JSON.parse(surveyCreator.text || '{}');
        setCurrentFormJson(json);
      } catch (e) {
        console.error('Error parsing initial form JSON:', e);
      }
    }, 100);
  }, [id, existingForm]);

  // Helper function to extract category from form
  const getFormCategory = (form: any) => {
    return form.category || form.template?.category || 'intake';
  };

  const handleSave = async (saveData: FormBuilderData): Promise<void> => {
    try {
      const formData = {
        title: saveData.title,
        description: saveData.description,
        surveyJson: saveData.surveyjs_schema,  // Changed to match backend expectation
        category: saveData.category,
        // Only send fields that backend expects, removed all extra fields
      };

      console.log('Saving form data:', formData);

      if (isEditing && existingForm) {
        await updateForm({
          id: existingForm.id,
          ...formData,
        }).unwrap();
      } else {
        const result = await createForm(formData);
        console.log('createForm result:', result);
        const newForm = (result as any).data;
        // Navigate to edit mode for the new form
        navigate(`/forms/${newForm.id}/edit`, { replace: true });
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePreview = () => {
    if (!creator || !creator.text) return null;
    
    try {
      const surveyJson = JSON.parse(creator.text);
      const survey = createMinimalSurveyModel(surveyJson);
      
      // Configure survey for preview mode
      survey.mode = 'edit';
      survey.showCompletedPage = true;
      
      survey.onComplete.add((sender: any) => {
        console.log('Survey completed with data:', sender.data);
      });
      
      survey.onValueChanged.add((sender: any, options: any) => {
        console.log('Value changed:', options.name, '=', options.value);
      });
      
      return survey;
    } catch (error) {
      console.error('Preview error:', error);
      return null;
    }
  };

  const handleFormUpdate = (formJson: any) => {
    if (!creator) return;
    
    try {
      creator.text = JSON.stringify(formJson);
      setCurrentFormJson(formJson);
      
      // Update metadata if available
      if (formJson.title && !formTitle) {
        setFormTitle(formJson.title);
      }
      if (formJson.description && !formDescription) {
        setFormDescription(formJson.description);
      }
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  };

  // Show loading while fetching existing form
  if (id && id !== 'create' && isLoadingForm) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading form...</Typography>
      </Box>
    );
  }
  
  // Show error if form not found
  if (id && id !== 'create' && !isLoadingForm && !existingForm) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Form not found. The form ID may be invalid or you may not have permission to edit it.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/forms')}>
          Back to Forms
        </Button>
      </Box>
    );
  }

  return (
    <FormBuilderUI
      creator={creator}
      formTitle={formTitle}
      formDescription={formDescription}
      formCategory={formCategory}
      isEditing={isEditing}
      isCreating={isCreating}
      isUpdating={isUpdating}
      currentFormJson={currentFormJson}
      onFormTitleChange={setFormTitle}
      onFormDescriptionChange={setFormDescription}
      onFormCategoryChange={setFormCategory}
      onSave={handleSave}
      onPreview={handlePreview}
      onFormUpdate={handleFormUpdate}
    />
  );
};