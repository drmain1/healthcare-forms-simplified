package services

import (
	"bytes"
	"fmt"
	"html"
	"strconv"
	"strings"
)

// NeckDisabilityRenderer renders Neck Disability Index (NDI) assessment data
func NeckDisabilityRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section" style="margin-bottom: 15px;">`)
	result.WriteString(`<div class="section-title">Neck Disability Index (NDI) Assessment</div>`)
	
	// Standard NDI questions mapping
	ndiQuestions := map[string]string{
		"ndi_pain_intensity": "Pain Intensity",
		"ndi_personal_care":  "Personal Care (washing, dressing, etc.)",
		"ndi_lifting":        "Lifting",
		"ndi_reading":        "Reading",
		"ndi_headaches":      "Headaches",
		"ndi_concentration":  "Concentration",
		"ndi_work":           "Work",
		"ndi_driving":        "Driving",
		"ndi_sleeping":       "Sleeping",
		"ndi_recreation":     "Recreation",
	}
	
	// Mapping for generic field names 
	// Note: question1 is name, question2 might be date
	// The actual NDI questions start from question3
	genericQuestionMapping := map[string]string{
		"question3":  "Pain Intensity",
		"question4":  "Personal Care",
		"question5":  "Lifting",
		"question6":  "Reading",
		"question7":  "Headaches",
		"question8":  "Concentration",
		"question9":  "Work",
		"question10": "Driving",
		"question11": "Sleeping",
		"question12": "Recreation",
	}
	
	// Calculate scores and collect responses
	responses := make(map[string]interface{})
	scores := make(map[string]int)
	totalScore := 0
	answeredQuestions := 0
	
	// Process each detected NDI field
	for _, elementName := range metadata.ElementNames {
		if value, exists := context.Answers[elementName]; exists {
			responses[elementName] = value
			
			// Convert to NDI score (0-5 points per question)
			if score := convertToNDIScore(value); score >= 0 {
				scores[elementName] = score
				totalScore += score
				answeredQuestions++
			}
		}
	}
	
	// Print patient info if available
	patientInfoHTML := ""
	if patientName, exists := context.Answers["question1"]; exists {
		patientInfoHTML += `<p style="margin: 2px 0; font-size: 11px;"><strong>Patient Name:</strong> ` + html.EscapeString(fmt.Sprintf("%v", patientName)) + `</p>`
	}
	if assessmentDate, exists := context.Answers["question2"]; exists {
		patientInfoHTML += `<p style="margin: 2px 0; font-size: 11px;"><strong>Assessment Date:</strong> ` + html.EscapeString(fmt.Sprintf("%v", assessmentDate)) + `</p>`
	}
	if patientInfoHTML != "" {
		result.WriteString(`<div style="margin-bottom: 10px;">`)
		result.WriteString(patientInfoHTML)
		result.WriteString(`</div>`)
	}
	
	// Render the assessment table
	result.WriteString(`<table class="data-table" style="font-size: 10px;">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Question Category</th>`)
	result.WriteString(`<th>Response</th>`)
	result.WriteString(`<th>Score</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	// Display questions in order - check generic names first (question3-12)
	displayOrder := []string{"question3", "question4", "question5", "question6", "question7", 
	                        "question8", "question9", "question10", "question11", "question12"}
	
	for _, questionKey := range displayOrder {
		if response, exists := responses[questionKey]; exists {
			score := scores[questionKey]
			questionLabel := genericQuestionMapping[questionKey]
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td>` + html.EscapeString(questionLabel) + `</td>`)
			result.WriteString(`<td>` + html.EscapeString(formatNDIResponse(response)) + `</td>`)
			result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
			result.WriteString(`</tr>`)
		}
	}
	
	// Also check standard NDI field names for backward compatibility
	for questionKey, questionLabel := range ndiQuestions {
		if response, exists := responses[questionKey]; exists {
			score := scores[questionKey]
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td>` + html.EscapeString(questionLabel) + `</td>`)
			result.WriteString(`<td>` + html.EscapeString(formatNDIResponse(response)) + `</td>`)
			result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
			result.WriteString(`</tr>`)
		}
	}
	
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	// Add scoring summary
	if answeredQuestions > 0 {
		maxPossibleScore := answeredQuestions * 5
		disabilityPercent := float64(totalScore) / float64(maxPossibleScore) * 100
		
		result.WriteString(`<div style="margin-top: 15px; padding: 10px; background-color: #f0f8f7; border-left: 4px solid #38a169;">`)
		result.WriteString(`<h4 style="font-size: 13px; margin-bottom: 8px;">NDI Score Summary</h4>`)
		result.WriteString(`<p style="margin: 4px 0; font-size: 11px;"><strong>Total Score:</strong> ` + fmt.Sprintf("%d/%d", totalScore, maxPossibleScore) + ` (` + fmt.Sprintf("%.1f%%", disabilityPercent) + `)</p>`)
		result.WriteString(`<p style="margin: 4px 0; font-size: 11px;"><strong>Questions Answered:</strong> ` + fmt.Sprintf("%d of 10", answeredQuestions) + `</p>`)
		result.WriteString(`<p style="margin: 4px 0; font-size: 11px;"><strong>Interpretation:</strong> ` + interpretNDIScore(disabilityPercent) + `</p>`)
		
		// Add scoring guide
		result.WriteString(`<div style="margin-top: 10px; font-size: 10px; color: #666;">`)
		result.WriteString(`<p style="margin-bottom: 5px;"><strong>NDI Disability Scale:</strong></p>`)
		result.WriteString(`<ul style="margin-left: 20px; margin: 5px 0;">`)
		result.WriteString(`<li>0-8%: No disability</li>`)
		result.WriteString(`<li>9-18%: Mild disability</li>`)
		result.WriteString(`<li>19-34%: Moderate disability</li>`)
		result.WriteString(`<li>35-52%: Severe disability</li>`)
		result.WriteString(`<li>53-100%: Complete disability</li>`)
		result.WriteString(`</ul>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
	} else {
		result.WriteString(`<div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107;">`)
		result.WriteString(`<p>No valid NDI responses found for scoring calculation.</p>`)
		result.WriteString(`</div>`)
	}
	
	// Check if there's a signature field and render it inline
	// Check all common signature field names including those found in logs
	possibleSignatureFields := []string{"question19", "question38", "question12", "question13", "signature", "patient_signature", "sign"}
	var signatureData string
	for _, fieldName := range possibleSignatureFields {
		if value, exists := context.Answers[fieldName]; exists {
			if sigStr, ok := value.(string); ok && strings.HasPrefix(sigStr, "data:image/") {
				signatureData = sigStr
				break
			}
		}
	}
	
	// If we found a signature, render it at the bottom
	if signatureData != "" {
		result.WriteString(`<div style="margin-top: 15px;">`)
		result.WriteString(`<p style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">Patient Signature:</p>`)
		
		// The signature image with underline, mimicking paper signature
		result.WriteString(`<div style="position: relative; margin: 8px 0;">`)
		result.WriteString(`<img src="` + html.EscapeString(signatureData) + `" alt="Signature" style="max-width: 180px; height: 45px; object-fit: contain; display: block;">`)
		result.WriteString(`<div style="border-bottom: 1px solid #000; margin-top: -3px; width: 220px;"></div>`)
		result.WriteString(`</div>`)
		
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func convertToNDIScore(value interface{}) int {
	// Convert response to 0-5 NDI scoring scale
	switch v := value.(type) {
	case float64:
		// Direct numeric score
		if v >= 0 && v <= 5 {
			return int(v)
		}
	case int:
		// Direct numeric score
		if v >= 0 && v <= 5 {
			return v
		}
	case string:
		// Try to parse as number first
		if score, err := strconv.Atoi(v); err == nil && score >= 0 && score <= 5 {
			return score
		}
		
		// Map text responses to scores
		lowerV := strings.ToLower(strings.TrimSpace(v))
		switch lowerV {
		case "no pain", "no difficulty", "no limitation", "never":
			return 0
		case "mild pain", "slight difficulty", "minimal limitation", "rarely":
			return 1
		case "moderate pain", "moderate difficulty", "some limitation", "sometimes":
			return 2
		case "fairly severe pain", "considerable difficulty", "much limitation", "often":
			return 3
		case "very severe pain", "great difficulty", "severe limitation", "very often":
			return 4
		case "worst possible pain", "unable", "complete limitation", "always":
			return 5
		default:
			// Try to extract number from string like "Score: 3" or "3/5"
			if strings.Contains(lowerV, "/5") {
				parts := strings.Split(lowerV, "/")
				if len(parts) > 0 {
					if score, err := strconv.Atoi(strings.TrimSpace(parts[0])); err == nil && score >= 0 && score <= 5 {
						return score
					}
				}
			}
		}
	}
	
	// Default to -1 for invalid/unrecognized responses
	return -1
}

func formatNDIResponse(response interface{}) string {
	if response == nil {
		return "No response"
	}
	
	responseStr := fmt.Sprintf("%v", response)
	
	// If it's a numeric response, add context
	if score, err := strconv.Atoi(responseStr); err == nil && score >= 0 && score <= 5 {
		descriptions := []string{
			"No difficulty/pain", 
			"Mild difficulty/pain",
			"Moderate difficulty/pain",
			"Considerable difficulty/pain",
			"Great difficulty/pain",
			"Unable/Severe pain",
		}
		if score < len(descriptions) {
			return fmt.Sprintf("%s (%d)", descriptions[score], score)
		}
	}
	
	return responseStr
}

func interpretNDIScore(percent float64) string {
	switch {
	case percent <= 8:
		return "No disability - minimal symptoms that do not interfere with daily activities"
	case percent <= 18:
		return "Mild disability - symptoms cause some interference with daily activities"
	case percent <= 34:
		return "Moderate disability - symptoms cause significant interference with daily activities"
	case percent <= 52:
		return "Severe disability - symptoms greatly limit daily activities"
	default:
		return "Complete disability - symptoms prevent most daily activities"
	}
}