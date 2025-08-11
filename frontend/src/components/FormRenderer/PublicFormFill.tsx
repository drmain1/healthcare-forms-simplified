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
import { createSurveyModel } from '../../utils/surveyConfig';
import { useInsuranceCardProcessor } from '../../hooks/useInsuranceCardProcessor';
import insuranceCardGeminiService from '../../services/insuranceCardGeminiService';
import { designTokens } from '../../styles/design-tokens';
import { applySurveyTheme, patientFormTheme } from '../../config/surveyThemes';
import { addSignatureValidation, cleanSignatureData } from '../../utils/signatureValidation';
import { apiEndpoints } from '../../config/api';
import { 
  detectMobile, 
  applyMobileTheme, 
  createMobileStatusBar, 
  createMobileFormTitle,
  ensureViewportMeta 
} from '../../utils/mobileDetection';
import '../../styles/mobile-minimal.css';
import { mobileDiagnostics } from '../../utils/mobileDiagnostics';
import { removeMobileThemeOverrides } from '../../utils/mobileThemeFix';
import { optimizeFormForMobile, optimizeSurveyModelForMobile, needsMobileOptimization } from '../../utils/mobileFormOptimizer';
import '../FormBuilder/DateOfBirthQuestion';

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
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const { processInsuranceCard, isProcessing } = useInsuranceCardProcessor(survey);

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
        
        // Debug log to see what we're getting
        console.log('Form data received:', formData);
        
        // Create survey instance
        // Ensure surveyJson exists and has proper structure
        let surveyJson = formData.surveyJson || formData.survey_json || {};
        
        // Add default widthMode if missing
        if (!surveyJson.widthMode) {
          surveyJson.widthMode = 'responsive';
        }
        
        // Ensure surveyJson has at least the minimum structure
        if (!surveyJson.pages && !surveyJson.elements) {
          surveyJson.pages = [];
        }
        
        // Optimize form for mobile if needed
        const mobileInfo = detectMobile();
        if (mobileInfo.isMobile && needsMobileOptimization(surveyJson)) {
          console.log('Optimizing form for mobile display...');
          surveyJson = optimizeFormForMobile(surveyJson);
        }
        
        console.log('Creating survey with JSON:', surveyJson);
        
        const surveyModel = createSurveyModel(surveyJson, { isBuilder: false, isPreview: false });
        
        // Apply patient form theme with panelless view
        applySurveyTheme(surveyModel, true);
        
        // Configure survey for public filling
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
        
        // Add signature validation
        addSignatureValidation(surveyModel);
        
        // Handle form submission
        surveyModel.onComplete.add((sender: any) => {
          console.log("--- DEBUG: Form Data Before Cleaning ---");
          console.log(JSON.stringify(sender.data, null, 2));

          // Clean signature data before submission (removes empty signatures)
          const cleanedData = cleanSignatureData(sender.data);

          console.log("--- DEBUG: Form Data After Cleaning ---");
          console.log(JSON.stringify(cleanedData, null, 2));

          handleFormSubmission(cleanedData);
        });
        
        // Handle file uploads - required by SurveyJS
        surveyModel.onUploadFiles.add(async (sender: any, options: any) => {
          console.log('onUploadFiles triggered:', options.name);
          console.log('Files received:', options.files);
          
          // Check if this is an insurance card upload
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
            
            // Check if this is an insurance card
            const isInsuranceCard = 
              question.title?.includes('Insurance Card') || 
              parentPanel?.title?.includes('Insurance Card');
            
            if (isInsuranceCard && options.files && options.files.length > 0) {
              console.log('Insurance card detected in onUploadFiles!');
              
              // Process the insurance card here since onValueChanged might not fire
              const file = options.files[0];
              const side = question.title?.includes('Front') ? 'front' : 'back';
              
              // Find status element
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
                // Check if we have the processor available
                if (processInsuranceCard) {
                  // Use the real processor
                  console.log('Using real insurance card processor...');
                  await processInsuranceCard(file, side);
                } else {
                  // Fallback to mock processing
                  console.log('Using mock processing...');
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  // Mock data with all fields
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
                  
                  // Populate fields - we need to handle all elements in the panel
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
                    
                    // Force survey to update
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
          
          // Accept the file
          options.callback('success');
        });
        
        // Handle insurance card uploads - use onValueChanged for processing
        surveyModel.onValueChanged.add(async (sender: any, options: any) => {
          console.log('onValueChanged triggered for:', options.name);
          
          // Check if this is a file question that might be an insurance card
          const question = sender.getQuestionByName(options.name);
          if (question && question.getType() === 'file') {
            console.log('File question detected, checking if it\'s an insurance card...');
            
            // Check if this file question is part of an insurance card panel
            const parentPanel = question.parent;
            console.log('Parent panel:', parentPanel?.name, parentPanel?.title);
            
            // More flexible check - look for insurance-related keywords
            const isInsuranceCard = 
              options.name.includes('insurance') || 
              options.name.includes('card') ||
              (parentPanel && (parentPanel.title?.includes('Insurance Card') || parentPanel.name?.includes('insurance'))) ||
              (question.title && (question.title.includes('Insurance Card') || question.title.includes('Front of Insurance Card') || question.title.includes('Back of Insurance Card')));
            
            if (isInsuranceCard) {
              console.log('Insurance card upload detected!');
              console.log('processInsuranceCard available:', !!processInsuranceCard);
              console.log('Survey instance:', !!survey, survey === sender);
              
              const files = question?.value;
              
              console.log('Question value:', files);
              
              if (!files || files.length === 0) {
                console.log('No files found in question value');
                return;
              }
            
            const file = files[0];
            // Determine side based on question title since names are auto-generated
            const side = (question.title && question.title.includes('Front')) ? 'front' : 'back';
            
            // Debug: Log the file structure
            console.log('Insurance card file:', file);
            console.log('File type:', typeof file);
            console.log('Is File instance:', file instanceof File);
            console.log('File properties:', Object.keys(file));
            
            // Check if we've already processed this file
            const processedKey = `${options.name}_processed`;
            if (question[processedKey] === file.name) return;
            
            // Mark as processed to avoid duplicate processing
            question[processedKey] = file.name;
            
            // Show processing indicator - find the status element in the same panel
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
              // For camera captures, the file might be a data URL or base64
              let fileToProcess = file;
              
              // If it's a File object, use it directly
              if (file instanceof File) {
                fileToProcess = file;
              } else if (typeof file === 'string') {
                // If it's a base64 string or data URL
                let base64Data = file;
                
                // If it's a data URL, extract the base64 part
                if (file.startsWith('data:')) {
                  base64Data = file.split(',')[1];
                }
                
                // Convert base64 to blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                
                fileToProcess = new File([blob], `insurance_card_${side}.jpg`, { type: 'image/jpeg' });
              } else if (file.content) {
                // If it's stored as an object with content property
                const blob = await fetch(file.content).then(r => r.blob());
                fileToProcess = new File([blob], file.name || `insurance_card_${side}.jpg`, { type: file.type || 'image/jpeg' });
              }
              
              // Process using Gemini service directly
              console.log('Processing with Gemini insurance card service...');
              console.log('File to process:', fileToProcess);
              
              try {
                // Call the Gemini service
                const extractedData = await insuranceCardGeminiService.parseInsuranceCard(fileToProcess, side);
                console.log('Extracted data:', extractedData);
                
                // Populate the form fields in the same panel
                if (parentPanel && parentPanel.elements) {
                  // Map extracted data to form fields
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
                  
                  // Force survey to update
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
        
        setSurvey(surveyModel);
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

  // Mobile detection and theme application
  useEffect(() => {
    // Ensure proper viewport
    ensureViewportMeta();
    
    // Detect mobile and set state
    const mobileInfo = detectMobile();
    setIsMobile(mobileInfo.isMobile);
    
    // Apply mobile theme to form container
    if (formContainerRef.current) {
      applyMobileTheme(formContainerRef.current, true);
    }
    
    // Apply mobile theme fix if on mobile
    if (mobileInfo.isMobile && survey) {
      // Force mobile theme to override SurveyJS theme
      // forceMobileTheme(survey); // Commented out - using minimal CSS approach
      
      // Also optimize the survey model at runtime
      optimizeSurveyModelForMobile(survey);
      
      // Run diagnostics after a short delay to ensure DOM is ready
      setTimeout(async () => {
        console.log('🔍 Running mobile theme diagnostics...');
        const results = await mobileDiagnostics.runAllTests();
        mobileDiagnostics.logResults();
        
        // Also create visual debug overlay to show problem areas
        if (process.env.NODE_ENV === 'development') {
          mobileDiagnostics.createVisualDebugOverlay();
        }
      }, 1000);
    }
    
    // Handle resize events
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
      // Clean up mobile theme overrides
      removeMobileThemeOverrides();
    };
  }, [survey]); // Re-run when survey changes

  const handleFormSubmission = async (formData: any) => {
    try {
      console.log('Form submitted with data:', formData);
      console.log('[DOB Check] patient_dob value:', formData.patient_dob);
      console.log('[DOB Check] patient_age value:', formData.patient_age);
      console.log('[DOB Check] All form keys:', Object.keys(formData));
      
      // Send to public submission endpoint
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
      
      // Show error to user
      alert('Failed to submit form. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    // TODO: Validate password with backend
    if (password === 'test') { // Placeholder validation
      setPasswordDialogOpen(false);
      setPasswordError('');
    } else {
      setPasswordError('Invalid password');
    }
  };

  // Loading state
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

  // Error state
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

  // Password protection dialog
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

  // Main form display
  if (isMobile && survey) {
    // Mobile view with dark theme
    return (
      <Box ref={formContainerRef} className="patient-form-view mobile-minimal">
        {/* Survey Form */}
        <Survey model={survey} />
      </Box>
    );
  }

  // Desktop view (existing)
  return (
    <Box ref={formContainerRef} className="patient-form-view tw-min-h-screen" style={{ backgroundColor: designTokens.colors.warm.beige }}>
      {/* Header */}
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

      {/* Form Content */}
      <Container maxWidth="md" className="tw-pb-8">
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
          {survey ? (
            <Survey model={survey} />
          ) : (
            <Alert severity="warning">
              Unable to load form. Please try again later.
            </Alert>
          )}
        </div>

        {/* Footer */}
        <Box className="tw-mt-8 tw-text-center">
          <Typography variant="body2" color="text.secondary">
            Powered by HealthForms - HIPAA Compliant Form Platform
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};