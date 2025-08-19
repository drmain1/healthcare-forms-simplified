package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
)

// TermsConditionsRenderer renders full terms and conditions text from panels
func TermsConditionsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title" style="font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Terms and Agreement Confirmation</div>`)
	
	// Get panels from metadata
	panels, ok := metadata.TemplateData["panels"].([]map[string]interface{})
	if !ok || len(panels) == 0 {
		// Fallback message if no panels found
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No terms and conditions content found in the form.</p>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
		return result.String(), nil
	}
	
	// Get answers from context
	answers := context.Answers
	if answersFromMeta, ok := metadata.TemplateData["answers"].(map[string]interface{}); ok {
		answers = answersFromMeta
	}
	
	// Process each panel
	for i, panel := range panels {
		title, _ := panel["title"].(string)
		_ = panel["name"] // Keep for potential future use
		
		// Add spacing between sections (except for the first one)
		if i > 0 {
			result.WriteString(`<div style="margin: 30px 0; border-top: 1px solid #dee2e6;"></div>`)
		}
		
		// Section container
		result.WriteString(`<div style="margin-bottom: 25px;">`)
		
		// Section title
		result.WriteString(fmt.Sprintf(`<h3 style="color: #1976d2; font-size: 16px; font-weight: bold; margin-bottom: 15px;">%s</h3>`, html.EscapeString(title)))
		
		// Extract and display HTML content from panel elements
		if elements, ok := panel["elements"].([]interface{}); ok {
			for _, elem := range elements {
				if element, ok := elem.(map[string]interface{}); ok {
					elementType, _ := element["type"].(string)
					elementName, _ := element["name"].(string)
					
					// Display HTML content
					if elementType == "html" {
						if htmlContent, ok := element["html"].(string); ok && htmlContent != "" {
							// Process and display the HTML content
							result.WriteString(`<div style="background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 10px 0; border-radius: 4px;">`)
							result.WriteString(processTermsHTML(htmlContent))
							result.WriteString(`</div>`)
						}
					}
					
					// Check for acknowledgement/acceptance checkbox
					if elementType == "checkbox" && (strings.Contains(strings.ToLower(elementName), "acknowledgement") || 
						strings.Contains(strings.ToLower(elementName), "accept") || 
						strings.Contains(strings.ToLower(elementName), "terms")) {
						result.WriteString(renderAcknowledgementStatus(element, elementName, answers))
					}
					
					// Check for signature
					if elementType == "signaturepad" {
						result.WriteString(renderSignatureStatus(element, elementName, answers))
					}
					
					// Check for date fields
					if elementType == "text" && strings.Contains(strings.ToLower(elementName), "date") {
						if dateValue, exists := answers[elementName]; exists {
							if dateStr, ok := dateValue.(string); ok && dateStr != "" {
								result.WriteString(fmt.Sprintf(`<p style="margin: 5px 0;"><strong>Date:</strong> %s</p>`, html.EscapeString(dateStr)))
							}
						}
					}
					
					// Check for printed name
					if elementType == "text" && strings.Contains(strings.ToLower(elementName), "printed_name") {
						if nameValue, exists := answers[elementName]; exists {
							if nameStr, ok := nameValue.(string); ok && nameStr != "" {
								result.WriteString(fmt.Sprintf(`<p style="margin: 5px 0;"><strong>Printed Name:</strong> %s</p>`, html.EscapeString(nameStr)))
							}
						}
					}
				}
			}
		}
		
		result.WriteString(`</div>`) // End section container
	}
	
	// Add confirmation timestamp
	result.WriteString(`<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6; color: #6c757d; font-size: 12px;">`)
	result.WriteString(fmt.Sprintf(`<p><strong>Confirmation recorded:</strong> %s</p>`, getCurrentTimestamp()))
	result.WriteString(`</div>`)
	
	result.WriteString(`</div>`) // End form-section
	
	return result.String(), nil
}

func processTermsHTML(content string) string {
	// Remove the outer div with inline styles if present
	content = strings.ReplaceAll(content, `style='max-height: ; overflow-y: auto; border: 1px solid #ddd; padding: 10px; text-align: left;'`, "")
	content = strings.ReplaceAll(content, `style='max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; text-align: left;'`, "")
	content = strings.ReplaceAll(content, `style='text-align: left;'`, "")
	
	// Clean up the HTML but preserve structure
	content = strings.TrimSpace(content)
	
	// If it starts with a div, remove the outer div wrapper
	if strings.HasPrefix(content, "<div") {
		// Find the end of the opening div tag
		endIdx := strings.Index(content, ">")
		if endIdx != -1 {
			content = content[endIdx+1:]
			// Remove the closing div if present
			if strings.HasSuffix(content, "</div>") {
				content = content[:len(content)-6]
			}
		}
	}
	
	// Apply consistent styling to the content
	styledContent := `<div style="line-height: 1.6; font-size: 12px; color: #333;">`
	styledContent += content
	styledContent += `</div>`
	
	return styledContent
}

func renderAcknowledgementStatus(element map[string]interface{}, elementName string, answers map[string]interface{}) string {
	var result bytes.Buffer
	
	// Get the checkbox text from choices
	checkboxText := "Agreement"
	if choices, ok := element["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if text, ok := choice["text"].(string); ok {
				checkboxText = text
			}
		}
	}
	
	// Create a styled acknowledgement table
	result.WriteString(`<div style="margin-top: 15px;">`)
	result.WriteString(`<table style="width: 100%; border-collapse: collapse; background-color: #fff;">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr style="background-color: #e3f2fd;">`)
	result.WriteString(`<th style="padding: 10px; text-align: left; border: 1px solid #dee2e6; font-weight: bold;">Agreement Item</th>`)
	result.WriteString(`<th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: bold;">Status</th>`)
	result.WriteString(`<th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: bold;">Agreed</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	result.WriteString(`<tr>`)
	result.WriteString(fmt.Sprintf(`<td style="padding: 10px; border: 1px solid #dee2e6;">%s</td>`, html.EscapeString(checkboxText)))
	
	// Check if accepted
	accepted := false
	
	if value, exists := answers[elementName]; exists {
		// Check various forms of acceptance
		switch v := value.(type) {
		case []interface{}:
			if len(v) > 0 {
				if val, ok := v[0].(string); ok && val == "accepted" {
					accepted = true
				}
			}
		case string:
			if v == "accepted" || strings.ToLower(v) == "true" || strings.ToLower(v) == "yes" {
				accepted = true
			}
		case bool:
			if v {
				accepted = true
			}
		}
	}
	
	if accepted {
		result.WriteString(`<td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #4CAF50; font-weight: bold;">✅ Agreed</td>`)
		result.WriteString(`<td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #4CAF50; font-weight: bold;">Yes</td>`)
	} else {
		result.WriteString(`<td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #999;">Not Agreed</td>`)
		result.WriteString(`<td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #999;">No</td>`)
	}
	
	result.WriteString(`</tr>`)
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderSignatureStatus(element map[string]interface{}, elementName string, answers map[string]interface{}) string {
	var result bytes.Buffer
	
	title, _ := element["title"].(string)
	
	if value, exists := answers[elementName]; exists {
		if sigData, ok := value.(string); ok && sigData != "" && strings.HasPrefix(sigData, "data:image/") {
			// Render the actual signature image
			result.WriteString(`<div style="margin: 15px 0;">`)
			result.WriteString(fmt.Sprintf(`<p style="margin-bottom: 10px; font-weight: bold;">%s:</p>`, html.EscapeString(title)))
			result.WriteString(`<div style="position: relative; margin: 10px 0;">`)
			result.WriteString(`<img src="` + html.EscapeString(sigData) + `" alt="Signature" style="max-width: 250px; height: 60px; object-fit: contain; display: block;">`)
			result.WriteString(`<div style="border-bottom: 1px solid #000; margin-top: -5px; width: 300px;"></div>`)
			result.WriteString(`</div>`)
			result.WriteString(`</div>`)
		} else {
			result.WriteString(fmt.Sprintf(`<p style="margin: 10px 0;"><strong>%s:</strong> <span style="color: #999;">Not signed</span></p>`, html.EscapeString(title)))
		}
	} else {
		result.WriteString(fmt.Sprintf(`<p style="margin: 10px 0;"><strong>%s:</strong> <span style="color: #999;">Not signed</span></p>`, html.EscapeString(title)))
	}
	
	return result.String()
}

func sanitizeHTML(content string) string {
	// Basic HTML sanitization
	// In production, use a proper HTML sanitizer that allows specific tags
	// For now, we'll just escape everything to be safe
	return `<div style="line-height: 1.6; font-size: 12px;">` + html.EscapeString(content) + `</div>`
}

func processTermsContent(content string) string {
	// Handle HTML content - if it contains HTML tags, preserve them
	if strings.Contains(content, "<") && strings.Contains(content, ">") {
		// This is HTML content - process it
		return processTermsHTML(content)
	}
	
	// This is plain text - convert line breaks and escape
	content = html.EscapeString(content)
	content = strings.ReplaceAll(content, "\n", "<br>")
	content = strings.ReplaceAll(content, "\r\n", "<br>")
	
	return `<div style="line-height: 1.6; font-size: 12px;">` + content + `</div>`
}