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
// Import centralized custom question registry - registers all custom questions
import '../FormBuilder/customQuestionRegistry';

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
      
      // Check for patient demographics specifically
      if (response.response_data?.patient_demographics) {
        console.log('[ResponseDetail] Found patient_demographics:', response.response_data.patient_demographics);
      }
      if (response.response_data?.first_name || response.response_data?.last_name) {
        console.log('[ResponseDetail] Found flattened patient name:', {
          first_name: response.response_data.first_name,
          last_name: response.response_data.last_name
        });
      }
      
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
      
      // Debug patient vitals data
      console.log('[ResponseDetail] Checking for patient vitals:');
      console.log('  - patient_height:', mergedData.patient_height);
      console.log('  - patient_weight:', mergedData.patient_weight);
      console.log('  - patient_vitals object:', mergedData.patient_vitals);
      
      // Handle potentially nested patient vitals data for backward compatibility
      if (mergedData.patient_vitals && typeof mergedData.patient_vitals === 'object') {
        console.log('[ResponseDetail] Flattening nested patient_vitals data for display');
        Object.assign(mergedData, mergedData.patient_vitals);
      }
      
      surveyModel.data = mergedData;
      surveyModelRef.current = surveyModel;
      
      // Debug: Check what custom questions are recognized
      console.log('[ResponseDetail] All questions in survey:');
      surveyModel.getAllQuestions().forEach((q: any) => {
        console.log(`  - ${q.name} (type: ${q.getType()}, value exists: ${!!q.value})`);
        if (q.getType() === 'patient_demographics' && q.value) {
          console.log('    Patient demographics value:', q.value);
        }
      });

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
          onClick={() => navigate('/')}
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
