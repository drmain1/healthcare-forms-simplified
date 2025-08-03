import React, { useEffect } from 'react';
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
  GetApp,
  Person,
  CalendarToday,
  Timer,
  Devices,
} from '@mui/icons-material';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import 'survey-core/survey-core.css';
import { useGetResponseQuery, useMarkResponseReviewedMutation } from '../../store/api/responsesApi';
import { useGetFormQuery } from '../../store/api/formsApi';
import { PdfExportButton } from './PdfExportButton';

export const ResponseDetail: React.FC = () => {
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();
  
  // API queries
  const { data: response, isLoading: responseLoading, error: responseError } = useGetResponseQuery(responseId || '');
  const { data: form, isLoading: formLoading } = useGetFormQuery(formId || '');
  const [markReviewed] = useMarkResponseReviewedMutation();
  
  useEffect(() => {
    // Mark as reviewed when viewing
    if (response && response.status !== 'reviewed') {
      markReviewed(responseId || '');
    }
  }, [response, responseId, markReviewed]);
  
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
  
  // Create a read-only survey instance with the response data
  const surveyModel = new Model(form.surveyJson);
  surveyModel.mode = 'display';
  surveyModel.data = response.response_data;
  
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
          <PdfExportButton
            formId={formId!}
            responseId={responseId!}
            form={form}
            response={response}
          />
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
                label={response.status.replace('_', ' ').charAt(0).toUpperCase() + response.status.slice(1).replace('_', ' ')}
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
        
        {/* Render the survey in display mode with response data */}
        <Box sx={{ 
          '& .sd-root-modern': {
            backgroundColor: 'transparent',
          },
          '& .sd-question': {
            marginBottom: 2,
          },
          '& .sd-question__title': {
            fontWeight: 600,
            color: 'text.primary',
          },
          '& .sd-question__content': {
            marginTop: 1,
          }
        }}>
          <Survey model={surveyModel} />
        </Box>
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