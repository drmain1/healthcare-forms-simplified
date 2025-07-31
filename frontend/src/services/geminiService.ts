// @ts-ignore - TypeScript may have issues finding the module
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker
// Use the correct path for the worker based on environment
if (process.env.NODE_ENV === 'development') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.mjs`;
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

interface FormGenerationResponse {
  title: string;
  description?: string;
  pages: Array<{
    name: string;
    elements: Array<{
      type: string;
      name: string;
      title: string;
      isRequired?: boolean;
      choices?: string[];
      inputType?: string;
      validators?: any[];
      visibleIf?: string;
      rows?: number;
      [key: string]: any;
    }>;
  }>;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized: boolean = false;

  constructor() {
    // Initialization is deferred until a method is called
  }

  private initialize() {
    if (this.initialized) return;
    
    if (!API_KEY) {
      console.error('REACT_APP_GEMINI_API_KEY is not set. Please add it to your .env file.');
      throw new Error('Gemini API key is not configured. Please set REACT_APP_GEMINI_API_KEY in your environment variables.');
    }
    
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    this.initialized = true;
  }

  async generateFormFromText(prompt: string): Promise<FormGenerationResponse> {
    this.initialize();

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonResponse = JSON.parse(text);
      return jsonResponse;
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", text);
      throw new Error("Invalid JSON response from Gemini.");
    }
  }

  async modifyExistingForm(currentFormJson: FormGenerationResponse, modificationPrompt: string): Promise<FormGenerationResponse> {
    this.initialize();

    const prompt = `
      You have an existing SurveyJS form in JSON format. Apply the following modification to it:
      
      Modification request: ${modificationPrompt}
      
      Current form:
      ${JSON.stringify(currentFormJson, null, 2)}
      
      Return the modified form in the same JSON format, maintaining the structure but applying the requested changes.
      Only return valid JSON, no additional text or explanation.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonResponse = JSON.parse(text);
      return jsonResponse;
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", text);
      throw new Error("Invalid JSON response from Gemini.");
    }
  }
}

let geminiServiceInstance: GeminiService | null = null;

const getGeminiService = () => {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
};

export default getGeminiService();

export const generateFormJsonFromTextGemini = (text: string) => {
    const service = getGeminiService();
    const prompt = `Convert the following text into a SurveyJS JSON form:\n\n${text}`;
    return service.generateFormFromText(prompt);
};