package services

import (
	"bytes"
	"fmt"
	"html"
	"log"
	"strings"
)

// PatientDemographicsRenderer renders patient demographic information
func PatientDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section" style="margin-bottom: 20px;">`)
	result.WriteString(`<div class="section-title" style="background-color: #4a5568; color: white; padding: 8px 12px; margin-bottom: 15px; font-weight: bold;">Patient Demographics</div>`)
	
	// Professional form layout with multiple fields per line
	result.WriteString(`<table style="width: 100%; border-collapse: collapse; font-size: 12px;">`)
	
	// Log for debugging
	log.Printf("DEBUG: PatientDemographicsRenderer - ElementNames: %v", metadata.ElementNames)
	log.Printf("DEBUG: PatientDemographicsRenderer - Available answers keys: %v", getMapKeys(context.Answers))
	
	// Process fields directly from metadata.ElementNames - these match the actual form field names
	for _, elementName := range metadata.ElementNames {
		// Skip non-data fields
		if elementName == "patient_demographics" || // Skip the panel itself
		   elementName == "demographics_header" || // Skip HTML header elements
		   strings.HasSuffix(elementName, "_header") {
			continue
		}
		
		// Check if this field has data in the response
		if value, exists := context.Answers[elementName]; exists && value != nil {
			displayValue := formatDemographicValue(elementName, value)
			
			// Skip empty values
			if displayValue == "" {
				continue
			}
			
			// Generate proper label from field name
			label := generateFieldLabel(elementName)
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td style="padding: 4px 8px; font-weight: bold;">` + html.EscapeString(label) + `:</td>`)
			result.WriteString(`<td style="padding: 4px 8px;">` + html.EscapeString(displayValue) + `</td>`)
			result.WriteString(`</tr>`)
			
			log.Printf("DEBUG: Rendered field %s with label %s and value %s", elementName, label, displayValue)
		} else {
			log.Printf("DEBUG: Field %s not found in response data", elementName)
		}
	}
	
	result.WriteString(`</table>`)
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

// generateFieldLabel creates a human-readable label from a field name
func generateFieldLabel(fieldName string) string {
	// Handle specific field mappings
	switch strings.ToLower(fieldName) {
	case "first_name":
		return "First Name"
	case "last_name":
		return "Last Name"
	case "form_date":
		return "Form Date"
	case "date_of_birth", "dob":
		return "Date of Birth"
	case "sex_at_birth":
		return "Sex Assigned at Birth"
	case "gender", "sex":
		return "Gender"
	case "phone", "phone_number":
		return "Phone Number"
	case "secondary_phone":
		return "Secondary Phone"
	case "email", "email_address":
		return "Email Address"
	case "street_address":
		return "Street Address"
	case "city":
		return "City"
	case "state":
		return "State"
	case "zip", "zip_code", "postal_code":
		return "ZIP Code"
	case "emergency_contact":
		return "Emergency Contact"
	case "emergency_phone":
		return "Emergency Phone"
	default:
		// Format the field name as a label (e.g., "field_name" -> "Field Name")
		return formatFieldLabel(fieldName, "")
	}
}

func formatDemographicValue(fieldKey string, value interface{}) string {
	if value == nil {
		return ""
	}
	
	strValue := fmt.Sprintf("%v", value)
	
	// Handle date of birth with age calculation and USA format
	if strings.Contains(strings.ToLower(fieldKey), "birth") || 
	   strings.Contains(strings.ToLower(fieldKey), "dob") {
		formattedDate := FormatDateUSA(strValue)
		age := calculateAgeFromDOB(strValue)
		if age >= 0 {
			return fmt.Sprintf("%s (Age: %d)", formattedDate, age)
		}
		return formattedDate
	}
	
	// Handle phone number formatting
	if strings.Contains(strings.ToLower(fieldKey), "phone") {
		return formatPhoneNumber(strValue)
	}
	
	// Handle email formatting
	if strings.Contains(strings.ToLower(fieldKey), "email") {
		return strings.ToLower(strValue)
	}
	
	// Handle address formatting
	if strings.Contains(strings.ToLower(fieldKey), "address") {
		return formatAddress(strValue)
	}
	
	return strValue
}

func calculatePatientAge(answers map[string]interface{}) int {
	// Try different date of birth field names
	dobFields := []string{"date_of_birth", "dob", "birth_date"}
	
	for _, field := range dobFields {
		if value, exists := answers[field]; exists {
			if dobStr, ok := value.(string); ok && dobStr != "" {
				return calculateAgeFromDOB(dobStr)
			}
		}
	}
	
	return 0
}

// calculateAgeFromDOB is defined in form_processor.go

func formatPhoneNumber(phone string) string {
	// Remove all non-digit characters
	digits := ""
	for _, char := range phone {
		if char >= '0' && char <= '9' {
			digits += string(char)
		}
	}
	
	// Format as (XXX) XXX-XXXX if 10 digits
	if len(digits) == 10 {
		return fmt.Sprintf("(%s) %s-%s", digits[0:3], digits[3:6], digits[6:10])
	}
	
	// Return original if not 10 digits
	return phone
}

func formatAddress(address string) string {
	// Basic address formatting - capitalize words
	words := strings.Fields(strings.ToLower(address))
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(string(word[0])) + word[1:]
		}
	}
	return strings.Join(words, " ")
}

func getPatientName(answers map[string]interface{}) string {
	// Try patient_name first
	if name, ok := answers["patient_name"].(string); ok && name != "" {
		return name
	}
	
	// Try combining first_name and last_name
	firstName, hasFirst := answers["first_name"].(string)
	lastName, hasLast := answers["last_name"].(string)
	
	if hasFirst && hasLast {
		return strings.TrimSpace(firstName + " " + lastName)
	} else if hasFirst {
		return firstName
	} else if hasLast {
		return lastName
	}
	
	// Try other common name fields
	nameFields := []string{"name", "full_name", "patient_full_name"}
	for _, field := range nameFields {
		if name, ok := answers[field].(string); ok && name != "" {
			return name
		}
	}
	
	return "Patient"
}