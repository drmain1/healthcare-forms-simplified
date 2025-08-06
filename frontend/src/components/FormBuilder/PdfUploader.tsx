import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as PdfIcon,
  AutoAwesome as AiIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { generateFormFromPdfViaBackend } from '../../services/vertexAIService';

interface PdfUploaderProps {
  onFormGenerated: (surveyJson: any) => void;
  onError: (error: string) => void;
}

interface ProcessingState {
  step: number;
  isProcessing: boolean;
  progress: number;
  statusMessage: string;
  error?: string;
}

const steps = [
  {
    label: 'Upload PDF',
    description: 'Select and upload your PDF form',
  },
  {
    label: 'Process PDF',
    description: 'Backend service processes PDF securely',
  },
  {
    label: 'Generate Form',
    description: 'Gemini 2.5 Pro creates form structure',
  },
  {
    label: 'Finalize',
    description: 'Prepare form for editing',
  },
];

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onFormGenerated, onError }) => {
  const { user } = useFirebaseAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    step: 0,
    isProcessing: false,
    progress: 0,
    statusMessage: '',
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        onError('Please select a PDF file');
      }
    }
  }, [onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        onError('Please select a PDF file');
      }
    }
  }, [onError]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const updateProcessingState = (step: number, progress: number, statusMessage: string) => {
    setProcessing(prev => ({
      ...prev,
      step,
      progress,
      statusMessage,
    }));
  };

  const processFile = async () => {
    if (!selectedFile) {
      onError('Please select a file first.');
      return;
    }
    if (!user || !user.idToken) {
      onError('You must be logged in to process a form.');
      return;
    }

    setProcessing({
      step: 0,
      isProcessing: true,
      progress: 0,
      statusMessage: 'Starting secure AI processing...',
    });

    try {
      // Step 1: Convert file to base64
      updateProcessingState(1, 25, 'Preparing PDF for upload...');
      const base64Pdf = await convertFileToBase64(selectedFile);

      // Step 2: Call backend to process with Vertex AI
      updateProcessingState(2, 50, 'Processing PDF with secure backend service...');
      const formSchema = await generateFormFromPdfViaBackend(base64Pdf, user.idToken);
      console.log('Backend PDF processing successful');

      // Step 3: Finalize and load the form
      updateProcessingState(3, 90, 'Finalizing form...');
      if (!formSchema) {
        throw new Error('Backend did not return a valid form schema.');
      }

      updateProcessingState(4, 100, 'Form generated successfully!');
      
      setTimeout(() => {
        onFormGenerated(formSchema);
        setProcessing(prev => ({ ...prev, isProcessing: false, step: 0 }));
      }, 1000);

    } catch (error: any) {
      
      setProcessing(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Failed to process PDF.',
      }));
      onError(error.message || 'Failed to process PDF.');
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setProcessing({
      step: 0,
      isProcessing: false,
      progress: 0,
      statusMessage: '',
    });
  };

  if (processing.isProcessing || processing.step > 0) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Processing PDF Form
        </Typography>
        
        <Stepper activeStep={processing.step} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={
                  index === 0 ? <PdfIcon /> :
                  index === 1 ? <AiIcon /> :
                  index === 2 ? <AiIcon /> :
                  index === 3 ? <AiIcon /> :
                  <BuildIcon />
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                {index === processing.step && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={processing.progress} 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {processing.statusMessage}
                    </Typography>
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {processing.error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {processing.error}
            <Button onClick={resetUploader} sx={{ ml: 2 }}>
              Try Again
            </Button>
          </Alert>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 4,
        border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
        backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
        transition: 'all 0.3s ease',
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          // Only trigger file selection if clicking on the Box itself, not on buttons
          if (e.target === e.currentTarget || 
              (e.target instanceof HTMLElement && !e.target.closest('button'))) {
            document.getElementById('pdf-file-input')?.click();
          }
        }}
      >
        <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Upload PDF Form
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Drag and drop your PDF form here, or click to select a file
        </Typography>

        {selectedFile && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="primary.main">
              Selected: {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        )}

        <input
          id="pdf-file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('pdf-file-input')?.click();
            }}
          >
            Choose File
          </Button>
          
          {selectedFile && (
            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                processFile();
              }}
              startIcon={<AiIcon />}
            >
              Generate Form
            </Button>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Supports PDF files up to 10MB
        </Typography>
      </Box>
    </Paper>
  );
};