import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

// Initialize Vertex AI
const PROJECT_ID = process.env.REACT_APP_GCP_PROJECT_ID || '';
const LOCATION = process.env.REACT_APP_GCP_LOCATION || 'us-central1';
const MODEL = 'gemini-2.0-flash-002'; // Latest stable model

// Note: For frontend applications, you'll need to set up a backend proxy
// or use service account credentials securely. Direct Vertex AI calls
// from frontend require proper authentication setup.

class VertexAIService {
  private vertexAI: VertexAI;
  private generativeModel: any;

  constructor() {
    // Initialize Vertex AI with project details
    this.vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });

    // Initialize the generative model
    this.generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1, // Low temperature for consistent form generation
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
  }

  async generateFormFromExtractedText(extractedText: string): Promise<any> {
    const prompt = `You are an expert medical form designer. Convert the following extracted PDF text into a complete SurveyJS JSON structure.

EXTRACTED TEXT:
${extractedText}

REQUIREMENTS:
1. Generate a complete, valid SurveyJS JSON
2. Preserve all fields and questions from the original form
3. Use appropriate question types (text, radiogroup, checkbox, dropdown, etc.)
4. Include validation where appropriate
5. Organize into logical sections/pages
6. Add conditional logic where indicated in the original form

OUTPUT FORMAT:
Return ONLY the JSON object with this structure:
{
  "form": {
    "title": "Form Title",
    "pages": [
      {
        "name": "page1",
        "elements": [...]
      }
    ]
  }
}

Generate the complete SurveyJS JSON now:`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const response = await this.generativeModel.generateContent(request);
      const result = response.response;
      
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const text = result.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const formJson = JSON.parse(jsonMatch[0]);
      return formJson;
    } catch (error) {
      console.error('Vertex AI error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate form with Vertex AI: ${errorMessage}`);
    }
  }

  async generateFormFromPrompt(prompt: string): Promise<any> {
    const systemPrompt = `You are an expert medical form designer. Create a professional healthcare form based on the user's description.

Generate a complete SurveyJS JSON with:
- Appropriate question types and validation
- Logical organization into sections/pages
- Professional healthcare terminology
- HIPAA-compliant field naming

Return ONLY valid JSON matching this structure:
{
  "title": "Form Title",
  "pages": [
    {
      "name": "page1",
      "elements": [...]
    }
  ]
}`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }],
          },
        ],
      };

      const response = await this.generativeModel.generateContent(request);
      const result = response.response;
      
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const text = result.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const formJson = JSON.parse(jsonMatch[0]);
      return formJson;
    } catch (error) {
      console.error('Vertex AI error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate form with Vertex AI: ${errorMessage}`);
    }
  }
}

// Export service instance and methods
const vertexAIService = new VertexAIService();
export default vertexAIService;
export const generateFormJsonFromTextVertexAI = (extractedText: string) => 
  vertexAIService.generateFormFromExtractedText(extractedText);
export const generateFormFromPromptVertexAI = (prompt: string) => 
  vertexAIService.generateFormFromPrompt(prompt);