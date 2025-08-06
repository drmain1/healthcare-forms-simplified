import axios from 'axios';
import { getApiUrl } from '../config/api';

/**
 * Calls the backend to process a PDF file with Vertex AI and generate a form.
 * @param {string} base64Pdf - The base64-encoded PDF string.
 * @param {string} token - The Firebase auth token for authorization.
 * @returns {Promise<any>} - A promise that resolves with the generated SurveyJS JSON.
 */
export const generateFormFromPdfViaBackend = async (base64Pdf: string, token: string): Promise<any> => {
  const endpoint = `${getApiUrl()}/forms/process-pdf-with-vertex`;
  
  try {
    const response = await axios.post(
      endpoint,
      { pdf_data: base64Pdf },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to process PDF via backend.');
    }
    throw new Error('An unknown error occurred while processing the PDF.');
  }
};