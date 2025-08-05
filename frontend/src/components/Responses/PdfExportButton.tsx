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
  form: any;
  response: any;
  getHtmlContent: () => string;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  formId,
  responseId,
  form,
  response,
  getHtmlContent
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleExportPdf = async () => {
    setIsLoading(true);
    try {
      // Get the HTML content from the parent component
      const htmlContent = getHtmlContent();
      
      if (!htmlContent) {
        setError('Unable to capture form content. Please try again.');
        setIsLoading(false);
        return;
      }

      // Wrap the HTML content with proper styling
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .sd-root-modern { background-color: transparent; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Send HTML to backend for PDF conversion
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
      const token = await firebaseAuth.getIdToken();
      
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      const apiResponse = await axios.post(
        `${apiUrl}/forms/${formId}/export-html-to-pdf`,
        { 
          html: styledHtml,
          filename: `${response.patient_name || 'Anonymous'}_${form.title}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const blob = new Blob([apiResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.patient_name || 'Anonymous'}_${form.title}_${new Date()
        .toLocaleDateString()
        .replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setError('Failed to generate PDF. Please try again.');
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
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};