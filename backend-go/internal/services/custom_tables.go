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
	Area      string
	Severity  interface{}
	Frequency interface{}
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
					data.Severity = intensity
					if freq, ok := answers["other_frequency"]; ok {
						data.Frequency = freq
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
		
		// Special case for headaches (doesn't follow the _pain pattern)
		if baseName == "headaches" {
			hasPainField = "has_headaches"
			intensityField = "headaches_intensity"
			frequencyField = "headaches_frequency"
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
				
				// Get intensity value
				if intensity, ok := answers[intensityField]; ok {
					data.Severity = intensity
				}
				
				// Get frequency value
				if frequency, ok := answers[frequencyField]; ok {
					data.Frequency = frequency
				}
				
				allPainData = append(allPainData, data)
			}
		}
	}

	return allPainData, nil
}