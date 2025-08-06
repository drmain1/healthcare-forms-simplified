
package services

import (
	"context"
	"encoding/json"
	"fmt"

	"cloud.google.com/go/vertexai/genai"
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
