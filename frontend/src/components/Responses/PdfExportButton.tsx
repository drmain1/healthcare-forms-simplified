
import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { GetApp } from '@mui/icons-material';
import axios from 'axios';
import { firebaseAuth } from '../../services/firebaseAuth';

interface PdfExportButtonProps {
  formId: string;
  responseId: string;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  formId,
  responseId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleExportPdf = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await firebaseAuth.getIdToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setIsLoading(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      
      const response = await axios.post(
        `${apiUrl}/responses/${responseId}/generate-pdf`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-${responseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      
      const errorMessage = err.response?.data?.error || 'An unknown error occurred.';
      setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};
