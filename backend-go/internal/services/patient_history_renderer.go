package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
)

// PatientHistoryRenderer renders comprehensive patient history forms
func PatientHistoryRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	// Get the patient history data
	patientData, ok := metadata.TemplateData["patientHistoryData"].(map[string]interface{})
	if !ok {
		patientData = context.Answers
	}

	// Start the patient history section
	result.WriteString(`<div class="form-section patient-history-form">`)
	result.WriteString(`<div class="section-title">Patient History</div>`)

	// Patient Information Section
	result.WriteString(renderPatientInformation(patientData))
	
	// Pain Assessment Section
	result.WriteString(renderPainAssessment(patientData))
	
	// Current Complaint Section
	result.WriteString(renderCurrentComplaint(patientData))
	
	// Body Pain Diagram (if present)
	result.WriteString(renderBodyPainDiagram(patientData))
	
	// Past History Section
	result.WriteString(renderPastHistory(patientData))
	
	// Family and Lifestyle Section
	result.WriteString(renderFamilyAndLifestyle(patientData))
	
	// Signature Section
	result.WriteString(renderSignatures(patientData))
	
	// Oswestry and NDI sections if present
	result.WriteString(renderDisabilityIndices(patientData))

	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func renderPatientInformation(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="patient-info-section">`)
	result.WriteString(`<h3>Patient Information</h3>`)
	result.WriteString(`<div class="info-grid">`)
	
	// Height and Weight
	if height, ok := data["patient_height"]; ok {
		result.WriteString(fmt.Sprintf(`<div class="info-item"><strong>Height:</strong> %v</div>`, height))
	}
	if weight, ok := data["patient_weight"]; ok {
		result.WriteString(fmt.Sprintf(`<div class="info-item"><strong>Weight:</strong> %v</div>`, weight))
	}
	
	// Occupation
	if occupation, ok := data["patient_occupation"]; ok && occupation != "" {
		result.WriteString(fmt.Sprintf(`<div class="info-item"><strong>Occupation:</strong> %s</div>`, html.EscapeString(occupation.(string))))
	}
	
	result.WriteString(`</div>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderPainAssessment(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="pain-assessment-section">`)
	result.WriteString(`<h3>Visual Analog Scale & Pain Assessment</h3>`)
	result.WriteString(`<p class="section-description">For each area below, present pain level and frequency.</p>`)
	
	// Pain areas to check
	painAreas := []struct {
		name  string
		title string
	}{
		{"neck", "Neck Pain"},
		{"headaches", "Headaches"},
		{"low_back", "Low Back Pain"},
		{"mid_back", "Mid Back Pain"},
		{"shoulder", "Shoulder Pain"},
		{"hip", "Hip Pain"},
		{"arm", "Arm Pain"},
		{"leg", "Leg Pain"},
	}
	
	result.WriteString(`<div class="pain-grid">`)
	
	for _, area := range painAreas {
		hasKey := fmt.Sprintf("has_%s_pain", area.name)
		if area.name == "headaches" {
			hasKey = "has_headaches"
		}
		
		if hasPain, ok := data[hasKey]; ok && hasPain == "Yes" {
			result.WriteString(`<div class="pain-area">`)
			result.WriteString(fmt.Sprintf(`<h4>%s</h4>`, area.title))
			
			// Pain intensity
			intensityKey := fmt.Sprintf("%s_pain_intensity", area.name)
			if area.name == "headaches" {
				intensityKey = "headaches_intensity"
			}
			if intensity, ok := data[intensityKey]; ok {
				result.WriteString(fmt.Sprintf(`<div><strong>Severity (0-10):</strong> %v</div>`, intensity))
			}
			
			// Pain frequency
			frequencyKey := fmt.Sprintf("%s_pain_frequency", area.name)
			if area.name == "headaches" {
				frequencyKey = "headaches_frequency"
			}
			if frequency, ok := data[frequencyKey]; ok {
				result.WriteString(fmt.Sprintf(`<div><strong>Frequency:</strong> %v%%</div>`, frequency))
			}
			
			// Side information if applicable
			sideKey := fmt.Sprintf("%s_side", area.name)
			if sides, ok := data[sideKey]; ok {
				if sideArray, isArray := sides.([]interface{}); isArray && len(sideArray) > 0 {
					sideStrings := make([]string, len(sideArray))
					for i, side := range sideArray {
						sideStrings[i] = fmt.Sprintf("%v", side)
					}
					result.WriteString(fmt.Sprintf(`<div><strong>Side(s):</strong> %s</div>`, strings.Join(sideStrings, ", ")))
				}
			}
			
			result.WriteString(`</div>`)
		}
	}
	
	result.WriteString(`</div>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderCurrentComplaint(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="current-complaint-section">`)
	result.WriteString(`<h3>Current Complaint</h3>`)
	result.WriteString(`<div class="complaint-grid">`)
	
	// Previous chiropractic care
	if hadCare, ok := data["had_chiropractic_care"]; ok {
		result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>Previous chiropractic care:</strong> %v</div>`, hadCare))
		
		if hadCare == "Yes" {
			if recency, ok := data["chiropractic_care_recency"]; ok && recency != "" {
				result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>Most recent:</strong> %s</div>`, html.EscapeString(recency.(string))))
			}
		}
	}
	
	// Reason for visit
	if reasons, ok := data["reason_for_visit"]; ok {
		if reasonArray, isArray := reasons.([]interface{}); isArray && len(reasonArray) > 0 {
			reasonStrings := make([]string, len(reasonArray))
			for i, reason := range reasonArray {
				reasonStrings[i] = html.EscapeString(fmt.Sprintf("%v", reason))
			}
			result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>Reason for visit:</strong> %s</div>`, strings.Join(reasonStrings, ", ")))
		}
	}
	
	// Complaint start date
	if startDate, ok := data["complaint_start_date"]; ok && startDate != "" {
		result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>Complaint started:</strong> %s</div>`, html.EscapeString(startDate.(string))))
	}
	
	// Condition status
	if status, ok := data["condition_status"]; ok {
		result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>Condition today is:</strong> %v</div>`, status))
	}
	
	// Helps/Worsens condition
	if helps, ok := data["condition_helpers_worseners"]; ok && helps != "" {
		result.WriteString(fmt.Sprintf(`<div class="complaint-item"><strong>What helps/worsens:</strong> %s</div>`, html.EscapeString(helps.(string))))
	}
	
	result.WriteString(`</div>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderBodyPainDiagram(data map[string]interface{}) string {
	var result bytes.Buffer
	
	if diagram, ok := data["pain_location_diagram"]; ok && diagram != "" {
		result.WriteString(`<div class="body-diagram-section">`)
		result.WriteString(`<h3>Body Pain Diagram</h3>`)
		result.WriteString(`<div class="diagram-placeholder">`)
		result.WriteString(`<p><strong>Pain locations marked:</strong> Present</p>`)
		result.WriteString(`<p class="note">Body diagram data captured - would be rendered as image in full implementation</p>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
	}
	
	return result.String()
}

func renderPastHistory(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="past-history-section">`)
	result.WriteString(`<h3>Past History</h3>`)
	
	// Musculoskeletal conditions
	if conditions, ok := data["musculoskeletal_conditions"]; ok {
		if conditionArray, isArray := conditions.([]interface{}); isArray && len(conditionArray) > 0 {
			result.WriteString(`<div class="history-item">`)
			result.WriteString(`<strong>Musculoskeletal Conditions:</strong>`)
			result.WriteString(`<ul>`)
			for _, condition := range conditionArray {
				result.WriteString(fmt.Sprintf(`<li>%s</li>`, html.EscapeString(fmt.Sprintf("%v", condition))))
			}
			result.WriteString(`</ul>`)
			result.WriteString(`</div>`)
		}
	}
	
	// Other conditions
	if conditions, ok := data["other_conditions"]; ok {
		if conditionArray, isArray := conditions.([]interface{}); isArray && len(conditionArray) > 0 {
			result.WriteString(`<div class="history-item">`)
			result.WriteString(`<strong>Other Medical Conditions:</strong>`)
			result.WriteString(`<ul>`)
			for _, condition := range conditionArray {
				result.WriteString(fmt.Sprintf(`<li>%s</li>`, html.EscapeString(fmt.Sprintf("%v", condition))))
			}
			result.WriteString(`</ul>`)
			result.WriteString(`</div>`)
		}
	}
	
	// Surgery history
	if surgery, ok := data["history_surgeries"]; ok && surgery == "Yes" {
		if details, ok := data["surgeries_details"]; ok && details != "" {
			result.WriteString(`<div class="history-item">`)
			result.WriteString(fmt.Sprintf(`<strong>Surgery History:</strong> %s`, html.EscapeString(details.(string))))
			result.WriteString(`</div>`)
		}
	}
	
	// Accident history
	if accidents, ok := data["history_accidents"]; ok && accidents == "Yes" {
		if details, ok := data["accidents_details"]; ok && details != "" {
			result.WriteString(`<div class="history-item">`)
			result.WriteString(fmt.Sprintf(`<strong>Accident/Injury History:</strong> %s`, html.EscapeString(details.(string))))
			result.WriteString(`</div>`)
		}
	}
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderFamilyAndLifestyle(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="family-lifestyle-section">`)
	result.WriteString(`<h3>Family & Lifestyle</h3>`)
	
	// Family health history
	if family, ok := data["family_health_history"]; ok {
		if familyArray, isArray := family.([]interface{}); isArray && len(familyArray) > 0 {
			result.WriteString(`<div class="lifestyle-item">`)
			result.WriteString(`<strong>Family Health History:</strong>`)
			result.WriteString(`<ul>`)
			for _, condition := range familyArray {
				result.WriteString(fmt.Sprintf(`<li>%s</li>`, html.EscapeString(fmt.Sprintf("%v", condition))))
			}
			result.WriteString(`</ul>`)
			result.WriteString(`</div>`)
		}
	}
	
	// Difficult activities
	if activities, ok := data["difficult_activities"]; ok {
		if activityArray, isArray := activities.([]interface{}); isArray && len(activityArray) > 0 {
			result.WriteString(`<div class="lifestyle-item">`)
			result.WriteString(`<strong>Difficult Activities:</strong>`)
			result.WriteString(`<ul>`)
			for _, activity := range activityArray {
				result.WriteString(fmt.Sprintf(`<li>%s</li>`, html.EscapeString(fmt.Sprintf("%v", activity))))
			}
			result.WriteString(`</ul>`)
			result.WriteString(`</div>`)
		}
	}
	
	// Goals of care
	if goals, ok := data["goals_of_care"]; ok {
		if goalsArray, isArray := goals.([]interface{}); isArray && len(goalsArray) > 0 {
			result.WriteString(`<div class="lifestyle-item">`)
			result.WriteString(`<strong>Goals of Care:</strong>`)
			result.WriteString(`<ul>`)
			for _, goal := range goalsArray {
				result.WriteString(fmt.Sprintf(`<li>%s</li>`, html.EscapeString(fmt.Sprintf("%v", goal))))
			}
			result.WriteString(`</ul>`)
			result.WriteString(`</div>`)
		}
	}
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderSignatures(data map[string]interface{}) string {
	var result bytes.Buffer
	
	result.WriteString(`<div class="signature-section">`)
	result.WriteString(`<h3>Signatures</h3>`)
	result.WriteString(`<div class="signature-grid">`)
	
	// Patient signature
	if signature, ok := data["patient_signature"]; ok && signature != "" {
		result.WriteString(`<div class="signature-item">`)
		result.WriteString(`<strong>Patient Signature:</strong> Present`)
		result.WriteString(`</div>`)
	}
	
	// Signature date
	if date, ok := data["signature_date"]; ok && date != "" {
		result.WriteString(`<div class="signature-item">`)
		result.WriteString(fmt.Sprintf(`<strong>Date:</strong> %s`, html.EscapeString(date.(string))))
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderDisabilityIndices(data map[string]interface{}) string {
	var result bytes.Buffer
	
	// Check for Oswestry Disability Index
	if hasODI := false; hasODI {
		for key := range data {
			if strings.HasPrefix(key, "question") && strings.Contains(key, "3") {
				hasODI = true
				break
			}
		}
		
		if hasODI {
			result.WriteString(`<div class="disability-index-section">`)
			result.WriteString(`<h3>Oswestry Low Back Pain Disability Index</h3>`)
			result.WriteString(`<p>Disability assessment completed</p>`)
			result.WriteString(`</div>`)
		}
	}
	
	// Check for Neck Disability Index  
	if hasNDI := false; hasNDI {
		for key := range data {
			if strings.HasPrefix(key, "question2") {
				hasNDI = true
				break
			}
		}
		
		if hasNDI {
			result.WriteString(`<div class="disability-index-section">`)
			result.WriteString(`<h3>Neck Disability Index</h3>`)
			result.WriteString(`<p>Neck disability assessment completed</p>`)
			result.WriteString(`</div>`)
		}
	}
	
	return result.String()
}