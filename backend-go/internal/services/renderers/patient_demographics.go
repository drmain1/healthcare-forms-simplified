package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
	"time"
)

// PatientDemographicsRenderer renders patient demographic information
func PatientDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Patient Demographics</div>`)
	
	// Patient identification section
	result.WriteString(`<table class="data-table">`)
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
		{"gender", "Gender"},
		{"phone", "Phone Number"},
		{"email", "Email Address"},
		{"address", "Address"},
		{"city", "City"},
		{"state", "State"},
		{"zip", "ZIP Code"},
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
				label := formatFieldLabel(elementName, "")
				result.WriteString(`<tr>`)
				result.WriteString(`<td><strong>` + html.EscapeString(label) + `</strong></td>`)
				result.WriteString(`<td>` + html.EscapeString(displayValue) + `</td>`)
				result.WriteString(`</tr>`)
			}
		}
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	// Add summary section
	patientName := getPatientName(context.Answers)
	age := calculatePatientAge(context.Answers)
	
	if patientName != "Patient" || age > 0 {
		result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c5282;">`)
		result.WriteString(`<h4>Patient Summary</h4>`)
		
		if patientName != "Patient" {
			result.WriteString(`<p><strong>Patient:</strong> ` + html.EscapeString(patientName) + `</p>`)
		}
		
		if age > 0 {
			result.WriteString(`<p><strong>Age:</strong> ` + fmt.Sprintf("%d years old", age) + `</p>`)
		}
		
		result.WriteString(`<p><strong>Information collected:</strong> ` + getCurrentTimestamp() + `</p>`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func formatDemographicValue(fieldKey string, value interface{}) string {
	if value == nil {
		return ""
	}
	
	strValue := fmt.Sprintf("%v", value)
	
	// Handle date of birth with age calculation
	if strings.Contains(strings.ToLower(fieldKey), "birth") || 
	   strings.Contains(strings.ToLower(fieldKey), "dob") {
		age := calculateAgeFromDOB(strValue)
		if age >= 0 {
			return fmt.Sprintf("%s (Age: %d)", strValue, age)
		}
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

// Reuse the existing age calculation logic from form_processor.go
func calculateAgeFromDOB(dobStr string) int {
	// Parse the date string - handle various formats
	var dob time.Time
	var err error
	
	// Try common date formats
	formats := []string{
		"2006-01-02",           // ISO format (most common from HTML date input)
		"01/02/2006",           // US format
		"02/01/2006",           // EU format
		time.RFC3339,           // Full timestamp
		"2006-01-02T15:04:05Z", // ISO 8601
	}
	
	for _, format := range formats {
		dob, err = time.Parse(format, dobStr)
		if err == nil {
			break
		}
	}
	
	if err != nil {
		// If we couldn't parse the date, return -1
		return -1
	}
	
	now := time.Now()
	age := now.Year() - dob.Year()
	
	// Check if birthday hasn't occurred this year
	if now.Month() < dob.Month() || (now.Month() == dob.Month() && now.Day() < dob.Day()) {
		age--
	}
	
	return age
}

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