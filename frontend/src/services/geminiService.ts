// @ts-ignore - TypeScript may have issues finding the module
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  private genAI: GoogleGenerativeAI;
  private model: any;
  private formGenerationPrompt: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    // Using the latest Gemini 2.5 Pro Preview model (June 5, 2025 version)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-06-05" });
    
    // Initialize the form generation prompt
    this.formGenerationPrompt = `You are an expert AI assistant specializing in converting unstructured text from medical forms into structured, production-ready SurveyJS JSON. Your primary goal is to meticulously analyze the provided form text and generate a complete, valid JSON object that perfectly represents the form's content, layout, and logic.

Primary Goal: Convert every question, label, checkbox, and input field from the source text into a single, valid SurveyJS JSON object. The most critical part of your task is to accurately identify and implement all conditional logic using visibleIf expressions.

IMPORTANT: The generated JSON must include these required survey-level properties:
{
  "title": "Form Title",
  "description": "Optional form description",
  "progressBarLocation": "bottom", // Required - can be "bottom", "top", or "off"
  "showQuestionNumbers": "on", // Required - can be "on", "onPage", or "off"
  "showProgressBar": "bottom", // Required - can be "bottom", "top", or "off"
  "questionsOrder": "initial", // Required - can be "initial" or "random"
  "pages": [...]
}

Core Directives

Target Schema: Generate only a valid SurveyJS JSON object. The root should contain properties like title, pages, showProgressBar, etc.

Completeness: Do not omit any questions, sub-questions, or options. Every single field from the source text must be present in the output.

Structure with Panels: Group related fields into panel elements to mimic the visual sections of the original form (e.g., "Patient Information," "Insurance Details," "Medical History"). This is essential for layout and organization.

Conditional Logic is Crucial: Use the visibleIf property to show or hide fields based on answers to previous questions. This is the most important requirement.

Use Correct Question Types: Map the form fields to the appropriate SurveyJS question types as detailed below.

Detailed Implementation Guide
1. JSON Structure

Structure your output with pages and panels. For long forms, create multiple pages. For shorter forms, one page with multiple panels is sufficient.

Generated json
{
  "title": "Patient Intake Form",
  "showProgressBar": "top",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "panel",
          "name": "patient_demographics",
          "title": "Patient Demographics",
          "elements": [
            // ... fields for name, DOB, etc. go here
          ]
        },
        {
          "type": "panel",
          "name": "medical_history",
          "title": "Medical History",
          "elements": [
            // ... medical history fields go here
          ]
        }
      ]
    }
  ]
}

2. Conditional Logic (visibleIf)

Actively search the text for relationships between questions. When you find one, use a visibleIf expression.

Look for patterns like: "If yes, please explain...", "If checked, provide details...", or a question indented under another.

The "Gating Question" pattern is key: A "Yes/No" question should control the visibility of a follow-up panel or field.

Example:

Source Text:

Do you have any known allergies? [ ] Yes [ ] No
If yes, please list them: __________________

Correct JSON Output:

Generated json
{
  "type": "radiogroup",
  "name": "has_allergies",
  "title": "Do you have any known allergies?",
  "choices": ["Yes", "No"],
  "isRequired": true
},
{
  "type": "comment",
  "name": "allergy_details",
  "title": "Please list your allergies",
  "visibleIf": "{has_allergies} = 'Yes'",
  "isRequired": true
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END
3. Question Type Mapping
If the form has...	Use this SurveyJS type...	Notes / Example
A simple text entry line	text	For name, address, etc. Use inputType for "email", "tel".
Date of Birth, DOB, Birth Date	dateofbirth	ALWAYS use this for DOB fields - it auto-calculates age
Height measurement	heightslider	Use this for patient height - shows feet/inches with slider
Weight measurement	weightslider	Use this for patient weight - shows pounds with slider
A large box for descriptions	comment	For "Please explain," "List medications," etc.
A question with one possible answer (Yes/No)	radiogroup	choices: ["Yes", "No"]
A question with multiple possible answers	checkbox	For "Check all that apply."
A dropdown list of options	dropdown	For selecting a state, a primary doctor, etc.
A signature line	signaturepad	For consent forms and authorizations.
"Upload your Insurance Card" or "Upload Photo ID"	file	See detailed instructions for the file type below.
A body diagram for marking pain	bodypaindiagram	See detailed instructions for the bodypaindiagram type below.
Terms and conditions acceptance	checkbox or panel	See detailed instructions for terms and conditions below.
4. Special Field Instructions

A. File/Image Uploads
For requests to upload an insurance card, driver's license, or other image, use this exact structure:

Generated json
{
  "type": "file",
  "name": "insurance_card_front",
  "title": "Upload front of insurance card",
  "acceptedTypes": "image/*",
  "storeDataAsText": false,
  "allowMultiple": false,
  "maxSize": 10485760,
  "sourceType": "camera,file-picker"
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END

B. Body Pain Diagram
For requests to mark pain locations on a body diagram, use this structure:

Generated json
{
  "type": "bodypaindiagram",
  "name": "pain_location_diagram",
  "title": "Please mark the areas where you experience pain"
}

C. Date of Birth Field
IMPORTANT: For ANY date of birth field (DOB, birth date, birthdate, etc.), ALWAYS use:

Generated json
{
  "type": "dateofbirth",
  "name": "patient_dob",
  "title": "Date of Birth",
  "isRequired": true,
  "ageFieldName": "patient_age"
}

This component automatically calculates and displays the patient's age. The age is stored in a separate field (patient_age by default).

D. Height Slider
For patient height measurements, use:

Generated json
{
  "type": "heightslider",
  "name": "patient_height",
  "title": "Height",
  "defaultValue": 66
}

This displays an interactive slider showing height in feet and inches format (e.g., 5'6").

E. Weight Slider
For patient weight measurements, use:

Generated json
{
  "type": "weightslider",
  "name": "patient_weight",
  "title": "Weight",
  "defaultValue": 150
}

This displays an interactive slider for weight in pounds (50-500 lbs range).
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END

F. Terms and Conditions
For terms and conditions acceptance, consent forms, or legal agreements, use one of these structures:

Simple Checkbox:
Generated json
{
  "type": "checkbox",
  "name": "terms_acceptance",
  "title": "Terms and Conditions",
  "isRequired": true,
  "choices": [
    {
      "value": "accepted",
      "text": "I have read and accept the terms and conditions, privacy policy, and consent to treatment"
    }
  ],
  "validators": [{
    "type": "answercount",
    "minCount": 1,
    "text": "You must accept the terms and conditions to submit this form"
  }]
}

Full Terms Panel with Signature:
Generated json
{
  "type": "panel",
  "name": "terms_and_conditions_panel",
  "title": "Terms and Conditions",
  "elements": [
    {
      "type": "html",
      "name": "terms_content",
      "html": "<div style='max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 4px;'>[Terms content here]</div>"
    },
    {
      "type": "checkbox",
      "name": "accept_terms",
      "title": "Agreement",
      "isRequired": true,
      "choices": [
        {
          "value": "accepted",
          "text": "I have read and accept the terms and conditions"
        }
      ]
    },
    {
      "type": "signaturepad",
      "name": "terms_signature",
      "title": "Electronic Signature",
      "isRequired": true
    }
  ]
}

Final Instruction: Now, analyze the following form text and generate only the complete, valid SurveyJS JSON object that represents it. Do not add any commentary or explanations outside of the JSON itself.`;
  }

  private ensureRequiredProperties(formJson: any): any {
    // Ensure required SurveyJS properties are present to prevent runtime errors
    if (!formJson.progressBarLocation) {
      formJson.progressBarLocation = "bottom";
    }
    if (!formJson.showQuestionNumbers) {
      formJson.showQuestionNumbers = "on";
    }
    if (!formJson.showProgressBar) {
      formJson.showProgressBar = "bottom";
    }
    if (!formJson.questionsOrder) {
      formJson.questionsOrder = "initial";
    }
    return formJson;
  }

  async generateFormFromText(prompt: string): Promise<FormGenerationResponse> {
    const systemPrompt = `You are an expert AI assistant specializing in converting unstructured text from medical forms into structured, production-ready SurveyJS JSON. Your primary goal is to meticulously analyze the provided form text and generate a complete, valid JSON object that perfectly represents the form's content, layout, and logic.

Primary Goal: Convert every question, label, checkbox, and input field from the source text into a single, valid SurveyJS JSON object. The most critical part of your task is to accurately identify and implement all conditional logic using visibleIf expressions.

IMPORTANT: The generated JSON must include these required survey-level properties:
{
  "title": "Form Title",
  "description": "Optional form description",
  "progressBarLocation": "bottom", // Required - can be "bottom", "top", or "off"
  "showQuestionNumbers": "on", // Required - can be "on", "onPage", or "off"
  "showProgressBar": "bottom", // Required - can be "bottom", "top", or "off"
  "questionsOrder": "initial", // Required - can be "initial" or "random"
  "pages": [...]
}

Core Directives

Target Schema: Generate only a valid SurveyJS JSON object. The root should contain properties like title, pages, showProgressBar, etc.

Completeness: Do not omit any questions, sub-questions, or options. Every single field from the source text must be present in the output.

Structure with Panels: Group related fields into panel elements to mimic the visual sections of the original form (e.g., "Patient Information," "Insurance Details," "Medical History"). This is essential for layout and organization.

Conditional Logic is Crucial: Use the visibleIf property to show or hide fields based on answers to previous questions. This is the most important requirement.

Use Correct Question Types: Map the form fields to the appropriate SurveyJS question types as detailed below.

Detailed Implementation Guide
1. JSON Structure

Structure your output with pages and panels. For long forms, create multiple pages. For shorter forms, one page with multiple panels is sufficient.

Generated json
{
  "title": "Patient Intake Form",
  "showProgressBar": "top",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "panel",
          "name": "patient_demographics",
          "title": "Patient Demographics",
          "elements": [
            // ... fields for name, DOB, etc. go here
          ]
        },
        {
          "type": "panel",
          "name": "medical_history",
          "title": "Medical History",
          "elements": [
            // ... medical history fields go here
          ]
        }
      ]
    }
  ]
}

2. Conditional Logic (visibleIf)

Actively search the text for relationships between questions. When you find one, use a visibleIf expression.

Look for patterns like: "If yes, please explain...", "If checked, provide details...", or a question indented under another.

The "Gating Question" pattern is key: A "Yes/No" question should control the visibility of a follow-up panel or field.

Example:

Source Text:

Do you have any known allergies? [ ] Yes [ ] No
If yes, please list them: __________________

Correct JSON Output:

Generated json
{
  "type": "radiogroup",
  "name": "has_allergies",
  "title": "Do you have any known allergies?",
  "choices": ["Yes", "No"],
  "isRequired": true
},
{
  "type": "comment",
  "name": "allergy_details",
  "title": "Please list your allergies",
  "visibleIf": "{has_allergies} = 'Yes'",
  "isRequired": true
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END
3. Question Type Mapping
If the form has...	Use this SurveyJS type...	Notes / Example
A simple text entry line	text	For name, address, etc. Use inputType for "email", "tel".
Date of Birth, DOB, Birth Date	dateofbirth	ALWAYS use this for DOB fields - it auto-calculates age
Height measurement	heightslider	Use this for patient height - shows feet/inches with slider
Weight measurement	weightslider	Use this for patient weight - shows pounds with slider
A large box for descriptions	comment	For "Please explain," "List medications," etc.
A question with one possible answer (Yes/No)	radiogroup	choices: ["Yes", "No"]
A question with multiple possible answers	checkbox	For "Check all that apply."
A dropdown list of options	dropdown	For selecting a state, a primary doctor, etc.
A signature line	signaturepad	For consent forms and authorizations.
"Upload your Insurance Card" or "Upload Photo ID"	file	See detailed instructions for the file type below.
A body diagram for marking pain	bodypaindiagram	See detailed instructions for the bodypaindiagram type below.
Terms and conditions acceptance	checkbox or panel	See detailed instructions for terms and conditions below.
4. Special Field Instructions

A. File/Image Uploads
For requests to upload an insurance card, driver's license, or other image, use this exact structure:

Generated json
{
  "type": "file",
  "name": "insurance_card_front",
  "title": "Upload front of insurance card",
  "acceptedTypes": "image/*",
  "storeDataAsText": false,
  "allowMultiple": false,
  "maxSize": 10485760,
  "sourceType": "camera,file-picker"
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END

B. Body Pain Diagram
For requests to mark pain locations on a body diagram, use this structure:

Generated json
{
  "type": "bodypaindiagram",
  "name": "pain_location_diagram",
  "title": "Please mark the areas where you experience pain"
}

C. Date of Birth Field
IMPORTANT: For ANY date of birth field (DOB, birth date, birthdate, etc.), ALWAYS use:

Generated json
{
  "type": "dateofbirth",
  "name": "patient_dob",
  "title": "Date of Birth",
  "isRequired": true,
  "ageFieldName": "patient_age"
}

This component automatically calculates and displays the patient's age. The age is stored in a separate field (patient_age by default).

D. Height Slider
For patient height measurements, use:

Generated json
{
  "type": "heightslider",
  "name": "patient_height",
  "title": "Height",
  "defaultValue": 66
}

This displays an interactive slider showing height in feet and inches format (e.g., 5'6").

E. Weight Slider
For patient weight measurements, use:

Generated json
{
  "type": "weightslider",
  "name": "patient_weight",
  "title": "Weight",
  "defaultValue": 150
}

This displays an interactive slider for weight in pounds (50-500 lbs range).
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Json
IGNORE_WHEN_COPYING_END

F. Terms and Conditions
For terms and conditions acceptance, consent forms, or legal agreements, use one of these structures:

Simple Checkbox:
Generated json
{
  "type": "checkbox",
  "name": "terms_acceptance",
  "title": "Terms and Conditions",
  "isRequired": true,
  "choices": [
    {
      "value": "accepted",
      "text": "I have read and accept the terms and conditions, privacy policy, and consent to treatment"
    }
  ],
  "validators": [{
    "type": "answercount",
    "minCount": 1,
    "text": "You must accept the terms and conditions to submit this form"
  }]
}

Full Terms Panel with Signature:
Generated json
{
  "type": "panel",
  "name": "terms_and_conditions_panel",
  "title": "Terms and Conditions",
  "elements": [
    {
      "type": "html",
      "name": "terms_content",
      "html": "<div style='max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 4px;'>[Terms content here]</div>"
    },
    {
      "type": "checkbox",
      "name": "accept_terms",
      "title": "Agreement",
      "isRequired": true,
      "choices": [
        {
          "value": "accepted",
          "text": "I have read and accept the terms and conditions"
        }
      ]
    },
    {
      "type": "signaturepad",
      "name": "terms_signature",
      "title": "Electronic Signature",
      "isRequired": true
    }
  ]
}

Final Instruction: Now, analyze the following form text and generate only the complete, valid SurveyJS JSON object that represents it. Do not add any commentary or explanations outside of the JSON itself.`;

    try {
      const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}`;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response - handle multiple JSON extraction strategies
      let formJson: any;
      
      // Strategy 1: Try to find JSON between code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          formJson = JSON.parse(codeBlockMatch[1]);
          // Check if the response is wrapped in a form object
          if (formJson.form && typeof formJson.form === 'object') {
            console.log('Found wrapped form object in code block, unwrapping...');
            formJson = formJson.form;
          }
        } catch (e) {
          // Continue to next strategy
        }
      }
      
      // Strategy 2: Find the first complete JSON object
      if (!formJson) {
        // Use a more robust regex that finds complete JSON objects
        const jsonStart = text.indexOf('{');
        if (jsonStart !== -1) {
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let jsonEnd = jsonStart;
          
          for (let i = jsonStart; i < text.length; i++) {
            const char = text[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }
          
          if (braceCount === 0 && jsonEnd > jsonStart) {
            const jsonString = text.substring(jsonStart, jsonEnd);
            try {
              formJson = JSON.parse(jsonString);
              // Check if the response is wrapped in a form object
              if (formJson.form && typeof formJson.form === 'object') {
                console.log('Found wrapped form object, unwrapping...');
                formJson = formJson.form;
              }
            } catch (e) {
              console.error('Failed to parse extracted JSON:', e);
              console.error('Extracted string:', jsonString.substring(0, 200) + '...');
            }
          }
        }
      }
      
      if (!formJson) {
        throw new Error('No valid JSON found in response. The model may have returned an invalid format.');
      }
      
      // Validate the structure
      if (!formJson.pages || !Array.isArray(formJson.pages)) {
        throw new Error('Invalid form structure: missing pages array');
      }
      
      return this.ensureRequiredProperties(formJson);
    } catch (error) {
      console.error('Error generating form:', error);
      throw error;
    }
  }

  async generateFormFromExtractedText(extractedText: string): Promise<any> {
    const systemPrompt = `You are an expert medical form designer creating professional SurveyJS forms that preserve the original PDF layout.

IMPORTANT: Generate a complete, valid JSON structure that maintains the visual organization and multi-column layout of the original form.

CORE REQUIREMENTS:
1. Generate a complete SurveyJS JSON with professional medical form structure
2. Organize content into logical sections using panels for visual grouping
3. Preserve the original form's visual hierarchy and layout structure
4. Use appropriate SurveyJS question types for each field type detected
5. Apply professional healthcare styling and validation

PROFESSIONAL STRUCTURE REQUIREMENTS:
- Use "panel" elements to group related fields (Patient Info, Insurance, Medical History, etc.)
- Create multi-page forms for complex intake forms with logical page breaks
- Add descriptive titles and instructions for each section
- Include progress indicators and navigation between sections
- Use appropriate icons and visual cues in panel titles

VISUAL LAYOUT PRESERVATION:
- Detect visual sections in the original form and recreate them as panels
- Preserve field groupings (e.g., name fields together, contact info together)
- Maintain the logical flow and organization of the original form
- Use multi-column layouts where appropriate (specify in panel properties)
- Add section headers, instructions, and formatting from the original

QUESTION TYPE MAPPING:
- Text fields → "text" type with appropriate inputType (email, tel, etc.)
- DATE OF BIRTH fields → "dateofbirth" type (ALWAYS use this for DOB - it auto-calculates age)
- Height fields → "heightslider" type (displays feet/inches with slider)
- Weight fields → "weightslider" type (displays pounds with slider)
- Checkboxes → "checkbox" type with multiple choices
- Radio buttons → "radiogroup" type for single selection
- Dropdowns → "dropdown" type with predefined choices
- Signature areas → "signaturepad" type for digital signatures
- Other date fields (NOT DOB) → "text" with inputType: "date"
- Large text areas → "comment" type for multi-line input
- Insurance card/ID uploads → "file" type with image capture settings
- Body pain diagrams → "bodypaindiagram" type for marking pain areas

HEALTHCARE COMPLIANCE:
- Use generic, non-sensitive field names (e.g., "patient_name" not specific names)
- Include HIPAA compliance notices and consent sections
- Add validation rules appropriate for medical data
- Ensure required field marking matches original form importance

OUTPUT FORMAT - Return a complete SurveyJS JSON wrapped in a form object:
{
  "form": {
    "title": "Professional Medical Form Title",
    "description": "Brief description of the form purpose",
    "logoPosition": "right",
    "showProgressBar": "top",
    "progressBarType": "pages",
    "showQuestionNumbers": "on",
    "questionTitleLocation": "top",
    "questionErrorLocation": "bottom",
    "pages": [
      {
        "name": "page1",
        "title": "Patient Information",
        "elements": [
          {
            "type": "panel",
            "name": "patient_info_panel",
            "title": "Patient Demographics",
            "elements": [
              // Patient information fields here
            ]
          }
        ]
      }
    ]
  }
}

CONDITIONAL LOGIC PATTERNS:
- "Do you have insurance?" → If yes, show insurance fields
- "Are you taking medications?" → If yes, show medication list
- "Do you have allergies?" → If yes, show allergy details
- "Have you had surgery?" → If yes, show surgery history
- Always use visibleIf expressions to control field visibility

TERMS AND CONDITIONS PATTERNS:
When you encounter any of these patterns in a form, create a terms and conditions component:
- "I agree to..." or "I accept..." checkboxes
- "Terms and conditions", "terms of service", "privacy policy" references
- "Consent to treatment" or "informed consent" sections
- Legal agreement text followed by acceptance checkbox
- "By signing/submitting this form, I agree..."
- HIPAA authorization or privacy notices requiring acknowledgment

For simple acknowledgment (just a checkbox), use the simple terms checkbox structure.
For forms requiring signature with terms, use the full panel structure with scrollable terms text, checkbox, and signature pad.

IMPORTANT INSURANCE HANDLING INSTRUCTIONS:
When you encounter ANY insurance-related fields in the form (such as member ID, group number, plan type, insurance company, etc.):
1. ALWAYS first add a radiogroup question asking "Do you have insurance?" with choices ["Yes", "No"]
2. If the user selects "Yes", show a panel containing:
   - An instruction HTML element explaining: "Please use the camera button below to take a photo of your insurance card. The information will be automatically extracted."
   - File upload fields for insurance card (front and back) with camera capture enabled
   - Text fields for all insurance information (member ID, group number, etc.) that will be auto-populated
   - A status HTML element to show processing status
3. All insurance text fields should be in the same panel as the file upload to enable automatic population
4. Do NOT ask users to manually type insurance details unless the card scanning fails
5. The insurance card upload should use the exact structure shown in the IMAGE UPLOAD FIELDS section

IMAGE UPLOAD FIELDS (Insurance Cards, IDs, etc.):
When the form mentions uploading insurance cards, driver's licenses, or ID cards, use:
{
  "type": "file",
  "name": "insurance_card_front",
  "title": "Upload front of insurance card",
  "acceptedTypes": "image/*",
  "storeDataAsText": false,
  "allowMultiple": false,
  "maxSize": 10485760,
  "description": "Take a photo or upload an image of the front of your insurance card",
  "sourceType": "camera,file-picker",
  "allowImagesPreview": true
}

EXAMPLE INSURANCE SECTION STRUCTURE:
{
  "type": "radiogroup",
  "name": "has_insurance",
  "title": "Do you have insurance?",
  "choices": ["Yes", "No"],
  "isRequired": true
},
{
  "type": "panel",
  "name": "insurance_info_panel",
  "title": "Insurance Information",
  "visibleIf": "{has_insurance} = 'Yes'",
  "elements": [
    {
      "type": "html",
      "name": "insurance_instructions",
      "html": "<p style='color: #1976d2; margin-bottom: 16px;'>Please use the camera button below to take photos of your insurance card. The information will be automatically extracted.</p>"
    },
    {
      "type": "file",
      "name": "insurance_card_front",
      "title": "Front of Insurance Card",
      "acceptedTypes": "image/*",
      "storeDataAsText": false,
      "allowMultiple": false,
      "maxSize": 10485760,
      "sourceType": "camera,file-picker",
      "allowImagesPreview": true
    },
    {
      "type": "file",
      "name": "insurance_card_back",
      "title": "Back of Insurance Card",
      "acceptedTypes": "image/*",
      "storeDataAsText": false,
      "allowMultiple": false,
      "maxSize": 10485760,
      "sourceType": "camera,file-picker",
      "allowImagesPreview": true
    },
    {
      "type": "html",
      "name": "insurance_status",
      "html": "<p style='color: #666; font-style: italic;'>Insurance information will be automatically extracted from your card.</p>"
    },
    {
      "type": "text",
      "name": "member_id",
      "title": "Member ID",
      "description": "Will be auto-filled from insurance card"
    },
    {
      "type": "text",
      "name": "group_number",
      "title": "Group Number",
      "description": "Will be auto-filled from insurance card"
    },
    {
      "type": "text",
      "name": "insurance_company",
      "title": "Insurance Company",
      "description": "Will be auto-filled from insurance card"
    }
  ]
}

BODY PAIN DIAGRAM FIELDS:
When the form mentions marking pain areas, pain locations, or body diagram:
{
  "type": "bodypaindiagram",
  "name": "pain_areas",
  "title": "Please mark areas where you experience pain",
  "description": "Click on the body diagram to indicate pain locations and select intensity level"
}

DATE OF BIRTH FIELDS:
When the form mentions Date of Birth, DOB, Birth Date, or Birthdate, ALWAYS use:
{
  "type": "dateofbirth",
  "name": "patient_dob",
  "title": "Date of Birth",
  "isRequired": true,
  "ageFieldName": "patient_age",
  "description": "Select your date of birth (age will be calculated automatically)"
}
NEVER use type: "text" with inputType: "date" for DOB fields.

HEIGHT FIELDS:
When the form mentions patient height, use:
{
  "type": "heightslider",
  "name": "patient_height",
  "title": "Height",
  "defaultValue": 66,
  "description": "Use the slider to select your height"
}

WEIGHT FIELDS:
When the form mentions patient weight, use:
{
  "type": "weightslider",
  "name": "patient_weight",
  "title": "Weight",
  "defaultValue": 150,
  "description": "Use the slider to select your weight"
}

CRITICAL: Return ONLY valid JSON with no additional text, explanations, or markdown formatting.`;

    try {
      const fullPrompt = `${systemPrompt}\n\nExtracted PDF Text:\n${extractedText}`;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response - handle multiple JSON extraction strategies
      let formJson: any;
      
      // Strategy 1: Try to find JSON between code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          formJson = JSON.parse(codeBlockMatch[1]);
          // Check if the response is wrapped in a form object
          if (formJson.form && typeof formJson.form === 'object') {
            console.log('Found wrapped form object in code block, unwrapping...');
            formJson = formJson.form;
          }
        } catch (e) {
          // Continue to next strategy
        }
      }
      
      // Strategy 2: Find the first complete JSON object
      if (!formJson) {
        // Use a more robust regex that finds complete JSON objects
        const jsonStart = text.indexOf('{');
        if (jsonStart !== -1) {
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let jsonEnd = jsonStart;
          
          for (let i = jsonStart; i < text.length; i++) {
            const char = text[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }
          
          if (braceCount === 0 && jsonEnd > jsonStart) {
            const jsonString = text.substring(jsonStart, jsonEnd);
            try {
              formJson = JSON.parse(jsonString);
              // Check if the response is wrapped in a form object
              if (formJson.form && typeof formJson.form === 'object') {
                console.log('Found wrapped form object, unwrapping...');
                formJson = formJson.form;
              }
            } catch (e) {
              console.error('Failed to parse extracted JSON:', e);
              console.error('Extracted string:', jsonString.substring(0, 200) + '...');
            }
          }
        }
      }
      
      if (!formJson) {
        throw new Error('No valid JSON found in response. The model may have returned an invalid format.');
      }
      
      // Validate the structure
      if (!formJson.pages || !Array.isArray(formJson.pages)) {
        throw new Error('Invalid form structure: missing pages array');
      }
      
      return this.ensureRequiredProperties(formJson);
    } catch (error) {
      console.error('Error generating form:', error);
      throw error;
    }
  }

  async enhanceFormField(field: any, instruction: string): Promise<any> {
    const prompt = `Given this SurveyJS field configuration:
    ${JSON.stringify(field, null, 2)}
    
    Apply this enhancement: ${instruction}
    
    Return ONLY the updated field configuration as valid JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error enhancing field:', error);
      throw error;
    }
  }

  async generateChoices(questionTitle: string, count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} appropriate answer choices for this healthcare survey question: "${questionTitle}"
    
    Return ONLY a JSON array of strings, no explanation.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating choices:', error);
      return [];
    }
  }

  async translateForm(formJson: any, targetLanguage: string): Promise<any> {
    const prompt = `Translate this SurveyJS form to ${targetLanguage}. 
    Translate all user-facing text including titles, descriptions, choices, placeholders, and validation messages.
    Keep all technical properties (name, type, validators) unchanged.
    
    Form JSON:
    ${JSON.stringify(formJson, null, 2)}
    
    Return ONLY the translated JSON.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error translating form:', error);
      throw error;
    }
  }

  async modifyExistingForm(currentFormJson: any, modificationPrompt: string): Promise<any> {
    const systemPrompt = `You are an expert at modifying existing SurveyJS forms based on user requests.
    
    Current form structure:
    ${JSON.stringify(currentFormJson, null, 2)}
    
    User request: ${modificationPrompt}
    
    IMPORTANT INSTRUCTIONS:
    1. Analyze the current form structure carefully
    2. Apply ONLY the requested changes
    3. Preserve all existing fields, panels, and pages unless explicitly asked to remove them
    4. Maintain the same structure, formatting, and field names
    5. Keep all existing properties (visibleIf, validators, etc.) unless they need to be modified
    6. ALWAYS preserve these required survey-level properties:
       - progressBarLocation (if missing, set to "bottom")
       - showQuestionNumbers (if missing, set to "on")
       - showProgressBar (if missing, set to "bottom")
       - questionsOrder (if missing, set to "initial")
    7. Return the complete updated form JSON
    
    Common modification patterns:
    - Adding new fields: Insert them in logical positions within existing panels/pages
    - Adding new sections: Create new panels with appropriate titles
    - Making fields required: Add "isRequired": true
    - Changing field types: Update the "type" property and related settings
    - Adding validation: Add to the "validators" array
    - Reordering: Adjust the position in the elements array
    - Adding conditional logic: Use "visibleIf" with proper syntax like "{fieldname} = 'value'"
    - Updating choices: Modify the "choices" array for radiogroup/checkbox/dropdown
    - Adding descriptions: Add "description" property to provide help text
    
    INSURANCE HANDLING: If the modification involves adding insurance fields, follow the pattern from your instructions - create a radiogroup asking "Do you have insurance?" and conditional panel with camera-enabled file uploads and auto-populated text fields.
    
    DATE OF BIRTH HANDLING: If the modification involves adding a date of birth field, ALWAYS use type: "dateofbirth" which automatically calculates age. Never use type: "text" with inputType: "date" for DOB fields.
    
    HEIGHT/WEIGHT HANDLING: 
    - For height fields, use type: "heightslider" which displays a slider with feet/inches
    - For weight fields, use type: "weightslider" which displays a slider in pounds
    - These provide better mobile UX than text inputs

    Other conditional logic: if conditional logic seems appropriate use whenver possible to improve experience of patient
    
    Return ONLY valid JSON with no additional text, explanations, or markdown formatting.`;

    try {
      const fullPrompt = systemPrompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response using the same strategies as other methods
      let formJson: any;
      
      // Strategy 1: Try to find JSON between code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          formJson = JSON.parse(codeBlockMatch[1]);
        } catch (e) {
          // Continue to next strategy
        }
      }
      
      // Strategy 2: Find the first complete JSON object
      if (!formJson) {
        const jsonStart = text.indexOf('{');
        if (jsonStart !== -1) {
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let jsonEnd = jsonStart;
          
          for (let i = jsonStart; i < text.length; i++) {
            const char = text[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }
          
          if (braceCount === 0 && jsonEnd > jsonStart) {
            const jsonString = text.substring(jsonStart, jsonEnd);
            try {
              formJson = JSON.parse(jsonString);
            } catch (e) {
              console.error('Failed to parse extracted JSON:', e);
            }
          }
        }
      }
      
      if (!formJson) {
        throw new Error('No valid JSON found in response. The model may have returned an invalid format.');
      }
      
      // Validate the structure
      if (!formJson.pages || !Array.isArray(formJson.pages)) {
        // If it's missing pages but has other valid structure, wrap it
        if (formJson.elements || formJson.questions) {
          formJson = {
            title: currentFormJson.title || "Modified Form",
            pages: [{
              name: "page1",
              elements: formJson.elements || formJson.questions || []
            }]
          };
        } else {
          throw new Error('Invalid form structure: missing pages array');
        }
      }
      
      return this.ensureRequiredProperties(formJson);
    } catch (error) {
      console.error('Error modifying form:', error);
      throw error;
    }
  }

  /**
   * Converts a PDF page to a base64 JPEG image
   * @param {Object} page - The PDF page object
   * @param {number} scale - The scale factor for rendering (higher = better quality)
   * @returns {Promise<string>} - Base64 encoded JPEG image
   */
  private async convertPageToBase64Image(page: any, scale: number = 2.0): Promise<string> {
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
  }

  /**
   * Process PDF directly with Gemini - extracts content and generates form JSON in one step
   * @param {string} base64PdfString - The Base64 encoded string of the PDF file (without data: prefix)
   * @returns {Promise<any>} - A promise that resolves with the generated form JSON
   */
  async generateFormFromPdf(base64PdfString: string): Promise<any> {
    console.log('Processing PDF directly with Gemini...');
    
    try {
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
      
      // Convert all pages to images
      const pageImages = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Converting page ${pageNum} of ${pdf.numPages} to image...`);
        const page = await pdf.getPage(pageNum);
        const imageBase64 = await this.convertPageToBase64Image(page, 2.0);
        pageImages.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        });
      }
      
      // Combine the extraction and form generation prompts
      const combinedPrompt = `You are an expert AI assistant specializing in analyzing medical forms and converting them into structured SurveyJS JSON.

TASK: Analyze the following ${pageImages.length} page(s) from a medical form and generate a complete, valid SurveyJS JSON object that perfectly represents the form's content, layout, and logic.

IMPORTANT INSTRUCTIONS:
1. First, carefully examine all pages to extract EVERY form field, checkbox, radio button, and input area
2. Include ALL labels, questions, and field descriptions
3. Preserve ALL options in lists, tables, and checkbox groups
4. Capture all conditional logic (e.g., "If yes, please explain...")
5. Then convert this into a single, valid SurveyJS JSON object

` + this.formGenerationPrompt;

      // Create the content array with all page images
      const content = [
        { text: combinedPrompt },
        ...pageImages
      ];

      const result = await this.model.generateContent(content);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);
      
      // Extract JSON from the response
      let formJson;
      
      // Try to find JSON in code blocks first
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        formJson = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire response as JSON
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonString = text.substring(jsonStart, jsonEnd);
          formJson = JSON.parse(jsonString);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      // Ensure required properties are present
      formJson = this.ensureRequiredProperties(formJson);
      
      console.log('Successfully generated form JSON from PDF:', formJson);
      return formJson;
      
    } catch (error: any) {
      console.error('Error processing PDF with Gemini:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }
}

// Export both the service instance and the direct method for PDF processing
const geminiService = new GeminiService();
export default geminiService;
export const generateFormJsonFromTextGemini = (extractedText: string) => geminiService.generateFormFromExtractedText(extractedText);
export const generateFormJsonFromPdfGemini = (base64PdfString: string) => geminiService.generateFormFromPdf(base64PdfString);