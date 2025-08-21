package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"cloud.google.com/go/vertexai/genai"
	"backend-go/internal/data"
)

// VertexAIService provides methods for interacting with the Vertex AI API.
type VertexAIService struct {
	client *genai.GenerativeModel
}

// NewVertexAIService creates a new instance of VertexAIService.
func NewVertexAIService(client *genai.Client, modelName string) *VertexAIService {
	return &VertexAIService{
		client: client.GenerativeModel(modelName),
	}
}

// GeneratePDFHTML sends the processed form data to a Gemini model
// and asks it to generate a complete, styled HTML document for PDF conversion.
func (s *VertexAIService) GeneratePDFHTML(ctx context.Context, questions []VisibleQuestion) (string, error) {
	// Convert the structured question data to a JSON string for the prompt.
	questionsJSON, err := json.MarshalIndent(questions, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal questions to JSON: %w", err)
	}

	// Construct the detailed prompt with best practices.
	prompt := genai.Text(fmt.Sprintf(`
		You are an expert medical document designer. Your task is to create a professional, 
		space-efficient, and easy-to-read HTML document from a patient's intake form answers. 
		The final HTML will be converted to a PDF.

		      **Instructions:**
		1.  **Clinical Summary:** At the top, under an '<h1>' titled "Clinical Summary", write a 1-2 paragraph narrative summarizing the patient's condition. Synthesize their primary complaints, pain scores, and relevant medical history into a concise overview for the doctor.
		2.  **Layout:** Use a 2-column CSS grid for the main content area to save space. 
		3.  **Styling:** Include a <style> tag in the <head>. Use a professional, clean design with a serif font like "Times New Roman". Use the "@page" rule to set the paper size to 'Letter' and margins to '0.75in'.
		4.  **Page Breaks:** Use "page-break-inside: avoid;" on containers for question-answer pairs to prevent them from splitting across pages.
		5.  **Grouping:** Group related items under clear <h2> subheadings (e.g., "Patient Information", "Health Complaints", "Consent & Policies", "Signatures & Consent").
		6.  **Data:** For each question, clearly display the question's title and its corresponding answer.
		7.  **SIGNATURES - CRITICAL:** 
		    - For any question where "isSignature": true, embed the signature as an image
		    - Use the "signatureData" field which contains a base64 data URL
		    - Embed signatures using: <img src="[signatureData value]" style="max-width: 200px; height: auto; border: 1px solid #ddd; padding: 5px; background: white;" alt="Signature">
		    - Display the signature title above the image
		    - Group all signatures in a "Signatures & Consent" section at the end of the document
		    - If signatureData is empty, show "No signature provided" in italics
		8.  **Output:** The entire output must be a single, valid, self-contained HTML file. Do not include any markdown or other text outside of the HTML.

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

	// Extract the HTML from the response.
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("received an empty response from Vertex AI")
	}

	htmlContent, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return "", fmt.Errorf("unexpected response format from Vertex AI")
	}

	return string(htmlContent), nil
}

// GeneratePDFHTMLWithClinic sends the processed form data along with clinic info to a Gemini model
// and asks it to generate a complete, styled HTML document with clinic header for PDF conversion.
func (s *VertexAIService) GeneratePDFHTMLWithClinic(ctx context.Context, questions []VisibleQuestion, clinicInfo *data.ClinicInfo) (string, error) {
	// Convert the structured question data to a JSON string for the prompt.
	questionsJSON, err := json.MarshalIndent(questions, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal questions to JSON: %w", err)
	}
	
	// Convert clinic info to JSON if available
	clinicJSON := "{}"
	if clinicInfo != nil {
		clinicBytes, err := json.MarshalIndent(clinicInfo, "", "  ")
		if err == nil {
			clinicJSON = string(clinicBytes)
		}
	}
	
	// Get current date in USA format
	currentDate := fmt.Sprintf("%d-%d-%d", int(time.Now().Month()), time.Now().Day(), time.Now().Year())

	// Construct the detailed prompt with clinic header instructions.
	prompt := genai.Text(fmt.Sprintf(`
		You are an expert medical document designer. Your task is to create a professional, 
		space-efficient, and easy-to-read HTML document from a patient's intake form answers with a clinic header. 
		The final HTML will be converted to a PDF.

		**Instructions:**
		1.  **CLINIC HEADER (CRITICAL):** Create a professional header at the top of the document with:
		    - If clinic info is provided: Display clinic name prominently
		    - Include full address (address_line1, address_line2 if present, city, state, zip)
		    - Phone and fax numbers formatted as (XXX) XXX-XXXX
		    - Email and website if available
		    - If logo_url is provided, include it aligned to the left with max-height: 60px
		    - Use primary_color for header background if provided, otherwise use #2c3e50
		    - Add a thin divider line below the header
		    - If no clinic info provided, use a generic "Medical Form Response" header
		2.  **Document Info Bar:** Below the header, add a gray bar with:
		    - Document title: "Patient Intake Form"
		    - Date generated: %s
		    - Page numbers using CSS counters
		3.  **Clinical Summary:** Under an '<h1>' titled "Clinical Summary", write a 1-2 paragraph narrative summarizing the patient's condition.
		4.  **Layout:** Use a 2-column CSS grid for the main content area to save space. 
		5.  **Styling:** Include a <style> tag in the <head>. Use professional fonts. Use the "@page" rule to set the paper size to 'Letter' and margins to '0.5in'.
		6.  **Page Breaks:** Use "page-break-inside: avoid;" on containers.
		7.  **Grouping:** Group related items under clear <h2> subheadings.
		8.  **Data:** For each question, clearly display the question's title and answer.
		9.  **SIGNATURES:** For any question where "isSignature": true, embed the signature as an image using the signatureData field.
		10. **Footer:** Add a footer with page numbers and "Confidential Medical Information" notice.
		11. **Output:** The entire output must be a single, valid, self-contained HTML file.

		**Clinic Information (JSON):**
		%s

		**Patient Data (JSON):**
		%s
		
		IMPORTANT: The header should look professional and medical. If clinic has a logo_url, place it on the left side of the header with clinic name to the right. Contact info should be clearly visible but not overwhelming.
	`, currentDate, clinicJSON, string(questionsJSON)))

	// Set a low temperature for deterministic output.
	s.client.SetTemperature(0.2)

	// Generate the content.
	resp, err := s.client.GenerateContent(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("failed to generate content from Vertex AI: %w", err)
	}

	// Extract the HTML from the response.
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("received an empty response from Vertex AI")
	}

	htmlContent, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return "", fmt.Errorf("unexpected response format from Vertex AI")
	}

	return string(htmlContent), nil
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