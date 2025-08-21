package services

import (
	"fmt"
	"html"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// GenericFieldRenderer handles rendering of any question type that doesn't have a specialized renderer
type GenericFieldRenderer struct{}

// QuestionType represents different SurveyJS question types
type QuestionType string

const (
	TypeText           QuestionType = "text"
	TypeComment        QuestionType = "comment"
	TypeRadiogroup     QuestionType = "radiogroup"
	TypeCheckbox       QuestionType = "checkbox"
	TypeDropdown       QuestionType = "dropdown"
	TypeRating         QuestionType = "rating"
	TypeBoolean        QuestionType = "boolean"
	TypeImagepicker    QuestionType = "imagepicker"
	TypeFile           QuestionType = "file"
	TypeMultipleText   QuestionType = "multipletext"
	TypeMatrix         QuestionType = "matrix"
	TypeMatrixDropdown QuestionType = "matrixdropdown"
	TypePanel          QuestionType = "panel"
	TypeHTML           QuestionType = "html"
	TypeExpression     QuestionType = "expression"
	TypeUnknown        QuestionType = ""
)

// RenderField renders a single form field with intelligent type detection and formatting
func (r *GenericFieldRenderer) RenderField(element map[string]interface{}, answer interface{}, elementName string, depth int) string {
	if element == nil {
		return r.renderError("Element is nil", elementName)
	}

	// Get element properties
	qType := r.detectQuestionType(element)
	title := r.getElementTitle(element, elementName)

	// Format the answer based on type and content
	formattedAnswer := r.formatAnswer(answer, qType, element)

	// Generate HTML
	html := r.generateFieldHTML(title, formattedAnswer, qType, depth)
	return html
}

// detectQuestionType intelligently determines the question type from element properties
func (r *GenericFieldRenderer) detectQuestionType(element map[string]interface{}) QuestionType {
	// Check explicit type field first
	if typeStr, ok := element["type"].(string); ok {
		switch typeStr {
		case "text", "comment", "radiogroup", "checkbox", "dropdown", "rating", "boolean",
			 "imagepicker", "file", "multipletext", "matrix", "matrixdropdown", "panel", "html", "expression":
			return QuestionType(typeStr)
		}
	}

	// Infer type from other properties
	if _, hasChoices := element["choices"]; hasChoices {
		if _, hasShowNoneItem := element["showNoneItem"]; hasShowNoneItem {
			return TypeRadiogroup
		}
		return TypeDropdown
	}

	if _, hasRateValues := element["rateValues"]; hasRateValues {
		return TypeRating
	}

	if _, hasItems := element["items"]; hasItems {
		return TypeMultipleText
	}

	if _, hasRows := element["rows"]; hasRows {
		return TypeMatrix
	}

	// Default to text for simple input fields
	return TypeText
}

// getElementTitle safely extracts the element title
func (r *GenericFieldRenderer) getElementTitle(element map[string]interface{}, elementName string) string {
	if title, ok := element["title"].(string); ok && title != "" {
		return html.EscapeString(title)
	}

	// Fallback to name if no title
	if elementName != "" {
		return html.EscapeString(elementName)
	}

	return "Untitled Question"
}

// formatAnswer formats the answer based on question type and content
func (r *GenericFieldRenderer) formatAnswer(answer interface{}, qType QuestionType, element map[string]interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	switch qType {
	case TypeCheckbox:
		return r.formatCheckboxAnswer(answer)
	case TypeRadiogroup, TypeDropdown:
		return r.formatChoiceAnswer(answer, element)
	case TypeRating:
		return r.formatRatingAnswer(answer, element)
	case TypeBoolean:
		return r.formatBooleanAnswer(answer)
	case TypeMultipleText:
		return r.formatMultipleTextAnswer(answer)
	case TypeComment:
		return r.formatCommentAnswer(answer)
	case TypeText:
		return r.formatTextAnswer(answer)
	case TypeMatrix, TypeMatrixDropdown:
		return r.formatMatrixAnswer(answer)
	default:
		return r.formatGenericAnswer(answer)
	}
}

// formatCheckboxAnswer handles checkbox questions
func (r *GenericFieldRenderer) formatCheckboxAnswer(answer interface{}) string {
	switch v := answer.(type) {
	case bool:
		if v {
			return `<span class="checkbox-answer checked">✓ Checked</span>`
		}
		return `<span class="checkbox-answer unchecked">✗ Not checked</span>`
	case []interface{}:
		if len(v) == 0 {
			return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
		}
		var items []string
		for _, item := range v {
			items = append(items, fmt.Sprintf(`<li class="checkbox-item">%s</li>`, html.EscapeString(fmt.Sprintf("%v", item))))
		}
		return fmt.Sprintf(`<ul class="checkbox-list">%s</ul>`, strings.Join(items, ""))
	case string:
		if v == "true" || v == "1" {
			return `<span class="checkbox-answer checked">✓ Checked</span>`
		}
		return `<span class="checkbox-answer unchecked">✗ Not checked</span>`
	default:
		return fmt.Sprintf(`<span class="checkbox-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", v)))
	}
}

// formatChoiceAnswer handles radiogroup and dropdown selections
func (r *GenericFieldRenderer) formatChoiceAnswer(answer interface{}, element map[string]interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	answerStr := fmt.Sprintf("%v", answer)
	if answerStr == "" {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	// Try to get choice text from element choices
	if choices, ok := element["choices"].([]interface{}); ok {
		for _, choice := range choices {
			switch c := choice.(type) {
			case map[string]interface{}:
				if value, hasValue := c["value"]; hasValue && fmt.Sprintf("%v", value) == answerStr {
					if text, hasText := c["text"].(string); hasText {
						return fmt.Sprintf(`<span class="choice-answer">%s</span>`, html.EscapeString(text))
					}
				}
			case string:
				if c == answerStr {
					return fmt.Sprintf(`<span class="choice-answer">%s</span>`, html.EscapeString(c))
				}
			}
		}
	}

	// Fallback to raw value
	return fmt.Sprintf(`<span class="choice-answer">%s</span>`, html.EscapeString(answerStr))
}

// formatRatingAnswer handles rating scale questions
func (r *GenericFieldRenderer) formatRatingAnswer(answer interface{}, element map[string]interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	// Convert to numeric
	var rating float64
	switch v := answer.(type) {
	case float64:
		rating = v
	case int:
		rating = float64(v)
	case string:
		if parsedRating, err := strconv.ParseFloat(v, 64); err == nil {
			rating = parsedRating
		} else {
			return fmt.Sprintf(`<span class="rating-answer">%s</span>`, html.EscapeString(v))
		}
	default:
		return fmt.Sprintf(`<span class="rating-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", v)))
	}

	// Get rating display
	rateMax := 5 // Default
	if rateMaxValue, ok := element["rateMax"].(float64); ok {
		rateMax = int(rateMaxValue)
	}

	stars := ""
	for i := 1; i <= rateMax; i++ {
		if float64(i) <= rating {
			stars += "★"
		} else {
			stars += "☆"
		}
	}

	return fmt.Sprintf(`<span class="rating-answer">%s (%g/%d)</span>`, stars, rating, rateMax)
}

// formatBooleanAnswer handles boolean questions
func (r *GenericFieldRenderer) formatBooleanAnswer(answer interface{}) string {
	switch v := answer.(type) {
	case bool:
		if v {
			return `<span class="boolean-answer yes">Yes</span>`
		}
		return `<span class="boolean-answer no">No</span>`
	case string:
		if v == "true" || v == "1" || strings.ToLower(v) == "yes" {
			return `<span class="boolean-answer yes">Yes</span>`
		}
		return `<span class="boolean-answer no">No</span>`
	default:
		return fmt.Sprintf(`<span class="boolean-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", v)))
	}
}

// formatMultipleTextAnswer handles multiple text entry questions
func (r *GenericFieldRenderer) formatMultipleTextAnswer(answer interface{}) string {
	switch v := answer.(type) {
	case map[string]interface{}:
		if len(v) == 0 {
			return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
		}
		var items []string
		for key, value := range v {
			items = append(items, fmt.Sprintf(`<div class="multiple-text-item"><strong>%s:</strong> %s</div>`,
				html.EscapeString(key), html.EscapeString(fmt.Sprintf("%v", value))))
		}
		return fmt.Sprintf(`<div class="multiple-text-answer">%s</div>`, strings.Join(items, ""))
	case []interface{}:
		if len(v) == 0 {
			return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
		}
		var items []string
		for _, item := range v {
			items = append(items, fmt.Sprintf(`<li class="multiple-text-item">%s</li>`, html.EscapeString(fmt.Sprintf("%v", item))))
		}
		return fmt.Sprintf(`<ul class="multiple-text-list">%s</ul>`, strings.Join(items, ""))
	default:
		return fmt.Sprintf(`<span class="multiple-text-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", v)))
	}
}

// formatMatrixAnswer handles matrix and matrix dropdown questions
func (r *GenericFieldRenderer) formatMatrixAnswer(answer interface{}) string {
	switch v := answer.(type) {
	case map[string]interface{}:
		if len(v) == 0 {
			return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
		}
		var items []string
		for key, value := range v {
			items = append(items, fmt.Sprintf(`<tr><td class="matrix-row">%s</td><td class="matrix-value">%s</td></tr>`,
				html.EscapeString(key), html.EscapeString(fmt.Sprintf("%v", value))))
		}
		return fmt.Sprintf(`<table class="matrix-answer"><tbody>%s</tbody></table>`, strings.Join(items, ""))
	default:
		return fmt.Sprintf(`<span class="matrix-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", v)))
	}
}

// formatCommentAnswer handles long text comments
func (r *GenericFieldRenderer) formatCommentAnswer(answer interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	text := fmt.Sprintf("%v", answer)
	if text == "" {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	// Handle long text with word wrapping
	escaped := html.EscapeString(text)
	return fmt.Sprintf(`<div class="comment-answer">%s</div>`, escaped)
}

// formatTextAnswer handles simple text input
func (r *GenericFieldRenderer) formatTextAnswer(answer interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	text := fmt.Sprintf("%v", answer)
	if text == "" {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	// Try to detect if it's a date
	if r.isLikelyDate(text) {
		if formatted, err := r.formatDate(text); err == nil {
			return fmt.Sprintf(`<span class="text-answer date">%s</span>`, formatted)
		}
	}

	// Try to detect if it's a number
	if r.isLikelyNumber(text) {
		return fmt.Sprintf(`<span class="text-answer number">%s</span>`, html.EscapeString(text))
	}

	return fmt.Sprintf(`<span class="text-answer">%s</span>`, html.EscapeString(text))
}

// formatGenericAnswer handles any other answer type
func (r *GenericFieldRenderer) formatGenericAnswer(answer interface{}) string {
	if answer == nil {
		return `<span class="empty-answer" style="color: #999; font-style: italic;">No answer provided</span>`
	}

	return fmt.Sprintf(`<span class="generic-answer">%s</span>`, html.EscapeString(fmt.Sprintf("%v", answer)))
}

// isLikelyDate checks if a string looks like a date
func (r *GenericFieldRenderer) isLikelyDate(text string) bool {
	// Common date patterns
	datePatterns := []string{
		`\d{4}-\d{2}-\d{2}`,     // YYYY-MM-DD
		`\d{2}/\d{2}/\d{4}`,     // MM/DD/YYYY
		`\d{2}-\d{2}-\d{4}`,     // MM-DD-YYYY
		`\d{4}/\d{2}/\d{2}`,     // YYYY/MM/DD
		`\d{1,2}/\d{1,2}/\d{4}`, // M/D/YYYY or MM/DD/YYYY
		`\d{1,2}-\d{1,2}-\d{4}`, // M-D-YYYY or MM-DD-YYYY
	}

	for _, pattern := range datePatterns {
		if matched, _ := regexp.MatchString(pattern, text); matched {
			return true
		}
	}

	return false
}

// formatDate attempts to parse and format a date string
func (r *GenericFieldRenderer) formatDate(text string) (string, error) {
	// Try common date formats
	formats := []string{
		time.RFC3339,
		"2006-01-02",
		"01/02/2006",
		"01-02-2006",
		"2006/01/02",
		"1/2/2006",
		"1-2-2006",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, text); err == nil {
			return t.Format("January 2, 2006"), nil
		}
	}

	return "", fmt.Errorf("unable to parse date")
}

// isLikelyNumber checks if a string looks like a number
func (r *GenericFieldRenderer) isLikelyNumber(text string) bool {
	// Check if it can be parsed as a number
	if _, err := strconv.ParseFloat(text, 64); err == nil {
		return true
	}
	return false
}

// generateFieldHTML creates the final HTML for a field
func (r *GenericFieldRenderer) generateFieldHTML(title, formattedAnswer string, qType QuestionType, depth int) string {
	// Create indentation for nested fields
	indent := strings.Repeat("&nbsp;", depth*4)

	// Determine CSS classes based on question type
	var containerClass string
	switch qType {
	case TypeCheckbox:
		containerClass = "field-container checkbox-field"
	case TypeRating:
		containerClass = "field-container rating-field"
	case TypeComment:
		containerClass = "field-container comment-field"
	case TypeMultipleText:
		containerClass = "field-container multiple-text-field"
	case TypeMatrix, TypeMatrixDropdown:
		containerClass = "field-container matrix-field"
	default:
		containerClass = "field-container text-field"
	}

	return fmt.Sprintf(`<div class="%s" style="margin: 8px 0; padding: 4px 0;">
    %s<div class="field-question" style="font-weight: 600; margin-bottom: 4px;">%s</div>
    <div class="field-answer">%s</div>
</div>`, containerClass, indent, title, formattedAnswer)
}

// renderError creates an error message for rendering issues
func (r *GenericFieldRenderer) renderError(message, elementName string) string {
	safeMessage := html.EscapeString(message)
	safeName := html.EscapeString(elementName)
	return fmt.Sprintf(`<div class="field-error" style="color: #d32f2f; background-color: #ffebee; padding: 8px; margin: 4px 0; border-left: 4px solid #d32f2f;">
    <strong>Rendering Error:</strong> %s (Field: %s)
</div>`, safeMessage, safeName)
}