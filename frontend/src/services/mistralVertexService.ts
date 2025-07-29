// Mistral OCR Service using Vertex AI REST API
// This implementation uses direct REST API calls for browser compatibility

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Copy the worker file to public folder first, then reference it
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID || '';
const LOCATION = process.env.REACT_APP_GCP_LOCATION || 'us-central1';

// Mistral OCR endpoint - trying different formats based on the service parameter
// Option 1: Standard Vertex AI endpoint
// const MISTRAL_OCR_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/mistralai/models/mistral-ocr-2505:generateContent`;

// Option 2: Partner service endpoint (based on service=mistral-ocr-2505.cloudpartnerservices.goog)
// const MISTRAL_OCR_ENDPOINT = `https://mistral-ocr-2505.cloudpartnerservices.goog/v1/projects/${PROJECT_ID}/locations/${LOCATION}/models/mistral-ocr-2505:generateContent`;

// Try with generateContent endpoint for image processing
const MISTRAL_OCR_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/mistralai/models/mistral-ocr-2505:generateContent`;

// You'll need to get an access token. Options:
// 1. Use Firebase Auth + Cloud Functions to get a token
// 2. Use a backend proxy that adds authentication
// 3. For development only: manually get a token using gcloud CLI
const getAccessToken = async (): Promise<string> => {
  // Option 1: If you have a token endpoint in your backend
  // const response = await fetch('/api/get-vertex-token');
  // const data = await response.json();
  // return data.accessToken;
  
  // Option 2: If you're using Firebase Auth
  // const auth = getAuth();
  // const token = await auth.currentUser?.getIdToken();
  // return token;
  
  // Option 3: For development, you might have it in env (NOT for production!)
  const token = process.env.REACT_APP_VERTEX_ACCESS_TOKEN || '';
  if (!token) {
    throw new Error('Vertex AI access token not configured. Please set up authentication.');
  }
  return token;
};

/**
 * Converts a PDF page to a base64 JPEG image
 * @param {PDFPageProxy} page - The PDF page object
 * @param {number} scale - The scale factor for rendering (higher = better quality)
 * @returns {Promise<string>} - Base64 encoded JPEG image
 */
const convertPageToBase64Image = async (page: PDFPageProxy, scale: number = 2.0): Promise<string> => {
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  
  // Convert canvas to base64 JPEG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove the data:image/jpeg;base64, prefix
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      0.95 // JPEG quality
    );
  });
};

/**
 * Extracts text content from a PDF using Mistral OCR on Vertex AI
 * @param {string} base64PdfString - The Base64 encoded string of the PDF file (without data: prefix)
 * @returns {Promise<string>} - A promise that resolves with the extracted markdown text
 */
export const extractPdfContentViaOcrVertexAI = async (base64PdfString: string): Promise<string> => {
  console.log('Extracting PDF content using Mistral OCR on Vertex AI REST API');
  
  try {
    const accessToken = await getAccessToken();
    
    // Convert base64 PDF to Uint8Array
    const pdfData = atob(base64PdfString);
    const pdfArray = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      pdfArray[i] = pdfData.charCodeAt(i);
    }
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfArray });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    // Process each page
    let allPagesMarkdown = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum} of ${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNum);
      const imageBase64 = await convertPageToBase64Image(page, 2.0); // Scale of 2.0 for good quality
      
      // Construct the request payload for generateContent endpoint with image
      const payload = {
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }]
        }]
      };

      const response = await fetch(MISTRAL_OCR_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Vertex AI API Error for page ${pageNum}:`, response.status, errorText);
        // Continue with other pages even if one fails
        continue;
      }

      const responseData = await response.json();
      console.log(`Vertex AI OCR Response for page ${pageNum}:`, responseData);

      let pageMarkdown = '';

      // Check for chat completion response format (most likely for rawPredict)
      if (responseData.choices && Array.isArray(responseData.choices) && responseData.choices.length > 0) {
        const choice = responseData.choices[0];
        if (choice.message && choice.message.content) {
          pageMarkdown = choice.message.content;
        }
      }

      // Check for pages array (Mistral OCR specific format from direct API)
      else if (responseData.pages && Array.isArray(responseData.pages)) {
        responseData.pages.forEach((page: any) => {
          if (page && typeof page.markdown === 'string') {
            pageMarkdown += page.markdown + '\n\n';
          } else if (page && typeof page.text === 'string') {
            pageMarkdown += page.text + '\n\n';
          }
        });
      }

      // Check for direct text property
      else if (responseData.text) {
        pageMarkdown = responseData.text;
      }

      // Check for output property
      else if (responseData.output) {
        pageMarkdown = responseData.output;
      }

      // Fallback for generateContent format
      else if (responseData.candidates && responseData.candidates.length > 0) {
        const candidate = responseData.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          pageMarkdown = candidate.content.parts[0].text || '';
        }
      }
      
      // Fallback for predictions format
      else if (responseData.predictions && responseData.predictions.length > 0) {
        const prediction = responseData.predictions[0];
        pageMarkdown = prediction.content || prediction.text || prediction.output || '';
      }

      if (pageMarkdown) {
        console.log(`Page ${pageNum} OCR successful, text length:`, pageMarkdown.length);
        allPagesMarkdown += pageMarkdown.trim() + '\n\n---\n\n'; // Add page separator
      } else {
        console.warn(`Page ${pageNum} yielded no text content`);
      }
    }
    
    if (!allPagesMarkdown.trim()) {
      throw new Error('OCR process yielded no text content from any pages');
    }
    
    console.log('Total OCR extraction successful, combined text length:', allPagesMarkdown.length);
    return allPagesMarkdown.trim();
  } catch (error) {
    console.error('Vertex AI OCR error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract PDF content via Vertex AI OCR: ${errorMessage}`);
  }
};

// Alternative implementation using a backend proxy (recommended for production)
export const extractPdfContentViaOcrVertexAIProxy = async (base64PdfString: string): Promise<string> => {
  console.log('Extracting PDF content using Mistral OCR via backend proxy');
  
  try {
    // This assumes you have a backend endpoint that handles Vertex AI authentication
    const response = await fetch('/api/ocr/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include your app's auth token if needed
        // 'Authorization': `Bearer ${yourAppAuthToken}`,
      },
      body: JSON.stringify({
        pdfBase64: base64PdfString,
        model: 'mistral-ocr-2505',
        prompt: `Extract ALL text from this PDF form with extreme attention to detail...` // Same prompt as above
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend OCR API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.extractedText;
  } catch (error) {
    console.error('Backend OCR proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract PDF content via backend proxy: ${errorMessage}`);
  }
};