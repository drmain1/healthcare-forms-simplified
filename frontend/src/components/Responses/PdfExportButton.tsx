import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { GetApp } from '@mui/icons-material';
import { useGenerateResponsePdfMutation } from '../../store/api/formsApi';

interface PdfExportButtonProps {
  formId: string;
  responseId: string;
  form: any;
  response: any;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  formId,
  responseId,
  form,
  response
}) => {
  const [error, setError] = useState<string | null>(null);
  const [generatePdf, { isLoading }] = useGenerateResponsePdfMutation();
  
  const handleExportPdf = async () => {
    try {
      const result = await generatePdf({
        formId,
        responseId,
        includeSummary: true, // Always include AI summary
      }).unwrap();

      const url = result;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.patient_name || 'Anonymous'}_${form.title}_${new Date()
        .toLocaleDateString()
        .replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url); // Clean up the object URL
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };
  
  return (
    <>
      <Button
        variant="outlined"
        startIcon={isLoading ? <CircularProgress size={16} /> : <GetApp />}
        onClick={handleExportPdf}
        disabled={isLoading}
      >
        Export PDF
      </Button>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};