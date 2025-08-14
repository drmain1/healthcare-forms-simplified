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
	
	result.WriteString(`<div class="form-section">`)
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
	
	// Render the assessment table
	result.WriteString(`<table class="data-table">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Question Category</th>`)
	result.WriteString(`<th>Response</th>`)
	result.WriteString(`<th>Score</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	// Display questions in standard order, but only those that were answered
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
	
	// Check for any non-standard NDI questions
	for _, elementName := range metadata.ElementNames {
		if _, isStandard := ndiQuestions[elementName]; !isStandard {
			if response, exists := responses[elementName]; exists {
				score := scores[elementName]
				
				result.WriteString(`<tr>`)
				result.WriteString(`<td>` + html.EscapeString(formatFieldLabel(elementName, "")) + `</td>`)
				result.WriteString(`<td>` + html.EscapeString(formatNDIResponse(response)) + `</td>`)
				result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
				result.WriteString(`</tr>`)
			}
		}
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	// Add scoring summary
	if answeredQuestions > 0 {
		maxPossibleScore := answeredQuestions * 5
		disabilityPercent := float64(totalScore) / float64(maxPossibleScore) * 100
		
		result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #f0f8f7; border-left: 4px solid #38a169;">`)
		result.WriteString(`<h4>NDI Score Summary</h4>`)
		result.WriteString(`<p><strong>Total Score:</strong> ` + fmt.Sprintf("%d/%d", totalScore, maxPossibleScore) + ` (` + fmt.Sprintf("%.1f%%", disabilityPercent) + `)</p>`)
		result.WriteString(`<p><strong>Questions Answered:</strong> ` + fmt.Sprintf("%d of 10", answeredQuestions) + `</p>`)
		result.WriteString(`<p><strong>Interpretation:</strong> ` + interpretNDIScore(disabilityPercent) + `</p>`)
		
		// Add scoring guide
		result.WriteString(`<div style="margin-top: 15px; font-size: 11px; color: #666;">`)
		result.WriteString(`<p><strong>NDI Disability Scale:</strong></p>`)
		result.WriteString(`<ul style="margin-left: 20px;">`)
		result.WriteString(`<li>0-8%: No disability</li>`)
		result.WriteString(`<li>9-18%: Mild disability</li>`)
		result.WriteString(`<li>19-34%: Moderate disability</li>`)
		result.WriteString(`<li>35-52%: Severe disability</li>`)
		result.WriteString(`<li>53-100%: Complete disability</li>`)
		result.WriteString(`</ul>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
	} else {
		result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">`)
		result.WriteString(`<p>No valid NDI responses found for scoring calculation.</p>`)
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

func formatFieldLabel(fieldName, label string) string {
	if label == "" || label == fieldName {
		// Convert field name to human readable
		label = strings.Title(strings.ReplaceAll(fieldName, "_", " "))
	}
	return html.EscapeString(label)
}