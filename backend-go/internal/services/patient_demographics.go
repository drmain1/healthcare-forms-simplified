package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
)

// PatientDemographicsRenderer renders patient demographic information
func PatientDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section" style="margin-bottom: 15px;">`)
	result.WriteString(`<div class="section-title">Patient Demographics</div>`)
	
	// Patient identification section
	result.WriteString(`<table class="data-table" style="font-size: 10px;">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Field</th>`)
	result.WriteString(`<th>Value</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	// Define demographic fields in order
	demographicFields := []struct {
		key   string
		label string
	}{
		{"patient_name", "Full Name"},
		{"first_name", "First Name"},
		{"last_name", "Last Name"},
		{"date_of_birth", "Date of Birth"},
		{"dob", "Date of Birth"},
		{"sex_at_birth", "Sex Assigned at Birth"},
		{"gender", "Gender"},
		{"sex", "Gender"},
		{"phone", "Phone Number"},
		{"phone_number", "Phone Number"},
		{"email", "Email Address"},
		{"email_address", "Email Address"},
		{"address", "Address"},
		{"street_address", "Street Address"},
		{"city", "City"},
		{"state", "State"},
		{"zip", "ZIP Code"},
		{"zip_code", "ZIP Code"},
		{"postal_code", "ZIP Code"},
		{"emergency_contact", "Emergency Contact"},
		{"emergency_phone", "Emergency Phone"},
	}
	
	// Track which fields we've processed
	processedFields := make(map[string]bool)
	
	for _, field := range demographicFields {
		if processedFields[field.key] {
			continue
		}
		
		if value, exists := context.Answers[field.key]; exists && value != nil {
			processedFields[field.key] = true
			
			displayValue := formatDemographicValue(field.key, value)
			
			// Skip empty values
			if displayValue == "" {
				continue
			}
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td><strong>` + html.EscapeString(field.label) + `</strong></td>`)
			result.WriteString(`<td>` + html.EscapeString(displayValue) + `</td>`)
			result.WriteString(`</tr>`)
		}
	}
	
	// Handle any remaining fields that weren't in our predefined list
	for _, elementName := range metadata.ElementNames {
		if processedFields[elementName] {
			continue
		}
		
		if value, exists := context.Answers[elementName]; exists && value != nil {
			displayValue := formatDemographicValue(elementName, value)
			if displayValue != "" {
				// Map common field names to proper labels
				label := elementName
				switch strings.ToLower(elementName) {
				case "sex_at_birth":
					label = "Sex Assigned at Birth"
				case "gender", "sex":
					label = "Gender"
				case "phone", "phone_number":
					label = "Phone Number"
				case "email", "email_address":
					label = "Email Address"
				case "zip", "zip_code", "postal_code":
					label = "ZIP Code"
				case "dob", "date_of_birth":
					label = "Date of Birth"
				default:
					label = formatFieldLabel(elementName, "")
				}
				result.WriteString(`<tr>`)
				result.WriteString(`<td><strong>` + html.EscapeString(label) + `</strong></td>`)
				result.WriteString(`<td>` + html.EscapeString(displayValue) + `</td>`)
				result.WriteString(`</tr>`)
			}
		}
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
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