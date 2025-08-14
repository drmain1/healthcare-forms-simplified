package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
	"time"
)

// PainAreaData holds the structured data for a single row in the pain assessment table
// Reusing the existing structure from custom_tables.go
type PainAreaData struct {
	Area           string
	Side           string // For extremities: "LT", "RT", or "LT RT"
	Severity       interface{}
	Frequency      interface{}
	FrequencyText  string  // Human-readable frequency description
	FrequencyValue float64 // Numeric frequency value for positioning
}

// PainAssessmentRenderer renders comprehensive pain assessment data
func PainAssessmentRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Pain Assessment</div>`)
	
	// Extract pain assessment data
	painData, err := extractPainAssessmentData(metadata.ElementNames, context.Answers)
	if err != nil {
		return "", fmt.Errorf("failed to extract pain assessment data: %w", err)
	}
	
	if len(painData) == 0 {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No pain assessment data found</p>`)
		result.WriteString(`<p style="font-size: 11px; color: #999;">Fields checked: ` + strings.Join(metadata.ElementNames, ", ") + `</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render the pain assessment table
		result.WriteString(renderPainAssessmentTable(painData))
		
		// Add summary
		result.WriteString(renderPainSummary(painData))
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func extractPainAssessmentData(elementNames []string, answers map[string]interface{}) ([]PainAreaData, error) {
	var painAreas []PainAreaData
	
	// Process each pain-related element
	for _, elementName := range elementNames {
		if data, exists := answers[elementName]; exists && data != nil {
			// Try to process as structured pain data first
			if painArea := processStructuredPainElement(elementName, data); painArea != nil {
				painAreas = append(painAreas, *painArea)
				continue
			}
			
			// Fall back to simple pain data processing
			if painArea := processSimplePainElement(elementName, data); painArea != nil {
				painAreas = append(painAreas, *painArea)
			}
		}
	}
	
	return painAreas, nil
}

func processStructuredPainElement(elementName string, data interface{}) *PainAreaData {
	// Handle structured pain data (like from complex forms)
	if painMap, ok := data.(map[string]interface{}); ok {
		painArea := &PainAreaData{
			Area: extractArea(elementName, painMap),
			Side: extractSide(painMap),
		}
		
		// Extract severity
		if severity, exists := painMap["severity"]; exists {
			painArea.Severity = severity
		}
		
		// Extract frequency
		if frequency, exists := painMap["frequency"]; exists {
			painArea.Frequency = frequency
			painArea.FrequencyText = formatFrequency(frequency)
			painArea.FrequencyValue = parseFrequencyValue(frequency)
		}
		
		return painArea
	}
	
	return nil
}

func processSimplePainElement(elementName string, data interface{}) *PainAreaData {
	// Handle simple pain data (just severity values, etc.)
	painArea := &PainAreaData{
		Area:     extractAreaFromName(elementName),
		Side:     extractSideFromName(elementName),
		Severity: data,
	}
	
	// If this is a numeric severity, format it properly
	if severity, ok := data.(float64); ok {
		if severity >= 0 && severity <= 10 {
			painArea.Severity = fmt.Sprintf("%.0f/10", severity)
		}
	}
	
	return painArea
}

func extractArea(elementName string, painMap map[string]interface{}) string {
	// Try to get area from the data
	if area, exists := painMap["area"]; exists {
		if areaStr, ok := area.(string); ok {
			return areaStr
		}
	}
	
	// Fall back to extracting from element name
	return extractAreaFromName(elementName)
}

func extractAreaFromName(elementName string) string {
	// Extract body area from field name
	lowerName := strings.ToLower(elementName)
	
	// Common body areas
	areaMap := map[string]string{
		"neck":     "Neck",
		"shoulder": "Shoulder",
		"back":     "Back",
		"lower_back": "Lower Back",
		"upper_back": "Upper Back",
		"arm":      "Arm",
		"elbow":    "Elbow",
		"wrist":    "Wrist",
		"hand":     "Hand",
		"hip":      "Hip",
		"knee":     "Knee",
		"ankle":    "Ankle",
		"foot":     "Foot",
		"leg":      "Leg",
		"chest":    "Chest",
		"abdomen":  "Abdomen",
		"head":     "Head",
	}
	
	for key, area := range areaMap {
		if strings.Contains(lowerName, key) {
			return area
		}
	}
	
	// Default to formatted field name
	return formatFieldLabel(elementName, "")
}

func extractSide(painMap map[string]interface{}) string {
	if side, exists := painMap["side"]; exists {
		if sideStr, ok := side.(string); ok {
			return normalizeSide(sideStr)
		}
	}
	return ""
}

func extractSideFromName(elementName string) string {
	lowerName := strings.ToLower(elementName)
	
	if strings.Contains(lowerName, "left") || strings.Contains(lowerName, "_l_") || strings.Contains(lowerName, "_lt") {
		return "LT"
	}
	if strings.Contains(lowerName, "right") || strings.Contains(lowerName, "_r_") || strings.Contains(lowerName, "_rt") {
		return "RT"
	}
	
	return ""
}

func normalizeSide(side string) string {
	lowerSide := strings.ToLower(side)
	switch lowerSide {
	case "left", "l":
		return "LT"
	case "right", "r":
		return "RT"
	case "both", "bilateral":
		return "LT RT"
	default:
		return strings.ToUpper(side)
	}
}

func formatFrequency(frequency interface{}) string {
	if freqStr, ok := frequency.(string); ok {
		return freqStr
	}
	if freqFloat, ok := frequency.(float64); ok {
		// Convert numeric frequency to text
		switch {
		case freqFloat >= 0 && freqFloat < 1:
			return "Rarely"
		case freqFloat >= 1 && freqFloat < 3:
			return "Sometimes"
		case freqFloat >= 3 && freqFloat < 5:
			return "Often"
		case freqFloat >= 5:
			return "Constantly"
		}
	}
	return fmt.Sprintf("%v", frequency)
}

func parseFrequencyValue(frequency interface{}) float64 {
	if freqFloat, ok := frequency.(float64); ok {
		return freqFloat
	}
	if freqStr, ok := frequency.(string); ok {
		// Convert text to numeric value for sorting/analysis
		switch strings.ToLower(freqStr) {
		case "never", "rarely":
			return 0.5
		case "sometimes", "occasionally":
			return 2.0
		case "often", "frequently":
			return 4.0
		case "always", "constantly":
			return 5.0
		}
	}
	return 0
}

func renderPainAssessmentTable(painData []PainAreaData) string {
	var result bytes.Buffer
	
	result.WriteString(`<table class="data-table">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Body Area</th>`)
	result.WriteString(`<th>Side</th>`)
	result.WriteString(`<th>Severity</th>`)
	result.WriteString(`<th>Frequency</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	for _, pain := range painData {
		result.WriteString(`<tr>`)
		result.WriteString(`<td>` + html.EscapeString(pain.Area) + `</td>`)
		result.WriteString(`<td>` + html.EscapeString(pain.Side) + `</td>`)
		result.WriteString(`<td>` + formatSeverity(pain.Severity) + `</td>`)
		result.WriteString(`<td>` + html.EscapeString(pain.FrequencyText) + `</td>`)
		result.WriteString(`</tr>`)
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	return result.String()
}

func formatSeverity(severity interface{}) string {
	if severity == nil {
		return "-"
	}
	
	severityStr := fmt.Sprintf("%v", severity)
	
	// If it's already formatted, return as is
	if strings.Contains(severityStr, "/10") {
		return html.EscapeString(severityStr)
	}
	
	// Try to parse as number and format
	if sevFloat, ok := severity.(float64); ok {
		if sevFloat >= 0 && sevFloat <= 10 {
			return fmt.Sprintf("%.0f/10", sevFloat)
		}
	}
	
	return html.EscapeString(severityStr)
}

func renderPainSummary(painData []PainAreaData) string {
	var result bytes.Buffer
	
	result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">`)
	result.WriteString(`<h4>Pain Assessment Summary</h4>`)
	
	// Count areas by severity
	severityCount := make(map[string]int)
	totalAreas := len(painData)
	
	for _, pain := range painData {
		if severityStr := fmt.Sprintf("%v", pain.Severity); severityStr != "" {
			severityCount[severityStr]++
		}
	}
	
	result.WriteString(`<p><strong>Total Pain Areas:</strong> ` + fmt.Sprintf("%d", totalAreas) + `</p>`)
	
	if len(severityCount) > 0 {
		result.WriteString(`<p><strong>Severity Distribution:</strong></p>`)
		result.WriteString(`<ul>`)
		for severity, count := range severityCount {
			result.WriteString(`<li>` + html.EscapeString(severity) + `: ` + fmt.Sprintf("%d areas", count) + `</li>`)
		}
		result.WriteString(`</ul>`)
	}
	
	result.WriteString(`<p><strong>Assessment Date:</strong> ` + getCurrentTimestamp() + `</p>`)
	result.WriteString(`</div>`)
	
	return result.String()
}