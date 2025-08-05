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
  surveyModel?: any;
  isSurveyRendered?: boolean;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  formId,
  responseId,
  form,
  response,
  getHtmlContent,
  surveyModel,
  isSurveyRendered
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleExportPdf = async () => {
    setIsLoading(true);
    try {
      // Solution 3: Force survey re-render if we have the model
      if (surveyModel && !isSurveyRendered) {
        console.log('Forcing survey re-render...');
        surveyModel.render();
      }
      
      // Solution 1: Add delay to ensure rendering is complete
      console.log('Waiting for render completion...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to find the survey container directly
      const surveyContainer = document.querySelector('.sd-root-modern');
      if (surveyContainer) {
        console.log('Found survey container directly');
        console.log('Survey container has text?', surveyContainer.textContent?.includes('?'));
      }
      
      // Get the HTML content from the parent component
      const htmlContent = getHtmlContent();
      
      // Debug logging to understand what's being captured
      console.log('=== PDF Export Debug Info ===');
      console.log('Captured HTML length:', htmlContent.length);
      console.log('Contains .sd-question?', htmlContent.includes('sd-question'));
      console.log('Contains .sd-question__title?', htmlContent.includes('sd-question__title'));
      console.log('Contains any question text?', htmlContent.includes('?')); // Most questions end with ?
      
      // Look for any text content in question titles
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const questionTitles = tempDiv.querySelectorAll('.sd-question__title');
      console.log('Number of question titles found:', questionTitles.length);
      questionTitles.forEach((title, index) => {
        console.log(`Question ${index + 1} text:`, title.textContent);
      });
      
      console.log('First 500 chars:', htmlContent.substring(0, 500));
      console.log('Last 500 chars:', htmlContent.substring(htmlContent.length - 500));
      console.log('=============================');
      
      if (!htmlContent) {
        setError('Unable to capture form content. Please try again.');
        setIsLoading(false);
        return;
      }

      // Solution 4: Inline all CSS from the document
      const getAllCssText = () => {
        let cssText = '';
        for (const styleSheet of Array.from(document.styleSheets)) {
          try {
            if (styleSheet.cssRules) {
              for (const rule of Array.from(styleSheet.cssRules)) {
                cssText += rule.cssText;
              }
            }
          } catch (e) {
            console.warn('Cannot read CSS rules from stylesheet', e);
          }
        }
        return cssText;
      };

      const allCss = getAllCssText();
      
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${allCss}
            /* Additional print-specific styles */
            body {
              background-color: #fff !important; /* Ensure background is white */
            }
            @media print {
              .sd-question {
                page-break-inside: avoid;
              }
              /* Hide any buttons or interactive elements that shouldn't be in the PDF */
              .no-print, .MuiButton-root {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="sd-root-modern">
            ${htmlContent}
          </div>
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