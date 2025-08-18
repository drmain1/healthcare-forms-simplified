package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
)

// AdditionalDemographicsRenderer renders Additional Demographics data for PDF
func AdditionalDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer

	// Professional form styling with proper spacing
	result.WriteString(`<div class="form-section" style="margin-bottom: 20px;">`)
	result.WriteString(`<div class="section-title" style="background-color: #4a5568; color: white; padding: 8px 12px; margin-bottom: 15px; font-weight: bold;">Additional Demographics</div>`)

	hasAnyData := false

	// Get all field values
	commPref, commExists := context.Answers["demographics_additional_communication"]
	maritalStatus, maritalExists := context.Answers["demographics_additional_marital_status"]
	spouseName, spouseExists := context.Answers["demographics_additional_spouse_name"]
	emergencyName, nameExists := context.Answers["demographics_additional_emergency_name"]
	emergencyRel, relExists := context.Answers["demographics_additional_emergency_relationship"]
	emergencyPhone, phoneExists := context.Answers["demographics_additional_emergency_phone"]
	referralSource, referralExists := context.Answers["demographics_additional_referral_source"]

	// Professional form layout with multiple fields per line
	result.WriteString(`<table style="width: 100%; border-collapse: collapse; font-size: 12px;">`)
	
	// Communication & Marital Status Row
	if commExists || maritalExists {
		result.WriteString(`<tr>`)
		
		// Communication Preference (left column)
		result.WriteString(`<td style="width: 50%; padding: 8px; border: 1px solid #ddd; vertical-align: top;">`)
		result.WriteString(`<strong>Preferred Communication:</strong><br>`)
		if commExists && commPref != "" {
			result.WriteString(fmt.Sprintf(`<span style="margin-left: 10px;">%s</span>`, 
				html.EscapeString(fmt.Sprintf("%v", commPref))))
		} else {
			result.WriteString(`<span style="margin-left: 10px; color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		
		// Marital Status (right column)
		result.WriteString(`<td style="width: 50%; padding: 8px; border: 1px solid #ddd; vertical-align: top;">`)
		result.WriteString(`<strong>Marital Status:</strong><br>`)
		if maritalExists && maritalStatus != "" {
			maritalDisplay := formatMaritalStatus(maritalStatus)
			result.WriteString(fmt.Sprintf(`<span style="margin-left: 10px;">%s</span>`, 
				html.EscapeString(maritalDisplay)))
		} else {
			result.WriteString(`<span style="margin-left: 10px; color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		
		result.WriteString(`</tr>`)
		hasAnyData = true
	}

	// Spouse Name Row (if married)
	if maritalExists && strings.EqualFold(fmt.Sprintf("%v", maritalStatus), "M") {
		result.WriteString(`<tr>`)
		result.WriteString(`<td colspan="2" style="padding: 8px; border: 1px solid #ddd;">`)
		result.WriteString(`<strong>Spouse/Significant Other:</strong> `)
		if spouseExists && spouseName != "" {
			result.WriteString(html.EscapeString(fmt.Sprintf("%v", spouseName)))
		} else {
			result.WriteString(`<span style="color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		result.WriteString(`</tr>`)
		hasAnyData = true
	}

	// Emergency Contact Header
	if nameExists || relExists || phoneExists {
		result.WriteString(`<tr>`)
		result.WriteString(`<td colspan="2" style="padding: 12px 8px 8px 8px; background-color: #f7fafc; border: 1px solid #ddd; font-weight: bold;">`)
		result.WriteString(`Emergency Contact Information`)
		result.WriteString(`</td>`)
		result.WriteString(`</tr>`)

		// Emergency Contact Name and Relationship Row
		result.WriteString(`<tr>`)
		
		// Emergency Contact Name (left column)
		result.WriteString(`<td style="width: 50%; padding: 8px; border: 1px solid #ddd; vertical-align: top;">`)
		result.WriteString(`<strong>Emergency Contact Name:</strong><br>`)
		if nameExists && emergencyName != "" {
			result.WriteString(fmt.Sprintf(`<span style="margin-left: 10px;">%s</span>`, 
				html.EscapeString(fmt.Sprintf("%v", emergencyName))))
		} else {
			result.WriteString(`<span style="margin-left: 10px; color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		
		// Relationship (right column)
		result.WriteString(`<td style="width: 50%; padding: 8px; border: 1px solid #ddd; vertical-align: top;">`)
		result.WriteString(`<strong>Relationship:</strong><br>`)
		if relExists && emergencyRel != "" {
			result.WriteString(fmt.Sprintf(`<span style="margin-left: 10px;">%s</span>`, 
				html.EscapeString(fmt.Sprintf("%v", emergencyRel))))
		} else {
			result.WriteString(`<span style="margin-left: 10px; color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		
		result.WriteString(`</tr>`)

		// Emergency Contact Phone Row
		result.WriteString(`<tr>`)
		result.WriteString(`<td colspan="2" style="padding: 8px; border: 1px solid #ddd;">`)
		result.WriteString(`<strong>Emergency Contact Phone:</strong> `)
		if phoneExists && emergencyPhone != "" {
			formattedPhone := formatAdditionalDemoPhoneNumber(fmt.Sprintf("%v", emergencyPhone))
			result.WriteString(html.EscapeString(formattedPhone))
		} else {
			result.WriteString(`<span style="color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		result.WriteString(`</tr>`)
		
		hasAnyData = true
	}

	// Referral Source Row
	if referralExists {
		result.WriteString(`<tr>`)
		result.WriteString(`<td colspan="2" style="padding: 8px; border: 1px solid #ddd;">`)
		result.WriteString(`<strong>How did you hear about us?</strong><br>`)
		if referralSource != "" {
			referralStr := strings.TrimSpace(fmt.Sprintf("%v", referralSource))
			result.WriteString(fmt.Sprintf(`<span style="margin-left: 10px; font-style: italic;">"%s"</span>`, 
				html.EscapeString(referralStr)))
		} else {
			result.WriteString(`<span style="margin-left: 10px; color: #999;">Not provided</span>`)
		}
		result.WriteString(`</td>`)
		result.WriteString(`</tr>`)
		hasAnyData = true
	}

	result.WriteString(`</table>`)

	// Show message if no additional demographics data provided
	if !hasAnyData {
		result.WriteString(`<div style="padding: 15px; background-color: #f9f9f9; border: 1px solid #e2e8f0; text-align: center; font-style: italic; color: #666;">`)
		result.WriteString(`No additional demographic information provided.`)
		result.WriteString(`</div>`)
	}

	result.WriteString(`</div>`)
	return result.String(), nil
}

// formatMaritalStatus converts marital status codes to readable text
func formatMaritalStatus(status interface{}) string {
	statusStr := strings.ToUpper(strings.TrimSpace(fmt.Sprintf("%v", status)))
	
	switch statusStr {
	case "M":
		return "Married"
	case "S":
		return "Single"
	case "W":
		return "Widowed"
	case "D":
		return "Divorced"
	default:
		// Return as-is if it's already a full word
		return fmt.Sprintf("%v", status)
	}
}

// formatAdditionalDemoPhoneNumber provides basic phone number formatting
func formatAdditionalDemoPhoneNumber(phone string) string {
	// Remove all non-digit characters
	digits := ""
	for _, char := range phone {
		if char >= '0' && char <= '9' {
			digits += string(char)
		}
	}
	
	// Format as (XXX) XXX-XXXX if it's a 10-digit US number
	if len(digits) == 10 {
		return fmt.Sprintf("(%s) %s-%s", digits[0:3], digits[3:6], digits[6:10])
	}
	
	// Return original if not a standard format
	return phone
}