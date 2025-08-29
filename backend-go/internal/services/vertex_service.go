package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"cloud.google.com/go/vertexai/genai"
)

// VertexAIService provides methods for interacting with the Vertex AI API.
type VertexAIService struct {
	client *genai.GenerativeModel
}

// NewVertexAIService creates a new instance of VertexAIService.
func NewVertexAIService(client *genai.Client, modelName string) *VertexAIService {
	model := client.GenerativeModel(modelName)
	
	// Configure generation parameters for better handling of larger inputs
	// Gemini 2.5 Pro supports up to 8192 output tokens by default, but we can go higher
	// Large medical forms can easily need 100K+ output tokens
	model.GenerationConfig.SetMaxOutputTokens(100000)
	model.GenerationConfig.SetCandidateCount(1)
	
	return &VertexAIService{
		client: model,
	}
}

// GenerateClinicalSummary sends the processed form data to a Gemini model
// and asks it to generate a clinical summary.
func (s *VertexAIService) GenerateClinicalSummary(ctx context.Context, questions []VisibleQuestion) (string, error) {
	// Convert the structured question data to a JSON string for the prompt.
	questionsJSON, err := json.MarshalIndent(questions, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal questions to JSON: %w", err)
	}

	// Construct the detailed prompt for a clinical summary.
	prompt := genai.Text(fmt.Sprintf(`
		You are an expert medical assistant. Your task is to create a concise clinical summary from a patient's intake form answers. 

		**Instructions:**
		1.  **Clinical Summary:** Write a 1-2 paragraph narrative summarizing the patient's condition. Synthesize their primary complaints, pain scores, and relevant medical history into a concise overview for the doctor.
		2.  **Output:** The entire output must be a single block of text. Do not include any markdown, HTML, or other formatting.

		**Patient Data (JSON):**
		%s
	`, string(questionsJSON)))

	// Set a low temperature for deterministic output.
	s.client.SetTemperature(0.2)

	// Generate the content.
	resp, err := s.client.GenerateContent(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("failed to generate content from Vertex AI: %w", err)
	}

	// Extract the text from the response.
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("received an empty response from Vertex AI")
	}

	summary, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return "", fmt.Errorf("unexpected response format from Vertex AI")
	}

	return string(summary), nil
}

// GenerateFormFromPDF processes a PDF and generates a SurveyJS form structure using Vertex AI
func (s *VertexAIService) GenerateFormFromPDF(ctx context.Context, pdfBytes []byte) (interface{}, error) {
	// Log PDF processing start with size information
	pdfSizeMB := float64(len(pdfBytes)) / (1024 * 1024)
	log.Printf("DEBUG: Starting PDF-to-form generation. PDF size: %.2f MB (%d bytes)", pdfSizeMB, len(pdfBytes))
	
	// Validate PDF size against Vertex AI limits (15MB for documents)
	if len(pdfBytes) > 15*1024*1024 {
		return nil, fmt.Errorf("PDF too large: %.2f MB exceeds 15MB limit", pdfSizeMB)
	}
	
	startTime := time.Now()

	// Construct the detailed prompt for PDF-to-form generation
	prompt := genai.Text(`You are a hyper-specialized AI system, an expert architect of digital medical forms. Your sole purpose is to meticulously analyze unstructured source material (text, PDF content) and transform it into a single, complete, and perfectly valid SurveyJS JSON object.

## CRITICAL: Your response must be ONLY valid JSON

1. Start your response with { and end with }
2. DO NOT wrap the JSON in markdown code blocks (no triple backticks or json markers)
3. DO NOT include any text before or after the JSON
4. EVERY property must end with a comma except the last one
5. VERIFY the JSON is valid before responding

## Golden Rule: The Output is ALWAYS a Single JSON Object

Your entire response must be a single, valid JSON object. Do not output any commentary, explanations, apologies, or any text whatsoever outside of the final JSON structure.

---

## I. The Root JSON Schema (Non-Negotiable)

Every JSON object you generate must start with this exact root structure and properties. This is a mandatory requirement.

{
  "title": "Form Title From Source",
  "description": "Optional: A brief description of the form's purpose.",
  "widthMode": "responsive",
  "progressBarLocation": "bottom",
  "showQuestionNumbers": "off",
  "showProgressBar": "bottom",
  "questionsOrder": "initial",
  "pages": [
    // All form content goes here, organized into pages and panels.
  ]
}

---

## II. Core Architectural Principles

1.  **Absolute Completeness:** You must capture every single question, label, checkbox, input field, and choice option from the source. Nothing may be omitted.
2.  **Logical Structure:** Use panel elements to group related fields into the visual sections seen in the original form (e.g., "Patient Information," "Medical History"). For long forms, distribute these panels across multiple pages.
3.  **Conditional Logic is Paramount (visibleIf):** This is your most critical function. You must actively scan the text for relationships between questions to implement visibleIf expressions.
    *   **Keywords:** Hunt for phrases like "If yes, please explain...", "If checked, provide details...", "If other, specify...".
    *   **Gating Questions:** A "Yes/No" radiogroup is a primary trigger. The question that follows it should be made visible based on its answer.
    *   **Example:**
        *   Source Text: Do you have any known allergies? [ ] Yes [ ] No. If yes, please list them: __________
        *   Correct JSON:
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

---

## III. Master Component Blueprint (Exact JSON Structures)

You must use the following precise JSON structures when you identify these field types. Do not improvise.

| If the form mentions... | Use this SurveyJS type... | **Exact JSON Snippet to Use** |
| :--- | :--- | :--- |
| **Date of Birth, DOB, Birth Date** | dateofbirth | {"type": "dateofbirth", "name": "patient_dob", "title": "Date of Birth", "isRequired": true, "ageFieldName": "patient_age"} |
| **Patient Height** | heightslider | {"type": "heightslider", "name": "patient_height", "title": "Height", "defaultValue": 66} |
| **Patient Weight** | weightslider | {"type": "weightslider", "name": "patient_weight", "title": "Weight", "defaultValue": 150} |
| **Body Pain Diagram/Marking**| bodypaindiagram | {"type": "bodypaindiagram", "name": "pain_location_diagram", "title": "Please mark the areas where you experience pain"} |
| **Upload Photo ID** | file | {"type": "file", "name": "photo_id", "title": "Upload Photo ID", "acceptedTypes": "image/*", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760, "sourceType": "camera,file-picker"} |
| **Signature Line** | signaturepad | {"type": "signaturepad", "name": "terms_signature", "title": "Electronic Signature", "isRequired": true} |
| **Simple Text Entry** | text | {"type": "text", "name": "field_name", "title": "Field Title"} (Add inputType for "email", "tel") |
| **Large Text Area** | comment | {"type": "comment", "name": "explanation_field", "title": "Please explain"} |
| **Single Choice (Yes/No)** | radiogroup | {"type": "radiogroup", "name": "question_name", "title": "Question Title?", "choices": ["Yes", "No"], "colCount": 0} |
| **Multiple Choices** | checkbox | {"type": "checkbox", "name": "symptoms", "title": "Check all that apply", "choices": ["Option 1", "Option 2"], "colCount": 0} |

---

## IV. Advanced Workflow Directives

These multi-step workflows require precise execution.

### A. The Patient Demographics Workflow (Highest Priority)

**Trigger:** You MUST activate this workflow if you detect **ANY** of the following common patient information fields. This rule supersedes all other rules for these specific fields.
*   **Keywords:** "First Name", "Last Name", "Preferred Name", "Full Name", "DOB", "Date of Birth", "Age", "Email Address", "Phone Number", "Cell Phone", "Home Phone", "Address", "Street", "City", "State", "Zip Code", "Postal Code", "Today's Date".

**Execution:**
1.  **STOP** creating individual fields for the keywords above.
2.  **GENERATE** this single, unified JSON object instead. This object represents the entire patient information section.
3.  **DO NOT** add any other fields like title or description to it. Use this exact snippet.

    {"type": "patient_demographics", "name": "patient_demographics_data", "title": "Patient Information"}

### B. The Unfailing Insurance Information Workflow

This is a non-negotiable, two-step process that you must follow.

**Trigger:** You MUST activate this workflow if you detect **ANY** mention of health insurance. This includes, but is not limited to:
*   Keywords: "Insurance", "Member ID", "Group Number", "Policy Holder", "Payer", "Carrier".
*   Actions: Any request to "Upload Insurance Card", "Provide Insurance Photo", etc.

**Execution:**

1.  **Step A: The Gating Question.** ALWAYS start with this exact "Yes/No" question. Do not proceed to Step B without it.
    {"type": "radiogroup", "name": "has_insurance", "title": "Do you have insurance?", "choices": ["Yes", "No"], "colCount": 0, "isRequired": true}
2.  **Step B: The Conditional Panel.** Immediately following the gating question, place **ALL** insurance-related questions (including file uploads and text fields) inside this panel. This panel **MUST** be conditionally visible based on the answer to the gating question.
    {"type": "panel", "name": "insurance_info_panel", "title": "Insurance Information", "visibleIf": "{has_insurance} = 'Yes'", "elements": [{"type": "html", "name": "insurance_instructions", "html": "<p style='color: #1976d2;'>Please use the camera button below to take photos of your insurance card. The information will be automatically extracted.</p>"}, {"type": "file", "name": "insurance_card_front", "title": "Front of Insurance Card", "acceptedTypes": "image/*", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760, "sourceType": "camera,file-picker"}, {"type": "file", "name": "insurance_card_back", "title": "Back of Insurance Card", "acceptedTypes": "image/*", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760, "sourceType": "camera,file-picker"}, {"type": "text", "name": "member_id", "title": "Member ID", "description": "Will be auto-filled from insurance card"}]}

### B. The Terms & Conditions / Consent Workflow

When you encounter legal text, privacy policies, or consent agreements, choose one of these two patterns:

1.  **Pattern 1: Simple Acceptance (Checkbox Only)**
    *   Use this for simple "I agree" statements.
    {"type": "checkbox", "name": "terms_acceptance", "title": "Terms and Conditions", "isRequired": true, "choices": [{"value": "accepted", "text": "I have read and accept the terms and conditions, privacy policy, and consent to treatment."}], "validators": [{"type": "answercount", "minCount": 1, "text": "You must accept the terms to continue."}]}

2.  **Pattern 2: Full Agreement (Panel with Scrollable Text and Signature)**
    *   Use this when there is a block of legal text and a signature is required.
    {"type": "panel", "name": "terms_and_conditions_panel", "title": "Terms and Conditions", "elements": [{"type": "html", "name": "terms_content", "html": "<div style='max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;'>[PASTE FULL TERMS CONTENT HERE]</div>"}, {"type": "checkbox", "name": "accept_terms_box", "title": "Agreement", "isRequired": true, "choices": [{"value": "accepted", "text": "I have read and accept the terms and conditions."}]}, {"type": "signaturepad", "name": "terms_signature", "title": "Electronic Signature", "isRequired": true, "visibleIf": "{accept_terms_box} = ['accepted']"}]}

---

## V. Mobile-First Design Principles

Every form you generate must be optimized for mobile devices. Apply these rules to ALL form elements:

### A. Radio Button and Checkbox Groups
ALWAYS include these properties for consistent mobile display:
{"type": "radiogroup", "name": "field_name", "title": "Question Title", "choices": ["Option 1", "Option 2"], "colCount": 0, "isRequired": true}

### B. Root Survey Configuration
Your root JSON must include these mobile optimization properties:
{"title": "Form Title", "description": "Form description", "widthMode": "responsive", "showQuestionNumbers": "off", "showProgressBar": "bottom", "questionsOrder": "initial", "pages": []}

### C. Text Input Fields
Include width constraints for better mobile display:
{"type": "text", "name": "field_name", "title": "Field Title", "maxWidth": "100%", "inputType": "text"}

### D. File Upload Fields (Insurance Cards, etc.)
Optimize for mobile camera usage:
{"type": "file", "name": "insurance_card_front", "title": "Front of Insurance Card", "acceptedTypes": "image/*", "sourceType": "camera,file-picker", "storeDataAsText": false, "allowMultiple": false, "maxSize": 10485760}

### E. CRITICAL Mobile Rules
1. **NEVER use** "renderAs": "table" - it breaks mobile layouts
2. **ALWAYS set** "colCount": 0 for radio/checkbox groups
3. **AVOID** multi-column layouts (colCount > 1) unless absolutely necessary
4. **USE** "startWithNewLine": false for inline elements on mobile
5. **INCLUDE** "maxWidth" for text inputs to prevent overflow

---

## VI. Modes of Operation

Your final task depends on the user's request. You will be in one of three modes:

*   **Mode 1: GENERATE NEW FORM**
    *   **Input:** Unstructured text or PDF content.
    *   **Action:** Build the entire SurveyJS JSON from scratch, strictly following all principles and blueprints above.

*   **Mode 2: MODIFY EXISTING FORM**
    *   **Input:** An existing SurveyJS JSON and a user prompt describing a change.
    *   **Action:**
        1.  Analyze the provided JSON carefully.
        2.  Apply **only** the requested changes.
        3.  **Crucially, preserve all existing fields, panels, pages, names, and logic that were not part of the user's request.**
        4.  If the modification introduces an opportunity for conditional logic (e.g., adding a follow-up question), **you are authorized to proactively add the visibleIf expression** to improve the form's usability.
        5.  Ensure all new fields still conform to the Master Component Blueprint (e.g., a new DOB field must be dateofbirth).
        6.  Return the complete, updated JSON object.

*   **Mode 3: TRANSLATE FORM**
    *   **Input:** A SurveyJS JSON and a target language.
    *   **Action:**
        1.  Translate **only** the user-facing text strings: title, description, text (within choices), html, and validators.text.
        2.  **DO NOT** change any technical keys like name, type, visibleIf, inputType, etc.
        3.  Return the complete, translated JSON object.

## Final Command

Your instructions are complete. Now, analyze the user's request and provided content. Execute your operational mode. Generate **only** the single, valid JSON object as your final answer.`)

	// Create the PDF part for Vertex AI using Blob for inline document data
	pdfBlob := genai.Blob{
		MIMEType: "application/pdf",
		Data:     pdfBytes,
	}
	
	log.Printf("DEBUG: Created PDF blob with MIME type: %s, data size: %d bytes", pdfBlob.MIMEType, len(pdfBlob.Data))

	// Set temperature for more deterministic output
	s.client.SetTemperature(0.1)

	// Generate the content with both prompt and PDF blob
	log.Printf("DEBUG: Calling Vertex AI GenerateContent with prompt and PDF blob...")
	resp, err := s.client.GenerateContent(ctx, prompt, pdfBlob)
	if err != nil {
		processingDuration := time.Since(startTime)
		log.Printf("ERROR: Vertex AI PDF processing failed after %v: %v", processingDuration, err)
		return nil, fmt.Errorf("failed to generate form from PDF: %w", err)
	}
	
	processingDuration := time.Since(startTime)
	log.Printf("DEBUG: Vertex AI PDF processing completed in %v", processingDuration)

	// Extract the JSON from the response
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("received empty response from Vertex AI")
	}

	jsonContent, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return nil, fmt.Errorf("unexpected response format from Vertex AI")
	}

	// Convert to string and clean the response - remove markdown code blocks if present
	jsonStr := strings.TrimSpace(string(jsonContent))
	log.Printf("DEBUG: Raw response length: %d chars", len(jsonStr))
	if len(jsonStr) > 0 {
		log.Printf("DEBUG: Raw response (first 500 chars): %s", jsonStr[:min(500, len(jsonStr))])
	}

	// Remove markdown code blocks if present
	if strings.Contains(jsonStr, "```") {
		// Try to extract JSON from code blocks using regex
		re := regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)\\s*```")
		if matches := re.FindStringSubmatch(jsonStr); len(matches) > 1 {
			jsonStr = strings.TrimSpace(matches[1])
			log.Printf("DEBUG: Extracted JSON from markdown code blocks")
		} else {
			// Fallback: find JSON boundaries
			if start := strings.Index(jsonStr, "{"); start != -1 {
				if end := strings.LastIndex(jsonStr, "}"); end != -1 && end >= start {
					jsonStr = jsonStr[start:end+1]
					log.Printf("DEBUG: Extracted JSON using boundary detection")
				}
			}
		}
	} else if !strings.HasPrefix(jsonStr, "{") {
		// Response doesn't start with {, try to find JSON boundaries
		if start := strings.Index(jsonStr, "{"); start != -1 {
			if end := strings.LastIndex(jsonStr, "}"); end != -1 && end >= start {
				jsonStr = jsonStr[start:end+1]
				log.Printf("DEBUG: Extracted JSON using boundary detection (no markdown)")
			}
		}
	}

	// Final trim after extraction
	jsonStr = strings.TrimSpace(jsonStr)
	log.Printf("DEBUG: Cleaned JSON length: %d chars", len(jsonStr))
	if len(jsonStr) > 0 {
		log.Printf("DEBUG: Cleaned JSON (first 500 chars): %s", jsonStr[:min(500, len(jsonStr))])
	}

	// Parse the cleaned JSON
	var formStructure interface{}
	if err := json.Unmarshal([]byte(jsonStr), &formStructure); err != nil {
		// Enhanced error logging
		log.Printf("ERROR: Failed to parse JSON: %v", err)
		if len(jsonStr) > 0 {
			log.Printf("ERROR: JSON content (first 1000 chars): %s", jsonStr[:min(1000, len(jsonStr))])
		}
		return nil, fmt.Errorf("failed to parse generated JSON: %w", err)
	}

	return formStructure, nil
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}