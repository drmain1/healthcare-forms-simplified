package services

import (
	"bytes"
	"html"
	"strings"
)

// TermsConditionsRenderer renders full terms and conditions text
func TermsConditionsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Terms and Conditions</div>`)
	
	// Get content from template data or form answers
	var content string
	if metadata.TemplateData != nil {
		if contentVal, exists := metadata.TemplateData["content"]; exists {
			if contentStr, ok := contentVal.(string); ok {
				content = contentStr
			}
		}
	}
	
	// If no content from template data, try to get from answers
	if content == "" {
		for _, elementName := range metadata.ElementNames {
			if value, exists := context.Answers[elementName]; exists {
				if strValue, ok := value.(string); ok && strValue != "" {
					content = strValue
					break
				}
			}
		}
	}
	
	if content != "" {
		// Process HTML content
		processedContent := processTermsContent(content)
		
		result.WriteString(`<div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; margin: 10px 0;">`)
		result.WriteString(processedContent)
		result.WriteString(`</div>`)
	} else {
		// Show placeholder if no content found
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">Terms and conditions content was referenced but not found in the form data.</p>`)
		result.WriteString(`<p style="font-size: 11px; color: #999;">Fields checked: ` + strings.Join(metadata.ElementNames, ", ") + `</p>`)
		result.WriteString(`</div>`)
	}
	
	// Add acceptance confirmation section
	result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-left: 4px solid #4CAF50;">`)
	result.WriteString(`<h4 style="color: #2E7D32;">Terms Acceptance Status</h4>`)
	
	// Check for acceptance indicators
	hasAcceptance := false
	for _, elementName := range metadata.ElementNames {
		if value, exists := context.Answers[elementName]; exists {
			// Look for boolean acceptance
			if accepted, ok := value.(bool); ok && accepted {
				hasAcceptance = true
				result.WriteString(`<p><strong>✅ Accepted:</strong> ` + html.EscapeString(formatFieldLabel(elementName, "")) + `</p>`)
			}
			// Look for string acceptance
			if strValue, ok := value.(string); ok {
				if strings.ToLower(strValue) == "true" || strings.ToLower(strValue) == "yes" || strValue == "1" {
					hasAcceptance = true
					result.WriteString(`<p><strong>✅ Accepted:</strong> ` + html.EscapeString(formatFieldLabel(elementName, "")) + `</p>`)
				}
			}
		}
	}
	
	if !hasAcceptance {
		result.WriteString(`<p><strong>⚠️ Status:</strong> No explicit acceptance recorded for these terms</p>`)
	}
	
	result.WriteString(`<p><strong>Review Date:</strong> ` + getCurrentTimestamp() + `</p>`)
	result.WriteString(`</div>`)
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func processTermsContent(content string) string {
	// Handle HTML content - if it contains HTML tags, preserve them
	if strings.Contains(content, "<") && strings.Contains(content, ">") {
		// This is HTML content - we need to be careful about XSS
		// For now, we'll allow basic formatting tags and escape the rest
		content = sanitizeHTML(content)
		return content
	}
	
	// This is plain text - convert line breaks and escape
	content = html.EscapeString(content)
	content = strings.ReplaceAll(content, "\n", "<br>")
	content = strings.ReplaceAll(content, "\r\n", "<br>")
	
	return `<div style="line-height: 1.6; font-size: 12px;">` + content + `</div>`
}

func sanitizeHTML(content string) string {
	// Basic HTML sanitization
	// TODO: In production, use a proper HTML sanitizer that allows specific tags
	// For now, we'll just escape everything to be safe
	return `<div style="line-height: 1.6; font-size: 12px;">` + html.EscapeString(content) + `</div>`
}