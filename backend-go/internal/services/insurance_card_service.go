package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"cloud.google.com/go/vertexai/genai"
)

// ExtractedInsuranceData represents extracted insurance card information
type ExtractedInsuranceData struct {
	MemberId             string `json:"memberId,omitempty"`
	MemberName           string `json:"memberName,omitempty"`
	GroupNumber          string `json:"groupNumber,omitempty"`
	IssuerName           string `json:"issuerName,omitempty"`
	PlanType             string `json:"planType,omitempty"`
	RxBin                string `json:"rxBin,omitempty"`
	RxPcn                string `json:"rxPcn,omitempty"`
	RxGroup              string `json:"rxGroup,omitempty"`
	CopayPcp             string `json:"copayPcp,omitempty"`
	CopaySpecialist      string `json:"copaySpecialist,omitempty"`
	CopayEmergency       string `json:"copayEmergency,omitempty"`
	Deductible           string `json:"deductible,omitempty"`
	OutOfPocketMax       string `json:"outOfPocketMax,omitempty"`
	EffectiveDate        string `json:"effectiveDate,omitempty"`
	CustomerServicePhone string `json:"customerServicePhone,omitempty"`
}

// InsuranceCardService provides methods for processing insurance cards with Vertex AI
type InsuranceCardService struct {
	client *genai.GenerativeModel
}

// NewInsuranceCardService creates a new instance of InsuranceCardService
func NewInsuranceCardService(client *genai.Client) *InsuranceCardService {
	// Use Gemini 2.5 Flash for fast, accurate OCR and data extraction
	model := client.GenerativeModel("gemini-2.5-flash")
	
	// Configure model for structured output
	model.SetTemperature(0.1) // Low temperature for consistent extraction
	model.ResponseMIMEType = "application/json"
	
	return &InsuranceCardService{
		client: model,
	}
}

// ProcessInsuranceCard extracts information from an insurance card image
func (s *InsuranceCardService) ProcessInsuranceCard(ctx context.Context, imageData []byte, mimeType string, side string) (*ExtractedInsuranceData, error) {
	// Create the prompt for insurance card extraction
	prompt := fmt.Sprintf(`
You are an expert at extracting information from health insurance cards. 
Analyze this %s side of an insurance card and extract the following information if present:

- Member ID (policy number)
- Member Name
- Group Number
- Insurance Company Name (issuer)
- Plan Type (PPO, HMO, EPO, etc.)
- RX BIN (prescription benefit ID)
- RX PCN (processor control number)
- RX Group
- Copayments:
  - Primary Care Physician (PCP)
  - Specialist
  - Emergency Room
- Annual Deductible
- Out-of-Pocket Maximum
- Effective Date
- Customer Service Phone Number

Return the data in this exact JSON format (use null for missing fields):
{
  "memberId": "extracted value or null",
  "memberName": "extracted value or null",
  "groupNumber": "extracted value or null",
  "issuerName": "extracted value or null",
  "planType": "extracted value or null",
  "rxBin": "extracted value or null",
  "rxPcn": "extracted value or null",
  "rxGroup": "extracted value or null",
  "copayPcp": "extracted value or null",
  "copaySpecialist": "extracted value or null",
  "copayEmergency": "extracted value or null",
  "deductible": "extracted value or null",
  "outOfPocketMax": "extracted value or null",
  "effectiveDate": "extracted value or null",
  "customerServicePhone": "extracted value or null"
}

IMPORTANT: Return ONLY the JSON object, no other text.`, side)

	// Create the image part for Vertex AI
	imagePart := genai.ImageData(mimeType, imageData)

	// Generate content with the model
	resp, err := s.client.GenerateContent(ctx, genai.Text(prompt), imagePart)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content from Vertex AI: %w", err)
	}

	// Extract the response
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("received an empty response from Vertex AI")
	}

	// Get the text response
	jsonContent, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return nil, fmt.Errorf("unexpected response format from Vertex AI")
	}

	// Parse the JSON response
	var cardData ExtractedInsuranceData
	if err := json.Unmarshal([]byte(jsonContent), &cardData); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Clean the extracted data (remove "null" strings)
	cleanedData := cleanExtractedData(&cardData)

	return cleanedData, nil
}

// ProcessInsuranceCardBase64 processes a base64-encoded insurance card image
func (s *InsuranceCardService) ProcessInsuranceCardBase64(ctx context.Context, base64Image string, mimeType string, side string) (*ExtractedInsuranceData, error) {
	// Decode base64 image
	imageData, err := base64.StdEncoding.DecodeString(base64Image)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image: %w", err)
	}

	return s.ProcessInsuranceCard(ctx, imageData, mimeType, side)
}

// cleanExtractedData removes null values and cleans the data
func cleanExtractedData(data *ExtractedInsuranceData) *ExtractedInsuranceData {
	cleaned := &ExtractedInsuranceData{}

	// Helper function to check if value is valid
	isValid := func(s string) bool {
		return s != "" && s != "null" && s != "NULL"
	}

	if isValid(data.MemberId) {
		cleaned.MemberId = data.MemberId
	}
	if isValid(data.MemberName) {
		cleaned.MemberName = data.MemberName
	}
	if isValid(data.GroupNumber) {
		cleaned.GroupNumber = data.GroupNumber
	}
	if isValid(data.IssuerName) {
		cleaned.IssuerName = data.IssuerName
	}
	if isValid(data.PlanType) {
		cleaned.PlanType = data.PlanType
	}
	if isValid(data.RxBin) {
		cleaned.RxBin = data.RxBin
	}
	if isValid(data.RxPcn) {
		cleaned.RxPcn = data.RxPcn
	}
	if isValid(data.RxGroup) {
		cleaned.RxGroup = data.RxGroup
	}
	if isValid(data.CopayPcp) {
		cleaned.CopayPcp = data.CopayPcp
	}
	if isValid(data.CopaySpecialist) {
		cleaned.CopaySpecialist = data.CopaySpecialist
	}
	if isValid(data.CopayEmergency) {
		cleaned.CopayEmergency = data.CopayEmergency
	}
	if isValid(data.Deductible) {
		cleaned.Deductible = data.Deductible
	}
	if isValid(data.OutOfPocketMax) {
		cleaned.OutOfPocketMax = data.OutOfPocketMax
	}
	if isValid(data.EffectiveDate) {
		cleaned.EffectiveDate = data.EffectiveDate
	}
	if isValid(data.CustomerServicePhone) {
		cleaned.CustomerServicePhone = data.CustomerServicePhone
	}

	return cleaned
}