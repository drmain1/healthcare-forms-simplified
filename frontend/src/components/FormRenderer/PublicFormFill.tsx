import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Container,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import { createSurveyModel } from '../../utils/surveyConfig';
import { useInsuranceCardProcessor } from '../../hooks/useInsuranceCardProcessor';
import insuranceCardGeminiService from '../../services/insuranceCardGeminiService';
import { designTokens } from '../../styles/design-tokens';
import { applySurveyTheme } from '../../config/surveyThemes';
import { addSignatureValidation, cleanSignatureData } from '../../utils/signatureValidation';
import { apiEndpoints } from '../../config/api';
import { 
  detectMobile, 
  applyMobileTheme, 
  ensureViewportMeta 
} from '../../utils/mobileDetection';
import '../../styles/mobile-minimal.css';
import { mobileDiagnostics } from '../../utils/mobileDiagnostics';
import { removeMobileThemeOverrides } from '../../utils/mobileThemeFix';
import { optimizeFormForMobile, optimizeSurveyModelForMobile, needsMobileOptimization } from '../../utils/mobileFormOptimizer';
import '../FormBuilder/DateOfBirthQuestion';
import '../FormBuilder/BodyPainDiagramQuestion';
import '../FormBuilder/BodyDiagram2Question';

// Fetch form using the public share token endpoint
const fetchFormByShareToken = async (formId: string, shareToken: string) => {
  try {
    const response = await fetch(apiEndpoints.forms.public(formId, shareToken));
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Form not found');
    }
    const data = await response.json();
    return data.form || data; // Handle both old and new response formats
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load form');
  }
};

export const PublicFormFill: React.FC = () => {
  const { formId, shareToken } = useParams<{ formId: string; shareToken: string }>();
  const [form, setForm] = useState<any>(null);
  const surveyModelRef = useRef<Model | null>(null);
  const [isSurveyReady, setIsSurveyReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const { processInsuranceCard, isProcessing } = useInsuranceCardProcessor(surveyModelRef.current);

  useEffect(() => {
    const loadForm = async () => {
      if (!formId || !shareToken) {
        setError('Invalid form link. The URL is missing required parameters.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const formData = await fetchFormByShareToken(formId, shareToken);
        setForm(formData);
        
        console.log('Form data received:', formData);
        
        let surveyJson = formData.surveyJson || formData.survey_json || {};
        
        if (!surveyJson.widthMode) {
          surveyJson.widthMode = 'responsive';
        }
        
        if (!surveyJson.pages && !surveyJson.elements) {
          surveyJson.pages = [];
        }
        
        const mobileInfo = detectMobile();
        if (mobileInfo.isMobile && needsMobileOptimization(surveyJson)) {
          console.log('Optimizing form for mobile display...');
          surveyJson = optimizeFormForMobile(surveyJson);
        }
        
        console.log('Creating survey with JSON:', surveyJson);
        
        const surveyModel = createSurveyModel(surveyJson, { isBuilder: false, isPreview: false });
        
        applySurveyTheme(surveyModel, true);
        
        surveyModel.showCompletedPage = true;
        surveyModel.completedHtml = `
          <div style="text-align: center; padding: 32px;">
            <h2 style="color: #1976d2; margin-bottom: 16px;">Thank You!</h2>
            <p style="font-size: 18px; color: #666; margin-bottom: 24px;">
              Your form has been submitted successfully.
            </p>
            <p style="color: #999;">
              You can safely close this window.
            </p>
          </div>
        `;
        
        addSignatureValidation(surveyModel);
        
        surveyModel.onComplete.add((sender: any) => {
          console.log("--- DEBUG: Form Data Before Cleaning ---");
          console.log(JSON.stringify(sender.data, null, 2));
          
          // Debug body diagram specifically
          console.log('[Survey onComplete] Looking for pain_areas...');
          console.log('[Survey onComplete] All question names:', 
            sender.getAllQuestions().map((q: any) => q.name));
          console.log('[Survey onComplete] All question values:', 
            sender.getAllQuestions().map((q: any) => ({ name: q.name, value: q.value })));
          
          // Get plain data from SurveyJS (not the proxy object)
          const plainData = sender.getPlainData();
          console.log('[Survey onComplete] Plain data from getPlainData():', plainData);
          console.log('[Survey onComplete] Plain data keys:', Object.keys(plainData));
          
          const painQuestion = sender.getQuestionByName('pain_areas');
          if (painQuestion) {
            console.log('[Survey onComplete] Found pain_areas question:', painQuestion);
            console.log('[Survey onComplete] pain_areas value:', painQuestion.value);
            console.log('[Survey onComplete] pain_areas isEmpty:', painQuestion.isEmpty());
            
            // Force the pain_areas data into plainData if it exists
            if (painQuestion.value && !plainData.pain_areas) {
              console.log('[Survey onComplete] Manually adding pain_areas to plainData');
              plainData.pain_areas = painQuestion.value;
            }
          }
          
          // Also check all other bodypaindiagram questions
          sender.getAllQuestions().forEach((q: any) => {
            if ((q.getType() === 'bodypaindiagram' || q.getType() === 'bodydiagram2') && q.value && !plainData[q.name]) {
              console.log(`[Survey onComplete] Manually adding ${q.name} to plainData`);
              plainData[q.name] = q.value;
            }
          });

          console.log('[Survey onComplete] Plain data before cleaning:', JSON.stringify(plainData, null, 2));
          const cleanedData = cleanSignatureData(plainData);

          console.log("--- DEBUG: Form Data After Cleaning ---");
          console.log(JSON.stringify(cleanedData, null, 2));
          console.log('[Survey onComplete] Body diagram data preserved?', cleanedData.pain_areas ? 'YES' : 'NO');

          handleFormSubmission(cleanedData);
        });
        
        surveyModel.onUploadFiles.add(async (sender: any, options: any) => {
          console.log('onUploadFiles triggered:', options.name);
          console.log('Files received:', options.files);
          
          const question = sender.getQuestionByName(options.name);
          console.log('Question details:', {
            name: question?.name,
            title: question?.title,
            type: question?.getType()
          });
          
          if (question) {
            const parentPanel = question.parent;
            console.log('Parent panel:', {
              name: parentPanel?.name,
              title: parentPanel?.title
            });
            
            const isInsuranceCard = 
              question.title?.includes('Insurance Card') || 
              parentPanel?.title?.includes('Insurance Card');
            
            if (isInsuranceCard && options.files && options.files.length > 0) {
              console.log('Insurance card detected in onUploadFiles!');
              
              const file = options.files[0];
              const side = question.title?.includes('Front') ? 'front' : 'back';
              
              let statusElement = null;
              if (parentPanel && parentPanel.elements) {
                statusElement = parentPanel.elements.find((el: any) => 
                  el.getType() === 'html' && 
                  (el.name?.includes('status') || el.html?.includes('automatically extracted'))
                );
              }
              
              if (statusElement) {
                statusElement.html = '<p style="color: #1976d2; font-style: italic;">Processing insurance card...</p>';
              }
              
              try {
                if (processInsuranceCard) {
                  console.log('Using real insurance card processor...');
                  await processInsuranceCard(file, side);
                } else {
                  console.log('Using mock processing...');
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  const mockData: Record<string, string> = {
                    'Member ID': 'MOCK123456789',
                    'Member Name': 'John Doe',
                    'Insurance Company': 'Blue Cross Blue Shield',
                    'Group Number': 'GRP98765',
                    'Plan Type': 'PPO',
                    'RX BIN': '003858',
                    'RX PCN': 'A4',
                    'RX Group': 'RXGRP123',
                    'Primary Care Copay': '$25',
                    'Specialist Copay': '$50',
                    'Emergency Room Copay': '$250',
                    'Annual Deductible': '$1,500',
                    'Out-of-Pocket Maximum': '$6,500'
                  };
                  
                  if (parentPanel && parentPanel.elements) {
                    console.log('Panel elements:', parentPanel.elements.length);
                    
                    parentPanel.elements.forEach((el: any) => {
                      console.log('Element:', el.name, el.title, el.getType());
                      
                      if (el.getType() === 'text') {
                        const title: string = el.title || '';
                        if (title && mockData[title]) {
                          el.value = mockData[title];
                          console.log(`Set ${title} to ${mockData[title]}`);
                        }
                      }
                    });
                    
                    sender.render();
                  }
                }
                
                if (statusElement) {
                  statusElement.html = '<p style="color: #4caf50; font-style: italic;">Insurance card processed successfully!</p>';
                }
              } catch (error) {
                console.error('Error processing insurance card:', error);
                if (statusElement) {
                  statusElement.html = '<p style="color: #f44336; font-style: italic;">Failed to process insurance card.</p>';
                }
              }
            }
          }
          
          options.callback('success');
        });
        
        surveyModel.onValueChanged.add(async (sender: any, options: any) => {
          console.log('onValueChanged triggered for:', options.name);
          
          const question = sender.getQuestionByName(options.name);
          if (question && question.getType() === 'file') {
            console.log('File question detected, checking if it\'s an insurance card...');
            
            const parentPanel = question.parent;
            console.log('Parent panel:', parentPanel?.name, parentPanel?.title);
            
            const isInsuranceCard = 
              options.name.includes('insurance') || 
              options.name.includes('card') ||
              (parentPanel && (parentPanel.title?.includes('Insurance Card') || parentPanel.name?.includes('insurance'))) ||
              (question.title && (question.title.includes('Insurance Card') || question.title.includes('Front of Insurance Card') || question.title.includes('Back of Insurance Card')));
            
            if (isInsuranceCard) {
              console.log('Insurance card upload detected!');
              console.log('processInsuranceCard available:', !!processInsuranceCard);
              
              const files = question?.value;
              
              console.log('Question value:', files);
              
              if (!files || files.length === 0) {
                console.log('No files found in question value');
                return;
              }
            
            const file = files[0];
            const side = (question.title && question.title.includes('Front')) ? 'front' : 'back';
            
            console.log('Insurance card file:', file);
            console.log('File type:', typeof file);
            console.log('Is File instance:', file instanceof File);
            console.log('File properties:', Object.keys(file));
            
            const processedKey = `${options.name}_processed`;
            if (question[processedKey] === file.name) return;
            
            question[processedKey] = file.name;
            
            let statusElement = null;
            if (parentPanel && parentPanel.elements) {
              statusElement = parentPanel.elements.find((el: any) => 
                el.getType() === 'html' && 
                (el.name?.includes('status') || el.html?.includes('automatically extracted'))
              );
            }
            
            if (statusElement) {
              statusElement.html = '<p style="color: #1976d2; font-style: italic;">Processing insurance card...</p>';
            }
            
            try {
              let fileToProcess = file;
              
              if (file instanceof File) {
                fileToProcess = file;
              } else if (typeof file === 'string') {
                let base64Data = file;
                
                if (file.startsWith('data:')) {
                  base64Data = file.split(',')[1];
                }
                
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                
                fileToProcess = new File([blob], `insurance_card_${side}.jpg`, { type: 'image/jpeg' });
              } else if (file.content) {
                const blob = await fetch(file.content).then(r => r.blob());
                fileToProcess = new File([blob], file.name || `insurance_card_${side}.jpg`, { type: file.type || 'image/jpeg' });
              }
              
              console.log('Processing with Gemini insurance card service...');
              console.log('File to process:', fileToProcess);
              
              try {
                const extractedData = await insuranceCardGeminiService.parseInsuranceCard(fileToProcess, side);
                console.log('Extracted data:', extractedData);
                
                if (parentPanel && parentPanel.elements) {
                  const fieldMapping: Record<string, string> = {
                    'Member ID': extractedData.memberId || '',
                    'Member Name': extractedData.memberName || '',
                    'Insurance Company': extractedData.issuerName || '',
                    'Group Number': extractedData.groupNumber || '',
                    'Plan Type': extractedData.planType || '',
                    'RX BIN': extractedData.rxBin || '',
                    'RX PCN': extractedData.rxPcn || '',
                    'RX Group': extractedData.rxGroup || '',
                    'Primary Care Copay': extractedData.copayPcp || '',
                    'Specialist Copay': extractedData.copaySpecialist || '',
                    'Emergency Room Copay': extractedData.copayEmergency || '',
                    'Annual Deductible': extractedData.deductible || '',
                    'Out-of-Pocket Maximum': extractedData.outOfPocketMax || ''
                  };
                  
                  parentPanel.elements.forEach((el: any) => {
                    if (el.getType() === 'text') {
                      const title: string = el.title || '';
                      if (title && fieldMapping[title]) {
                        el.value = fieldMapping[title];
                        console.log(`Set ${title} to ${fieldMapping[title]}`);
                      }
                    }
                  });
                  
                  sender.render();
                }
                
                if (statusElement) {
                  statusElement.html = '<p style="color: #4caf50; font-style: italic;">Insurance card processed successfully!</p>';
                }
              } catch (processingError) {
                console.error('Error processing insurance card:', processingError);
                if (statusElement) {
                  statusElement.html = '<p style="color: #f44336; font-style: italic;">Error processing card. Check console for details.</p>';
                }
              }
            } catch (error) {
              console.error('Error processing insurance card:', error);
              if (statusElement) {
                statusElement.html = '<p style="color: #f44336; font-style: italic;">Failed to process insurance card. Please enter information manually.</p>';
              }
            }
          }
          }
        });
        
        surveyModelRef.current = surveyModel;
        setIsSurveyReady(true);
        setError(null);
      } catch (err: any) {
        console.error('Error loading form:', err);
        console.error('Error stack:', err.stack);
        setError(err.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId, shareToken]);

  useEffect(() => {
    ensureViewportMeta();
    
    const mobileInfo = detectMobile();
    setIsMobile(mobileInfo.isMobile);
    
    if (formContainerRef.current) {
      applyMobileTheme(formContainerRef.current, true);
    }
    
    if (mobileInfo.isMobile && isSurveyReady && surveyModelRef.current) {
      optimizeSurveyModelForMobile(surveyModelRef.current);
      
      setTimeout(async () => {
        console.log('🔍 Running mobile theme diagnostics...');
        const results = await mobileDiagnostics.runAllTests();
        mobileDiagnostics.logResults();
        
        if (process.env.NODE_ENV === 'development') {
          mobileDiagnostics.createVisualDebugOverlay();
        }
      }, 1000);
    }
    
    const handleResize = () => {
      const mobileInfo = detectMobile();
      setIsMobile(mobileInfo.isMobile);
      if (formContainerRef.current) {
        applyMobileTheme(formContainerRef.current, true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      removeMobileThemeOverrides();
    };
  }, [isSurveyReady]);

  const handleFormSubmission = async (formData: any) => {
    try {
      console.log('Form submitted with data:', formData);
      
      // Clean the pain_areas array to remove non-serializable properties
      if (formData.pain_areas && Array.isArray(formData.pain_areas)) {
        console.log('[BodyDiagram Debug] Original pain_areas:', formData.pain_areas);
        
        // Clean the array by creating new plain objects
        formData.pain_areas = formData.pain_areas.map((mark: any) => ({
          id: mark.id,
          x: mark.x,
          y: mark.y,
          intensity: mark.intensity,
          label: mark.label || undefined
        })).filter((mark: any) => mark.id && typeof mark.x === 'number' && typeof mark.y === 'number');
        
        console.log('[BodyDiagram Debug] Cleaned pain_areas:', formData.pain_areas);
        console.log('[BodyDiagram Debug] pain_areas length:', formData.pain_areas.length);
      }
      
      console.log('[DOB Check] patient_dob value:', formData.patient_dob);
      console.log('[DOB Check] patient_age value:', formData.patient_age);
      console.log('[DOB Check] All form keys:', Object.keys(formData));
      
      console.log('Submitting to backend. Full payload:', JSON.stringify({
        form_id: formId,
        share_token: shareToken,
        response_data: formData
      }, null, 2));

      const response = await fetch(apiEndpoints.responses.submitPublic(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_id: formId,
          share_token: shareToken,
          response_data: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      console.log('Form submission successful');
    } catch (error) {
      
      alert('Failed to submit form. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    if (password === 'test') { 
      setPasswordDialogOpen(false);
      setPasswordError('');
    } else {
      setPasswordError('Invalid password');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" className="tw-py-16">
        <Box className="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <CircularProgress />
          <Typography variant="h6" color="text.secondary">
            Loading form...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" className="tw-py-16">
        <Alert severity="error" className="tw-mb-4">
          <Typography variant="h6" gutterBottom>
            Form Not Available
          </Typography>
          <Typography>
            {error}
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (passwordDialogOpen) {
    return (
      <>
        <Container maxWidth="md" className="tw-py-16">
          <Paper className="tw-p-8 tw-text-center">
            <Typography variant="h5" gutterBottom>
              Password Protected Form
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This form requires a password to access.
            </Typography>
          </Paper>
        </Container>

        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>Enter Password</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              className="tw-mt-2"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit} variant="contained">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  if (isMobile && isSurveyReady && surveyModelRef.current) {
    return (
      <Box ref={formContainerRef} className="patient-form-view mobile-minimal">
        <Survey model={surveyModelRef.current} />
      </Box>
    );
  }

  return (
    <Box ref={formContainerRef} className="patient-form-view tw-min-h-screen" style={{ backgroundColor: designTokens.colors.warm.beige }}>
      <Box className="tw-bg-primary-700 tw-text-white tw-py-8 tw-mb-8">
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {form?.title || 'Healthcare Form'}
          </Typography>
          {form?.description && (
            <Typography variant="h6" className="tw-opacity-90">
              {form.description}
            </Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" className="tw-pb-8">
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
          {isSurveyReady && surveyModelRef.current ? (
            <Survey model={surveyModelRef.current} />
          ) : (
            <Alert severity="warning">
              Unable to load form. Please try again later.
            </Alert>
          )}
        </div>

        <Box className="tw-mt-8 tw-text-center">
          <Typography variant="body2" color="text.secondary">
            Powered by HealthForms - HIPAA Compliant Form Platform
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
