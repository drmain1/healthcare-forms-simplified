package services

import (
	"bytes"
	"fmt"
	"html"
	"strconv"
	"strings"
)

// OswestryDisabilityRenderer renders Oswestry Disability Index (ODI) assessment data
func OswestryDisabilityRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Oswestry Disability Index (ODI) Assessment</div>`)
	
	// Standard ODI questions mapping
	odiQuestions := map[string]string{
		"oswestry_pain_intensity": "Pain Intensity",
		"oswestry_personal_care":  "Personal Care (washing, dressing, etc.)",
		"oswestry_lifting":        "Lifting",
		"oswestry_walking":        "Walking",
		"oswestry_sitting":        "Sitting",
		"oswestry_standing":       "Standing",
		"oswestry_sleeping":       "Sleeping",
		"oswestry_sex_life":       "Sex Life (if applicable)",
		"oswestry_social_life":    "Social Life",
		"oswestry_traveling":      "Traveling",
	}
	
	// Alternative field names that might be used
	alternativeNames := map[string]string{
		"odi_pain_intensity": "oswestry_pain_intensity",
		"odi_personal_care":  "oswestry_personal_care",
		"odi_lifting":        "oswestry_lifting",
		"odi_walking":        "oswestry_walking",
		"odi_sitting":        "oswestry_sitting",
		"odi_standing":       "oswestry_standing",
		"odi_sleeping":       "oswestry_sleeping",
		"odi_sex_life":       "oswestry_sex_life",
		"odi_social_life":    "oswestry_social_life",
		"odi_traveling":      "oswestry_traveling",
	}
	
	// Calculate scores and collect responses
	responses := make(map[string]interface{})
	scores := make(map[string]int)
	totalScore := 0
	answeredQuestions := 0
	
	// Process each detected ODI field
	for _, elementName := range metadata.ElementNames {
		if value, exists := context.Answers[elementName]; exists {
			responses[elementName] = value
			
			// Convert to ODI score (0-5 points per question)
			if score := convertToOswestryScore(value); score >= 0 {
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
	for questionKey, questionLabel := range odiQuestions {
		if response, exists := responses[questionKey]; exists {
			score := scores[questionKey]
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td>` + html.EscapeString(questionLabel) + `</td>`)
			result.WriteString(`<td>` + html.EscapeString(formatOswestryResponse(response)) + `</td>`)
			result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
			result.WriteString(`</tr>`)
		}
		
		// Check alternative names
		for altName, standardName := range alternativeNames {
			if standardName == questionKey {
				if response, exists := responses[altName]; exists {
					score := scores[altName]
					
					result.WriteString(`<tr>`)
					result.WriteString(`<td>` + html.EscapeString(questionLabel) + `</td>`)
					result.WriteString(`<td>` + html.EscapeString(formatOswestryResponse(response)) + `</td>`)
					result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
					result.WriteString(`</tr>`)
					break
				}
			}
		}
	}
	
	// Check for any non-standard ODI questions
	for _, elementName := range metadata.ElementNames {
		if _, isStandard := odiQuestions[elementName]; !isStandard {
			if _, isAlt := alternativeNames[elementName]; !isAlt {
				if response, exists := responses[elementName]; exists {
					score := scores[elementName]
					
					result.WriteString(`<tr>`)
					result.WriteString(`<td>` + html.EscapeString(formatFieldLabel(elementName, "")) + `</td>`)
					result.WriteString(`<td>` + html.EscapeString(formatOswestryResponse(response)) + `</td>`)
					result.WriteString(`<td style="text-align: center;">` + fmt.Sprintf("%d/5", score) + `</td>`)
					result.WriteString(`</tr>`)
				}
			}
		}
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	// Add scoring summary
	if answeredQuestions > 0 {
		// ODI calculation: (total score / (answered questions * 5)) * 100
		disabilityIndex := float64(totalScore) / (float64(answeredQuestions) * 5.0) * 100
		
		result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #f0f8f7; border-left: 4px solid #38a169;">`)
		result.WriteString(`<h4>ODI Score Summary</h4>`)
		result.WriteString(`<p><strong>Total Score:</strong> ` + fmt.Sprintf("%d", totalScore) + ` points</p>`)
		result.WriteString(`<p><strong>Questions Answered:</strong> ` + fmt.Sprintf("%d of 10", answeredQuestions) + `</p>`)
		result.WriteString(`<p><strong>Disability Index:</strong> ` + fmt.Sprintf("%.1f%%", disabilityIndex) + `</p>`)
		result.WriteString(`<p><strong>Interpretation:</strong> ` + interpretOswestryScore(disabilityIndex) + `</p>`)
		
		// Add scoring guide
		result.WriteString(`<div style="margin-top: 15px; font-size: 11px; color: #666;">`)
		result.WriteString(`<p><strong>ODI Disability Scale:</strong></p>`)
		result.WriteString(`<ul style="margin-left: 20px;">`)
		result.WriteString(`<li>0-20%: Minimal disability</li>`)
		result.WriteString(`<li>21-40%: Moderate disability</li>`)
		result.WriteString(`<li>41-60%: Severe disability</li>`)
		result.WriteString(`<li>61-80%: Crippling disability</li>`)
		result.WriteString(`<li>81-100%: Complete disability (bed-bound or exaggerating)</li>`)
		result.WriteString(`</ul>`)
		result.WriteString(`<p style="margin-top: 10px; font-style: italic;">Note: The ODI is calculated as a percentage based on answered questions only.</p>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
	} else {
		result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">`)
		result.WriteString(`<p>No valid ODI responses found for scoring calculation.</p>`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func convertToOswestryScore(value interface{}) int {
	// Convert response to 0-5 ODI scoring scale
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
		
		// Pain intensity responses
		if strings.Contains(lowerV, "no pain") || lowerV == "0" {
			return 0
		}
		if strings.Contains(lowerV, "very mild") || strings.Contains(lowerV, "minimal") {
			return 1
		}
		if strings.Contains(lowerV, "moderate") {
			return 2
		}
		if strings.Contains(lowerV, "fairly severe") || strings.Contains(lowerV, "considerable") {
			return 3
		}
		if strings.Contains(lowerV, "very severe") || strings.Contains(lowerV, "great difficulty") {
			return 4
		}
		if strings.Contains(lowerV, "worst") || strings.Contains(lowerV, "unable") || strings.Contains(lowerV, "impossible") {
			return 5
		}
		
		// General disability level responses
		switch lowerV {
		case "no difficulty", "no problem", "normal":
			return 0
		case "slight difficulty", "minimal problem", "mild limitation":
			return 1
		case "moderate difficulty", "some problem", "moderate limitation":
			return 2
		case "considerable difficulty", "significant problem", "major limitation":
			return 3
		case "great difficulty", "severe problem", "severe limitation":
			return 4
		case "complete inability", "unable", "impossible", "bed rest":
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

func formatOswestryResponse(response interface{}) string {
	if response == nil {
		return "No response"
	}
	
	responseStr := fmt.Sprintf("%v", response)
	
	// If it's a numeric response, add context
	if score, err := strconv.Atoi(responseStr); err == nil && score >= 0 && score <= 5 {
		descriptions := []string{
			"No difficulty/normal function",
			"Slight difficulty/minimal limitation",
			"Moderate difficulty/some limitation",
			"Considerable difficulty/significant limitation",
			"Great difficulty/severe limitation",
			"Unable to perform/complete limitation",
		}
		if score < len(descriptions) {
			return fmt.Sprintf("%s (%d)", descriptions[score], score)
		}
	}
	
	return responseStr
}

func interpretOswestryScore(percent float64) string {
	switch {
	case percent <= 20:
		return "Minimal disability - able to cope with most activities of daily living"
	case percent <= 40:
		return "Moderate disability - experiencing more pain and difficulty sitting, lifting, and standing"
	case percent <= 60:
		return "Severe disability - pain remains the main problem, but travel and work are becoming increasingly difficult"
	case percent <= 80:
		return "Crippling disability - back pain impinges on all aspects of daily life and work"
	default:
		return "Complete disability - bed-bound or symptoms may be exaggerated"
	}
}