package services

import (
	"fmt"
	"html/template"
	"log"
	"strconv"
	"strings"
	"time"
)

// VisibleQuestion represents a question and its answer that should be displayed on the PDF.
type VisibleQuestion struct {
	Name          string       `json:"name"`
	Title         string       `json:"title"`
	Answer        interface{}  `json:"answer"`
	QuestionType  string       `json:"questionType"`
	IsSignature   bool         `json:"isSignature,omitempty"`
	SignatureData template.URL `json:"signatureData,omitempty"`
	IsBodyDiagram bool         `json:"isBodyDiagram,omitempty"`
	BodyDiagramData interface{} `json:"bodyDiagramData,omitempty"`
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

		// Check visibility condition before processing
		if visibleIf, ok := element["visibleIf"].(string); ok && visibleIf != "" {
			visible, err := checkVisibility(visibleIf, responseData)
			if err != nil {
				// Log error but continue processing
				fmt.Printf("Error evaluating visibility for element: %v\n", err)
			}
			if !visible {
				continue // Skip this element and its children if not visible
			}
		}

		// If it's a panel or a question with nested elements, process them recursively
		if subElements, ok := element["elements"]; ok {
			panelQuestions, err := processElements(subElements, responseData)
			if err == nil {
				questions = append(questions, panelQuestions...)
			}
		}

		// Process the element itself if it's a question
		qType, isQuestion := element["type"].(string)
		if !isQuestion || qType == "panel" { // Skip panels themselves after processing their elements
			continue
		}

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

		isSignature := false
		var signatureData template.URL
		if qType == "signaturepad" {
			isSignature = true
			if sigData, ok := answer.(string); ok && strings.HasPrefix(sigData, "data:image/") {
				signatureData = template.URL(sigData)
				answer = "[Signature Captured]"
				log.Printf("--- DEBUG: Successfully processed signature for question: %s ---", name)
			} else {
				answer = "[No Signature]"
				log.Printf("--- DEBUG: Failed to process signature for question: %s. Data type: %T, Value: %v ---", name, answer, answer)
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
		} else if qType == "bodydiagram" || qType == "bodypaindiagram" {
			// Handle body diagram pain points
			// The answer should be an array of pain points
			// We'll keep the raw data for PDF rendering
			log.Printf("--- DEBUG: Processing body diagram for question: %s, type: %s, data type: %T ---", name, qType, answer)
			// Keep the raw answer data for special rendering in PDF
		}

		// Check if this is a body diagram question (both old and new types)
		isBodyDiagram := qType == "bodydiagram" || qType == "bodypaindiagram"
		var bodyDiagramData interface{}
		if isBodyDiagram {
			bodyDiagramData = answer
			// Format the answer for display
			if painPoints, ok := answer.([]interface{}); ok && len(painPoints) > 0 {
				answer = fmt.Sprintf("[%d pain areas marked]", len(painPoints))
			} else {
				answer = "[No pain areas marked]"
			}
		}

		questions = append(questions, VisibleQuestion{
			Name:          name,
			Title:         title,
			Answer:        answer,
			QuestionType:  qType,
			IsSignature:   isSignature,
			SignatureData: signatureData,
			IsBodyDiagram: isBodyDiagram,
			BodyDiagramData: bodyDiagramData,
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

// FormatDateUSA formats a date string to USA format (M-D-YYYY)
func FormatDateUSA(dateStr string) string {
	// Try to parse common date formats and convert to USA format
	var parsedDate time.Time
	var err error
	
	// Try common input formats
	formats := []string{
		"2006-01-02",           // ISO format (YYYY-MM-DD)
		"01/02/2006",           // US format
		"02/01/2006",           // EU format  
		time.RFC3339,           // Full timestamp
		"2006-01-02T15:04:05Z", // ISO 8601
	}
	
	for _, format := range formats {
		parsedDate, err = time.Parse(format, dateStr)
		if err == nil {
			// Successfully parsed - format as USA date
			month := int(parsedDate.Month())
			day := parsedDate.Day()
			year := parsedDate.Year()
			return fmt.Sprintf("%d-%d-%d", month, day, year)
		}
	}
	
	// If can't parse, return original
	return dateStr
}

// FormatTimestampUSA formats current timestamp in USA format
func FormatTimestampUSA() string {
	now := time.Now()
	return fmt.Sprintf("%d-%d-%d at %d:%02d %s",
		int(now.Month()), now.Day(), now.Year(),
		now.Hour()%12, now.Minute(), getAMPM(now.Hour()))
}

// FormatDateTimeUSA formats a time.Time to USA format with time
func FormatDateTimeUSA(t time.Time) string {
	return fmt.Sprintf("%d-%d-%d at %d:%02d %s",
		int(t.Month()), t.Day(), t.Year(),
		t.Hour()%12, t.Minute(), getAMPM(t.Hour()))
}

// Helper function to get AM/PM
func getAMPM(hour int) string {
	if hour >= 12 {
		return "PM"
	}
	return "AM"
}

// checkVisibility evaluates a SurveyJS `visibleIf` expression against the response data.
// This implementation handles common SurveyJS expression patterns.
func checkVisibility(expression string, data map[string]interface{}) (bool, error) {
	if expression == "" {
		return true, nil // No condition means always visible
	}

	// Handle common SurveyJS expression patterns
	// Examples:
	// "{question1} = 'value'"
	// "{question1} != 'value'"
	// "{question1} > 5"
	// "{question1} empty"
	// "{question1} notempty"
	// "{question1} = 'value1' or {question1} = 'value2'"
	// "{question1} = 'Yes' and {question2} > 5"

	return evaluateSurveyJSExpression(expression, data)
}

// evaluateSurveyJSExpression parses and evaluates SurveyJS conditional expressions
func evaluateSurveyJSExpression(expr string, data map[string]interface{}) (bool, error) {
	expr = strings.TrimSpace(expr)
	
	// Handle logical operators (and, or)
	if strings.Contains(expr, " or ") {
		parts := strings.Split(expr, " or ")
		for _, part := range parts {
			result, err := evaluateSurveyJSExpression(strings.TrimSpace(part), data)
			if err != nil {
				return false, err
			}
			if result {
				return true, nil // OR: return true if any part is true
			}
		}
		return false, nil
	}
	
	if strings.Contains(expr, " and ") {
		parts := strings.Split(expr, " and ")
		for _, part := range parts {
			result, err := evaluateSurveyJSExpression(strings.TrimSpace(part), data)
			if err != nil {
				return false, err
			}
			if !result {
				return false, nil // AND: return false if any part is false
			}
		}
		return true, nil
	}
	
	// Handle negation
	if strings.HasPrefix(expr, "not ") {
		result, err := evaluateSurveyJSExpression(strings.TrimPrefix(expr, "not "), data)
		return !result, err
	}
	
	// Handle special functions
	if strings.Contains(expr, " empty") {
		varName := extractVariableName(strings.TrimSuffix(expr, " empty"))
		value, exists := data[varName]
		if !exists {
			return true, nil // Non-existent is considered empty
		}
		return isEmptyValue(value), nil
	}
	
	if strings.Contains(expr, " notempty") {
		varName := extractVariableName(strings.TrimSuffix(expr, " notempty"))
		value, exists := data[varName]
		if !exists {
			return false, nil // Non-existent is considered empty
		}
		return !isEmptyValue(value), nil
	}
	
	// Handle comparison operators
	comparisons := []struct {
		op string
		fn func(left, right interface{}) bool
	}{
		{" != ", func(l, r interface{}) bool { return !compareValues(l, r, "=") }},
		{" <= ", func(l, r interface{}) bool { return compareValues(l, r, "<=") }},
		{" >= ", func(l, r interface{}) bool { return compareValues(l, r, ">=") }},
		{" = ", func(l, r interface{}) bool { return compareValues(l, r, "=") }},
		{" < ", func(l, r interface{}) bool { return compareValues(l, r, "<") }},
		{" > ", func(l, r interface{}) bool { return compareValues(l, r, ">") }},
	}
	
	for _, comp := range comparisons {
		if strings.Contains(expr, comp.op) {
			parts := strings.SplitN(expr, comp.op, 2)
			if len(parts) != 2 {
				continue
			}
			
			leftVar := extractVariableName(strings.TrimSpace(parts[0]))
			rightValue := parseValue(strings.TrimSpace(parts[1]))
			
			leftValue, exists := data[leftVar]
			if !exists {
				// Variable doesn't exist in data
				return comp.op == " != ", nil // Only != returns true for non-existent
			}
			
			return comp.fn(leftValue, rightValue), nil
		}
	}
	
	// Handle contains function
	if strings.Contains(expr, " contains ") {
		parts := strings.SplitN(expr, " contains ", 2)
		if len(parts) == 2 {
			leftVar := extractVariableName(strings.TrimSpace(parts[0]))
			rightValue := parseValue(strings.TrimSpace(parts[1]))
			
			leftValue, exists := data[leftVar]
			if !exists {
				return false, nil
			}
			
			return containsValue(leftValue, rightValue), nil
		}
	}
	
	// If no operators found, check if it's a simple variable reference
	// In SurveyJS, a simple {variable} evaluates to true if it has a truthy value
	if strings.HasPrefix(expr, "{") && strings.HasSuffix(expr, "}") {
		varName := extractVariableName(expr)
		value, exists := data[varName]
		if !exists {
			return false, nil
		}
		return !isEmptyValue(value), nil
	}
	
	// Default to true if we can't parse the expression
	// This maintains backward compatibility
	return true, nil
}

// extractVariableName extracts the variable name from {variable} format
func extractVariableName(expr string) string {
	expr = strings.TrimSpace(expr)
	if strings.HasPrefix(expr, "{") && strings.HasSuffix(expr, "}") {
		return expr[1 : len(expr)-1]
	}
	return expr
}

// parseValue parses a value from the expression (handles strings, numbers, booleans)
func parseValue(val string) interface{} {
	val = strings.TrimSpace(val)
	
	// Handle string literals
	if (strings.HasPrefix(val, "'") && strings.HasSuffix(val, "'")) ||
	   (strings.HasPrefix(val, "\"") && strings.HasSuffix(val, "\"")) {
		return val[1 : len(val)-1]
	}
	
	// Handle boolean
	if val == "true" {
		return true
	}
	if val == "false" {
		return false
	}
	
	// Handle numbers
	if num, err := strconv.ParseFloat(val, 64); err == nil {
		return num
	}
	if num, err := strconv.Atoi(val); err == nil {
		return num
	}
	
	// Handle variable reference
	if strings.HasPrefix(val, "{") && strings.HasSuffix(val, "}") {
		return val // Return as-is for variable references (not supported in right-hand side yet)
	}
	
	return val
}

// isEmptyValue checks if a value is considered empty in SurveyJS
func isEmptyValue(value interface{}) bool {
	if value == nil {
		return true
	}
	
	switch v := value.(type) {
	case string:
		return v == ""
	case []interface{}:
		return len(v) == 0
	case map[string]interface{}:
		return len(v) == 0
	case bool:
		return !v
	case float64:
		return v == 0
	case int:
		return v == 0
	default:
		return false
	}
}

// compareValues compares two values based on the operator
func compareValues(left, right interface{}, op string) bool {
	// Handle nil cases
	if left == nil || right == nil {
		if op == "=" {
			return left == right
		}
		return false
	}
	
	// Convert to comparable types
	switch op {
	case "=":
		return fmt.Sprintf("%v", left) == fmt.Sprintf("%v", right)
	case "<", ">", "<=", ">=":
		// Try to compare as numbers
		leftNum, leftOk := toFloat64(left)
		rightNum, rightOk := toFloat64(right)
		
		if leftOk && rightOk {
			switch op {
			case "<":
				return leftNum < rightNum
			case ">":
				return leftNum > rightNum
			case "<=":
				return leftNum <= rightNum
			case ">=":
				return leftNum >= rightNum
			}
		}
		
		// Fall back to string comparison
		leftStr := fmt.Sprintf("%v", left)
		rightStr := fmt.Sprintf("%v", right)
		
		switch op {
		case "<":
			return leftStr < rightStr
		case ">":
			return leftStr > rightStr
		case "<=":
			return leftStr <= rightStr
		case ">=":
			return leftStr >= rightStr
		}
	}
	
	return false
}

// toFloat64 attempts to convert a value to float64
func toFloat64(val interface{}) (float64, bool) {
	switch v := val.(type) {
	case float64:
		return v, true
	case int:
		return float64(v), true
	case string:
		if num, err := strconv.ParseFloat(v, 64); err == nil {
			return num, true
		}
	}
	return 0, false
}

// containsValue checks if left contains right (for arrays or strings)
func containsValue(left, right interface{}) bool {
	switch l := left.(type) {
	case string:
		rightStr := fmt.Sprintf("%v", right)
		return strings.Contains(l, rightStr)
	case []interface{}:
		rightStr := fmt.Sprintf("%v", right)
		for _, item := range l {
			if fmt.Sprintf("%v", item) == rightStr {
				return true
			}
		}
	}
	return false
}
