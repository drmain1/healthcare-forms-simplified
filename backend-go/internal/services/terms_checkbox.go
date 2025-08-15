package services

import (
	"bytes"
	"html"
	"strings"
	"time"
)

// TermsCheckboxRenderer renders checkbox-based terms agreements
func TermsCheckboxRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Terms and Agreement Confirmation</div>`)
	
	// Start the table
	result.WriteString(`<table class="data-table">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Agreement Item</th>`)
	result.WriteString(`<th>Status</th>`)
	result.WriteString(`<th>Agreed</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	for _, elementName := range metadata.ElementNames {
		// Get checkbox value
		checked := false
		if val, exists := context.Answers[elementName]; exists {
			switch v := val.(type) {
			case bool:
				checked = v
			case string:
				checked = (v == "true" || v == "yes" || v == "1")
			case []interface{}:
				// Checkbox can also be an array
				checked = len(v) > 0
			}
		}
		
		// Get label from template data or generate from field name
		label := elementName
		if metadata.TemplateData != nil {
			if labelVal, exists := metadata.TemplateData["label"]; exists {
				if labelStr, ok := labelVal.(string); ok {
					label = labelStr
				}
			}
		}
		
		// Sanitize label
		label = html.EscapeString(label)
		
		status := "❌ Not Agreed"
		statusClass := "color: #D8000C;"
		if checked {
			status = "✅ Agreed"
			statusClass = "color: #4F8A10;"
		}
		
		result.WriteString(`<tr>`)
		result.WriteString(`<td>` + formatFieldLabel(elementName, label) + `</td>`)
		result.WriteString(`<td style="` + statusClass + `">` + status + `</td>`)
		result.WriteString(`<td style="text-align: center;">`)
		
		if checked {
			result.WriteString(`<span style="color: #4F8A10; font-weight: bold;">Yes</span>`)
		} else {
			result.WriteString(`<span style="color: #D8000C; font-weight: bold;">No</span>`)
		}
		
		result.WriteString(`</td>`)
		result.WriteString(`</tr>`)
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	// Add timestamp
	result.WriteString(`<div style="margin-top: 15px; font-size: 11px; color: #666;">`)
	result.WriteString(`<p><strong>Confirmation recorded:</strong> ` + getCurrentTimestamp() + `</p>`)
	result.WriteString(`</div>`)
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func formatFieldLabel(fieldName, label string) string {
	if label == fieldName {
		// Convert field name to human readable
		label = strings.Title(strings.ReplaceAll(fieldName, "_", " "))
	}
	return html.EscapeString(label)
}

func getCurrentTimestamp() string {
	return time.Now().Format("January 2, 2006 at 3:04 PM MST")
}