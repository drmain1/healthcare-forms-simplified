import axios from 'axios';

/**
 * Calls the backend to process a PDF file with Vertex AI and generate a form.
 * @param {string} base64Pdf - The base64-encoded PDF string.
 * @param {string} token - The Firebase auth token for authorization.
 * @returns {Promise<any>} - A promise that resolves with the generated SurveyJS JSON.
 */
export const generateFormFromPdfViaBackend = async (base64Pdf: string, token: string): Promise<any> => {
  // When REACT_APP_API_URL is empty string, we're on production domain (form.easydocforms.com)
  // which already proxies /api/* requests, so we use empty prefix to avoid double /api/api
  const apiUrl = process.env.REACT_APP_API_URL === '' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
  
  // Build the endpoint URL - when apiUrl is empty, don't add /api prefix since axios.defaults.baseURL already has it
  const endpoint = apiUrl 
    ? `${apiUrl}/forms/process-pdf-with-vertex`
    : `/forms/process-pdf-with-vertex`;  // No /api prefix here - axios adds it
  
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