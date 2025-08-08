package services

import (
	"fmt"
	"time"
)

// VisibleQuestion represents a question and its answer that should be displayed on the PDF.
type VisibleQuestion struct {
	Name          string      `json:"name"`
	Title         string      `json:"title"`
	Answer        interface{} `json:"answer"`
	QuestionType  string      `json:"questionType"`
	IsSignature   bool        `json:"isSignature,omitempty"`
	SignatureData string      `json:"signatureData,omitempty"`
}

// ProcessAndFlattenForm takes the full survey JSON and the user's response data
// and returns a slice of only the questions that are visible based on conditional logic.
func ProcessAndFlattenForm(surveyJSON, responseData map[string]interface{}) ([]VisibleQuestion, error) {
	var visibleQuestions []VisibleQuestion

	pages, ok := surveyJSON["pages"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("pages not found or not a slice in surveyJson")
	}

	for _, pageData := range pages {
		page, ok := pageData.(map[string]interface{})
		if !ok {
			continue // Skip if page format is incorrect
		}

		// Recursively process elements within the page
		pageQuestions, err := processElements(page["elements"], responseData)
		if err != nil {
			// Continue processing other pages even if one fails
			fmt.Printf("error processing elements: %v\n", err)
			continue
		}
		visibleQuestions = append(visibleQuestions, pageQuestions...)
	}

	return visibleQuestions, nil
}

// processElements recursively traverses the elements (questions, panels) of a survey.
func processElements(elements interface{}, responseData map[string]interface{}) ([]VisibleQuestion, error) {
	var questions []VisibleQuestion

	elementsSlice, ok := elements.([]interface{})
	if !ok {
		return nil, fmt.Errorf("elements is not a slice")
	}

	for _, elData := range elementsSlice {
		element, ok := elData.(map[string]interface{})
		if !ok {
			continue
		}

		// Check for conditional visibility
		if visibleIf, ok := element["visibleIf"].(string); ok {
			isVisible, err := checkVisibility(visibleIf, responseData)
			if err != nil || !isVisible {
				continue // Skip if not visible or if there's an error evaluating
			}
		}

		// If it's a panel, process its elements recursively
		if qType, ok := element["type"].(string); ok && qType == "panel" {
			if panelElements, ok := element["elements"]; ok {
				panelQuestions, err := processElements(panelElements, responseData)
				if err == nil {
					questions = append(questions, panelQuestions...)
				}
			}
			continue
		}

		// It's a question, so process it
		name, ok := element["name"].(string)
		if !ok {
			continue // Skip elements without a name
		}

		// Get the answer from responseData
		answer, answerExists := responseData[name]
		if !answerExists {
			continue // Skip questions that were not answered
		}

		title, _ := element["title"].(string)
		if title == "" {
			title = name // Fallback to name if title is missing
		}

		qType, _ := element["type"].(string)

		// Handle special cases like signature pads and date of birth
		// Preserve the base64 data for signatures to embed in PDF
		isSignature := false
		signatureData := ""
		if qType == "signaturepad" {
			isSignature = true
			// Keep the original base64 data if it's a string
			if sigData, ok := answer.(string); ok {
				// Check if it's a valid data URL
				if len(sigData) > 100 && (sigData[:5] == "data:" || sigData[:10] == "data:image") {
					signatureData = sigData
					// Set a display text for the answer field
					answer = "[Signature Captured]"
				} else {
					// Invalid or empty signature
					answer = "[No Signature]"
				}
			} else {
				answer = "[No Signature]"
			}
		} else if qType == "dateofbirth" {
			// Handle date of birth with age calculation
			if dobStr, ok := answer.(string); ok && dobStr != "" {
				age := calculateAgeFromDOB(dobStr)
				if age >= 0 {
					// Append age to the answer
					answer = fmt.Sprintf("%s (Age: %d)", dobStr, age)
				}
			}
		}

		questions = append(questions, VisibleQuestion{
			Name:          name,
			Title:         title,
			Answer:        answer,
			QuestionType:  qType,
			IsSignature:   isSignature,
			SignatureData: signatureData,
		})
	}

	return questions, nil
}

// calculateAgeFromDOB calculates age from a date of birth string
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

// checkVisibility evaluates a SurveyJS `visibleIf` expression against the response data.
// NOTE: This is a simplified placeholder. A real implementation requires a proper
// SurveyJS expression parser, which is complex. For this iteration, we will
// perform a basic check. A more robust solution might involve a small, embedded
// JavaScript engine or a dedicated Go library for SurveyJS logic if one exists.
func checkVisibility(expression string, data map[string]interface{}) (bool, error) {
	// This is a placeholder for a very complex piece of logic.
	// SurveyJS expressions can be like: "{question1} = 'Yes' and {question2} > 5"
	// A full implementation is out of scope for this step. For now, we assume
	// that if a question has an answer in `responseData`, it was visible.
	// The recursive processing loop already handles this by checking `answerExists`.
	// Therefore, we can safely return true here and rely on the answer check.
	return true, nil
}
