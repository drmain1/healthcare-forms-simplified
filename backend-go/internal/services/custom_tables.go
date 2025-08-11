package services

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"strings"
)

// PainAreaData holds the structured data for a single row in the pain assessment table.
// This structure is what the HTML template will receive.
type PainAreaData struct {
	Area            string
	Side            string // For extremities: "LT", "RT", or "LT RT"
	Severity        interface{}
	Frequency       interface{}
	FrequencyText   string // Human-readable frequency description
	FrequencyValue  float64 // Numeric frequency value for positioning
}

// RenderCustomTable acts as a router for different custom table types.
// It looks at the element's name and calls the appropriate rendering function.
func RenderCustomTable(element Element, answers map[string]interface{}) (template.HTML, error) {
	// The `name` of the element (e.g., "pain_assessment_panel") determines which transformer to use.
	switch element.Name {
	case "pain_assessment_panel":
		return renderPainAssessmentTable(element, answers)
	default:
		log.Printf("Warning: Unknown custom table type encountered: %s", element.Name)
		return "", fmt.Errorf("unknown custom table type: %s", element.Name)
	}
}

// renderPainAssessmentTable handles the specific logic for the pain assessment table.
func renderPainAssessmentTable(element Element, answers map[string]interface{}) (template.HTML, error) {
	// 1. Transform the raw answers into a structured format.
	painData, err := transformPainData(element.Elements, answers)
	if err != nil {
		return "", err
	}

	// 2. Read the HTML template file.
	// Use a relative path from the executable location
	templatePath := "templates/pain_assessment_table.html"
	templateBytes, err := ioutil.ReadFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to read pain assessment template: %w", err)
	}

	// 3. Parse the template.
	tmpl, err := template.New("pain_assessment").Parse(string(templateBytes))
	if err != nil {
		return "", fmt.Errorf("failed to parse pain assessment template: %w", err)
	}

	// 4. Execute the template with the structured data.
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, painData); err != nil {
		return "", fmt.Errorf("failed to execute pain assessment template: %w", err)
	}

	return template.HTML(buf.String()), nil
}

// transformPainData converts the flat map of answers into a structured slice of PainAreaData.
func transformPainData(elements []Element, answers map[string]interface{}) ([]PainAreaData, error) {
	var allPainData []PainAreaData

	// Iterate through the panels for each body area (e.g., neck_panel, shoulder_panel).
	for _, areaPanel := range elements {
		if areaPanel.Type != "panel" || len(areaPanel.Elements) == 0 {
			continue
		}

		// Skip the other_area_panel if no area was specified
		if areaPanel.Name == "other_area_panel" {
			if otherArea, ok := answers["other_area_specify"].(string); ok && otherArea != "" {
				// Check if "Yes" was selected for other area pain (we check intensity directly)
				if intensity, ok := answers["other_intensity"]; ok {
					data := PainAreaData{Area: otherArea}
					
					// Check for side selection for other area
					if sides, ok := answers["other_side"]; ok {
						data.Side = formatSides(sides)
					}
					
					data.Severity = intensity
					if freq, ok := answers["other_frequency"]; ok {
						data.Frequency = freq
						data.FrequencyText = convertFrequencyToText(freq)
						data.FrequencyValue = getFrequencyNumericValue(freq)
					}
					// Check if pain is present (intensity > 0)
					if fVal, isFloat := intensity.(float64); isFloat && fVal > 0 {
						allPainData = append(allPainData, data)
					} else if iVal, isInt := intensity.(int); isInt && iVal > 0 {
						allPainData = append(allPainData, data)
					}
				}
			}
			continue
		}

		// Extract the base name of the panel (e.g., "neck" from "neck_panel")
		baseName := strings.TrimSuffix(areaPanel.Name, "_panel")
		
		// Build the field names based on the naming pattern
		hasPainField := "has_" + baseName + "_pain"
		intensityField := baseName + "_intensity"
		frequencyField := baseName + "_frequency"
		
		// Special cases for naming inconsistencies
		if baseName == "headaches" {
			hasPainField = "has_headaches"
			intensityField = "headaches_intensity"
			frequencyField = "headaches_frequency"
		} else if baseName == "neck" {
			// Neck has different naming pattern with "_pain" in the middle
			intensityField = "neck_pain_intensity"
			frequencyField = "neck_pain_frequency"
		}

		// Check if "Yes" was selected for this pain area
		if hasPainAnswer, ok := answers[hasPainField]; ok {
			if hasPainAnswer == "Yes" {
				// Get the area name from the first element (radiogroup) title
				areaName := ""
				for _, elem := range areaPanel.Elements {
					if elem.Type == "radiogroup" && elem.Name == hasPainField {
						areaName = elem.Title
						break
					}
				}
				
				if areaName == "" {
					continue
				}
				
				data := PainAreaData{Area: areaName}
				
				// Check for side selection (for extremities)
				sideField := baseName + "_side"
				if sides, ok := answers[sideField]; ok {
					data.Side = formatSides(sides)
				}
				
				// Get intensity value
				if intensity, ok := answers[intensityField]; ok {
					data.Severity = intensity
				}
				
				// Get frequency value and convert to human-readable text
				if frequency, ok := answers[frequencyField]; ok {
					data.Frequency = frequency
					data.FrequencyText = convertFrequencyToText(frequency)
					data.FrequencyValue = getFrequencyNumericValue(frequency)
				}
				
				allPainData = append(allPainData, data)
			}
		}
	}

	return allPainData, nil
}

// formatSides formats the side selection for display
func formatSides(sides interface{}) string {
	switch v := sides.(type) {
	case []interface{}:
		// Handle array of selections
		var sideList []string
		for _, s := range v {
			if str, ok := s.(string); ok {
				if str == "Left" {
					sideList = append(sideList, "LT")
				} else if str == "Right" {
					sideList = append(sideList, "RT")
				}
			}
		}
		if len(sideList) == 2 {
			return "LT RT"
		} else if len(sideList) == 1 {
			return sideList[0]
		}
	case string:
		// Handle single selection
		if v == "Left" {
			return "LT"
		} else if v == "Right" {
			return "RT"
		}
	}
	return ""
}

// getFrequencyNumericValue returns the numeric percentage value
func getFrequencyNumericValue(frequency interface{}) float64 {
	switch v := frequency.(type) {
	case float64:
		// Handle old 0-3 scale - convert to percentage
		if v <= 3 {
			return v * 33.33 // Map 0-3 to 0-100%
		}
		// Already a percentage
		return v
	case int:
		return getFrequencyNumericValue(float64(v))
	default:
		return 0
	}
}

// convertFrequencyToText converts frequency values to human-readable descriptions
func convertFrequencyToText(frequency interface{}) string {
	switch v := frequency.(type) {
	case float64:
		// Handle old 0-3 scale
		if v <= 3 {
			switch int(v) {
			case 0:
				return "Occasional (0-25%)"
			case 1:
				return "Intermittent (25-50%)"
			case 2:
				return "Frequent (50-75%)"
			case 3:
				return "Constant (75-100%)"
			default:
				return fmt.Sprintf("%.0f", v)
			}
		}
		// Handle percentage values (0-100)
		if v <= 100 {
			if v < 10 {
				return "Rarely"
			} else if v <= 25 {
				return "Occasional"
			} else if v <= 50 {
				return "Intermittent"
			} else if v <= 75 {
				return "Frequent"
			} else {
				return "Constant"
			}
		}
		return fmt.Sprintf("%.0f%%", v)
	case int:
		// Handle integer values
		return convertFrequencyToText(float64(v))
	case string:
		// If it's already a string description, return as-is
		return v
	default:
		return "-"
	}
}