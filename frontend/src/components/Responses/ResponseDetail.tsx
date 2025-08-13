import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  CalendarToday,
  Timer,
  Devices,
} from '@mui/icons-material';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import 'survey-core/survey-core.css';
import { useGetResponseQuery } from '../../store/api/responsesApi';
import { useGetFormQuery } from '../../store/api/formsApi';
import { PdfExportButton } from './PdfExportButton';
import { ClinicalSummaryButton } from './ClinicalSummaryButton';
// Import custom question types
import '../FormBuilder/BodyDiagramQuestion';
import '../FormBuilder/BodyPainDiagramQuestion';
import '../FormBuilder/BodyDiagram2Question';
import { BodyPainDiagram } from '../FormBuilder/BodyPainDiagram';
import { BodyDiagram2 } from '../FormBuilder/BodyDiagram2';


export const ResponseDetail: React.FC = () => {
  const surveyModelRef = useRef<Model | null>(null);
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();
  
  const { data: response, isLoading: responseLoading, error: responseError } = useGetResponseQuery(responseId || '');
  const { data: form, isLoading: formLoading } = useGetFormQuery(formId || '');

  // State to hold extracted body diagram questions and their data
  const [bodyDiagrams, setBodyDiagrams] = useState<any[]>([]);

  useEffect(() => {
    if (form && response) {
      // Debug logging to understand the response structure
      console.log('[ResponseDetail] Full response object:', response);
      console.log('[ResponseDetail] response.response_data:', response.response_data);
      console.log('[ResponseDetail] response.patient_data:', response.patient_data);
      
      // Check ALL possible locations for the data
      console.log('[ResponseDetail] Checking all fields for pain_areas:');
      Object.keys(response).forEach(key => {
        const value = (response as any)[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if (value.pain_areas) {
            console.log(`[ResponseDetail] Found pain_areas in response.${key}:`, value.pain_areas);
          }
        }
      });
      
      // Initialize the SurveyJS model
      const surveyModel = new Model(form.surveyJson);
      surveyModel.mode = 'display';
      
      // Merge all data sources
      const mergedData = { ...response.patient_data, ...response.response_data };
      console.log('[ResponseDetail] Merged data for survey:', mergedData);
      console.log('[ResponseDetail] pain_areas in merged data:', mergedData.pain_areas);
      
      surveyModel.data = mergedData;
      surveyModelRef.current = surveyModel;

      // Simplified logic to find and store body diagram data
      const findBodyDiagrams = () => {
        const diagrams: any[] = [];
        
        // Check BOTH response_data and patient_data for pain_areas
        const painAreasData = response.response_data?.pain_areas || response.patient_data?.pain_areas || mergedData.pain_areas;
        
        if (painAreasData && Array.isArray(painAreasData) && painAreasData.length > 0) {
          console.log('[ResponseDetail] Adding pain_areas from data:', painAreasData);
          diagrams.push({
            name: 'pain_areas',
            title: 'Pain Areas',
            type: 'bodypaindiagram',
            data: painAreasData,
          });
        }
        
        // Also check through survey questions (as backup)
        surveyModel.getAllQuestions().forEach((question: any) => {
          console.log('[ResponseDetail] Checking question:', question.name, 'type:', question.getType(), 'value:', question.value);
          
          // Check for both question types
          if (question.getType() === 'bodypaindiagram' || question.getType() === 'bodydiagram' || question.getType() === 'bodydiagram2') {
            // Ensure there is data to display
            if (question.value && Array.isArray(question.value) && question.value.length > 0) {
              // Check if we already added this data
              const alreadyAdded = diagrams.some(d => d.name === question.name);
              if (!alreadyAdded) {
                diagrams.push({
                  name: question.name,
                  title: question.title,
                  type: question.getType(),
                  data: question.value,
                });
              }
            }
          }
        });
        console.log('Found valid body diagram data to render:', diagrams);
        setBodyDiagrams(diagrams);
      };

      findBodyDiagrams();
    }
  }, [form, response]);

  if (responseLoading || formLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (responseError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load response. Please try again.
        </Alert>
      </Box>
    );
  }
  
  if (!response || !form) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Response not found.
        </Alert>
      </Box>
    );
  }
  
  const getStatusIcon = (status: string) => {
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
  
  const getStatusColor = (status: string) => {
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
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/forms/${formId}/responses`)}
          sx={{ mb: 2 }}
        >
          Back to Responses
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            Response Detail
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ClinicalSummaryButton responseId={responseId!} />
            <PdfExportButton
              formId={formId!}
              responseId={responseId!}
            />
          </Box>
        </Box>
        
        <Typography variant="h6" color="text.secondary">
          {form.title}
        </Typography>
      </Box>
      
      {/* Response Metadata */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="medium">
                {response.patient_name || 'Anonymous'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarToday color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Submitted
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="medium">
                {response.submitted_at
                  ? new Date(response.submitted_at).toLocaleDateString()
                  : 'Not submitted'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {response.submitted_at
                  ? new Date(response.submitted_at).toLocaleTimeString()
                  : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Timer color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Completion Time
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="medium">
                {response.completion_time_seconds
                  ? `${Math.round(response.completion_time_seconds / 60)} minutes`
                  : '-'}
              </Typography>
              <Chip
                icon={getStatusIcon(response.status) || undefined}
                label={response.status ? response.status.replace('_', ' ').charAt(0).toUpperCase() + response.status.slice(1).replace('_', ' ') : ''}
                size="small"
                color={getStatusColor(response.status) as any}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Devices color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Device Info
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                IP: {response.ip_address || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {response.user_agent || 'Unknown device'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Response Content */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Form Responses
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {surveyModelRef.current && <Survey model={surveyModelRef.current} />}
      </Paper>

      {/* NEW: Cleaned up, single rendering location for body diagrams */}
      {bodyDiagrams.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Pain Areas
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {bodyDiagrams.map((diagram) => (
            <Box key={diagram.name} sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {diagram.title || (diagram.type === 'bodydiagram2' ? 'Body Sensation Diagram' : 'Body Pain Diagram')}
              </Typography>
              {diagram.type === 'bodydiagram2' ? (
                <BodyDiagram2
                  value={diagram.data}
                  readOnly={true}
                />
              ) : (
                <BodyPainDiagram
                  value={diagram.data}
                  readOnly={true}
                />
              )}
            </Box>
          ))}
        </Paper>
      )}
      
      {/* Additional Information */}
      {response.review_notes && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Reviewer Notes
          </Typography>
          <Typography variant="body1">
            {response.review_notes}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
