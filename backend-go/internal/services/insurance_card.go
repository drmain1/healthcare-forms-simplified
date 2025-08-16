package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
	"time"
)

// InsuranceCardData represents captured insurance card information
type InsuranceCardData struct {
	FrontImage       string
	BackImage        string
	ExtractedInfo    map[string]string
	CaptureTimestamp string
}

// InsuranceCardRenderer renders insurance card capture information
func InsuranceCardRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Insurance Information</div>`)
	
	// Extract insurance card data
	cardData := extractInsuranceData(metadata.ElementNames, context.Answers)
	
	hasContent := cardData.FrontImage != "" || cardData.BackImage != "" || len(cardData.ExtractedInfo) > 0
	
	if !hasContent {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No insurance information found</p>`)
		result.WriteString(`<p style="font-size: 11px; color: #999;">Fields checked: ` + strings.Join(metadata.ElementNames, ", ") + `</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render insurance card images if available
		if cardData.FrontImage != "" || cardData.BackImage != "" {
			result.WriteString(renderInsuranceCardImages(cardData))
		}
		
		// Render extracted insurance information
		if len(cardData.ExtractedInfo) > 0 {
			result.WriteString(renderInsuranceInformation(cardData))
		}
		
		// Add capture metadata
		result.WriteString(renderInsuranceCaptureInfo(cardData))
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func extractInsuranceData(elementNames []string, answers map[string]interface{}) InsuranceCardData {
	cardData := InsuranceCardData{
		ExtractedInfo:    make(map[string]string),
		CaptureTimestamp: fmt.Sprintf("%d-%d-%d at %d:%02d %s",
			int(time.Now().Month()), time.Now().Day(), time.Now().Year(),
			time.Now().Hour()%12, time.Now().Minute(), getAMPM(time.Now().Hour())),
	}
	
	// Process each insurance-related field
	for _, elementName := range elementNames {
		if value, exists := answers[elementName]; exists && value != nil {
			lowerName := strings.ToLower(elementName)
			
			// Check for image data
			if strValue, ok := value.(string); ok {
				if isImageData(strValue) {
					if strings.Contains(lowerName, "front") {
						cardData.FrontImage = strValue
						continue
					}
					if strings.Contains(lowerName, "back") {
						cardData.BackImage = strValue
						continue
					}
					// Generic insurance card image
					if cardData.FrontImage == "" {
						cardData.FrontImage = strValue
					} else if cardData.BackImage == "" {
						cardData.BackImage = strValue
					}
					continue
				}
			}
			
			// Extract text-based insurance information
			if strings.Contains(lowerName, "insurance") || 
			   strings.Contains(lowerName, "policy") ||
			   strings.Contains(lowerName, "member") ||
			   strings.Contains(lowerName, "group") ||
			   strings.Contains(lowerName, "plan") ||
			   strings.Contains(lowerName, "provider") ||
			   strings.Contains(lowerName, "carrier") {
				
				valueStr := fmt.Sprintf("%v", value)
				if valueStr != "" {
					cardData.ExtractedInfo[elementName] = valueStr
				}
			}
		}
	}
	
	return cardData
}

func isImageData(data string) bool {
	return strings.HasPrefix(data, "data:image/") && len(data) > 100
}

func renderInsuranceCardImages(cardData InsuranceCardData) string {
	var result bytes.Buffer
	
	result.WriteString(`<div style="margin-bottom: 20px;">`)
	result.WriteString(`<h4>Insurance Card Images</h4>`)
	
	if cardData.FrontImage != "" && cardData.BackImage != "" {
		// Both front and back images
		result.WriteString(`<div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">`)
		
		result.WriteString(`<div style="text-align: center; flex: 1; min-width: 300px;">`)
		result.WriteString(`<h5>Front of Card</h5>`)
		result.WriteString(`<img src="` + html.EscapeString(cardData.FrontImage) + `" alt="Insurance Card Front" style="max-width: 100%; max-height: 200px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`)
		result.WriteString(`</div>`)
		
		result.WriteString(`<div style="text-align: center; flex: 1; min-width: 300px;">`)
		result.WriteString(`<h5>Back of Card</h5>`)
		result.WriteString(`<img src="` + html.EscapeString(cardData.BackImage) + `" alt="Insurance Card Back" style="max-width: 100%; max-height: 200px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`)
		result.WriteString(`</div>`)
		
		result.WriteString(`</div>`)
	} else if cardData.FrontImage != "" {
		// Front image only
		result.WriteString(`<div style="text-align: center;">`)
		result.WriteString(`<h5>Insurance Card</h5>`)
		result.WriteString(`<img src="` + html.EscapeString(cardData.FrontImage) + `" alt="Insurance Card" style="max-width: 100%; max-height: 250px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`)
		result.WriteString(`</div>`)
	} else if cardData.BackImage != "" {
		// Back image only
		result.WriteString(`<div style="text-align: center;">`)
		result.WriteString(`<h5>Insurance Card</h5>`)
		result.WriteString(`<img src="` + html.EscapeString(cardData.BackImage) + `" alt="Insurance Card" style="max-width: 100%; max-height: 250px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderInsuranceInformation(cardData InsuranceCardData) string {
	var result bytes.Buffer
	
	result.WriteString(`<div style="margin-bottom: 20px;">`)
	result.WriteString(`<h4>Insurance Details</h4>`)
	
	result.WriteString(`<table class="data-table">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Information Type</th>`)
	result.WriteString(`<th>Value</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	// Define preferred order for insurance fields
	preferredOrder := []string{
		"insurance_company", "insurance_provider", "insurance_carrier",
		"policy_number", "policy_id", "member_id", "member_number",
		"group_number", "group_id", "plan_name", "plan_type",
		"subscriber_name", "subscriber_id", "effective_date",
	}
	
	// Track processed fields
	processedFields := make(map[string]bool)
	
	// Render fields in preferred order
	for _, field := range preferredOrder {
		if value, exists := cardData.ExtractedInfo[field]; exists {
			processedFields[field] = true
			
			label := formatInsuranceFieldLabel(field)
			result.WriteString(`<tr>`)
			result.WriteString(`<td><strong>` + html.EscapeString(label) + `</strong></td>`)
			result.WriteString(`<td>` + html.EscapeString(value) + `</td>`)
			result.WriteString(`</tr>`)
		}
	}
	
	// Render remaining fields
	for field, value := range cardData.ExtractedInfo {
		if !processedFields[field] {
			label := formatInsuranceFieldLabel(field)
			result.WriteString(`<tr>`)
			result.WriteString(`<td><strong>` + html.EscapeString(label) + `</strong></td>`)
			result.WriteString(`<td>` + html.EscapeString(value) + `</td>`)
			result.WriteString(`</tr>`)
		}
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderInsuranceCaptureInfo(cardData InsuranceCardData) string {
	var result bytes.Buffer
	
	result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">`)
	result.WriteString(`<h4>Capture Information</h4>`)
	
	// Image capture status
	if cardData.FrontImage != "" || cardData.BackImage != "" {
		result.WriteString(`<p><strong>Card Images:</strong> `)
		
		var imageStatus []string
		if cardData.FrontImage != "" {
			imageStatus = append(imageStatus, "Front captured")
		}
		if cardData.BackImage != "" {
			imageStatus = append(imageStatus, "Back captured")
		}
		result.WriteString(strings.Join(imageStatus, ", "))
		result.WriteString(`</p>`)
		
		// Estimate image quality
		result.WriteString(`<p><strong>Image Quality:</strong> `)
		if len(cardData.FrontImage) > 50000 || len(cardData.BackImage) > 50000 {
			result.WriteString(`Good (high resolution)`)
		} else if len(cardData.FrontImage) > 20000 || len(cardData.BackImage) > 20000 {
			result.WriteString(`Adequate (medium resolution)`)
		} else {
			result.WriteString(`Low (may need recapture)`)
		}
		result.WriteString(`</p>`)
	}
	
	// Information completeness
	infoCount := len(cardData.ExtractedInfo)
	result.WriteString(`<p><strong>Information Fields:</strong> ` + fmt.Sprintf("%d fields captured", infoCount))
	
	if infoCount >= 4 {
		result.WriteString(` (Complete)`)
	} else if infoCount >= 2 {
		result.WriteString(` (Partial)`)
	} else if infoCount > 0 {
		result.WriteString(` (Minimal)`)
	}
	result.WriteString(`</p>`)
	
	result.WriteString(`<p><strong>Capture Time:</strong> ` + html.EscapeString(cardData.CaptureTimestamp) + `</p>`)
	
	// Add verification reminder
	result.WriteString(`<div style="margin-top: 10px; padding: 10px; background-color: rgba(255,193,7,0.1); border: 1px solid #FFC107; border-radius: 4px;">`)
	result.WriteString(`<p style="margin: 0; font-size: 11px; color: #856404;">`)
	result.WriteString(`<strong>⚠️ Verification Required:</strong> Please verify all insurance information with the patient and contact the insurance provider to confirm coverage and eligibility before treatment.`)
	result.WriteString(`</p>`)
	result.WriteString(`</div>`)
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func formatInsuranceFieldLabel(fieldName string) string {
	// Convert field names to readable labels
	labelMap := map[string]string{
		"insurance_company":  "Insurance Company",
		"insurance_provider": "Insurance Provider",
		"insurance_carrier":  "Insurance Carrier",
		"policy_number":      "Policy Number",
		"policy_id":          "Policy ID",
		"member_id":          "Member ID",
		"member_number":      "Member Number",
		"group_number":       "Group Number",
		"group_id":           "Group ID",
		"plan_name":          "Plan Name",
		"plan_type":          "Plan Type",
		"subscriber_name":    "Subscriber Name",
		"subscriber_id":      "Subscriber ID",
		"effective_date":     "Effective Date",
		"expiration_date":    "Expiration Date",
		"copay":              "Co-pay",
		"deductible":         "Deductible",
	}
	
	if label, exists := labelMap[strings.ToLower(fieldName)]; exists {
		return label
	}
	
	// Default formatting: replace underscores with spaces and title case
	return formatFieldLabel(fieldName, "")
}