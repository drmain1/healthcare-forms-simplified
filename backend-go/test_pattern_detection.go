package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gemini/forms-api/internal/services"
)

func main() {
	// Test data simulating a form response with both pain_areas and sensation_areas
	responseData := map[string]interface{}{
		"pain_areas": []interface{}{
			map[string]interface{}{
				"id":        "pain-1",
				"x":         45.2,
				"y":         32.1,
				"intensity": "moderate",
			},
			map[string]interface{}{
				"id":        "pain-2",
				"x":         60.5,
				"y":         50.3,
				"intensity": "severe",
			},
		},
		"sensation_areas": []interface{}{
			map[string]interface{}{
				"id":        "sensation-1",
				"x":         30.1,
				"y":         40.2,
				"sensation": "numbness",
			},
		},
		"patient_name": "Test Patient",
		"date_of_birth": "1990-01-01",
	}

	// Create pattern detector
	detector := services.NewPatternDetector()
	
	// Empty form definition for testing
	formDef := map[string]interface{}{}
	
	// Detect patterns
	patterns, err := detector.DetectPatterns(formDef, responseData)
	if err != nil {
		log.Fatal(err)
	}
	
	fmt.Println("Detected Patterns:")
	fmt.Println("==================")
	for _, pattern := range patterns {
		fmt.Printf("Pattern Type: %s\n", pattern.PatternType)
		fmt.Printf("Elements: %v\n", pattern.ElementNames)
		
		// Pretty print template data
		templateJSON, _ := json.MarshalIndent(pattern.TemplateData, "  ", "  ")
		fmt.Printf("Template Data: %s\n", string(templateJSON))
		fmt.Println("---")
	}
	
	// Check if the correct patterns were detected
	foundPainDiagram := false
	foundSensationDiagram := false
	foundPainAssessment := false
	
	for _, pattern := range patterns {
		switch pattern.PatternType {
		case "body_pain_diagram_2":
			foundPainDiagram = true
			fmt.Println("✅ Found Body Pain Diagram pattern")
		case "sensation_areas_diagram":
			foundSensationDiagram = true
			fmt.Println("✅ Found Sensation Areas Diagram pattern")
		case "pain_assessment":
			foundPainAssessment = true
			fmt.Println("❌ Found Pain Assessment pattern (should not match)")
		}
	}
	
	if !foundPainDiagram {
		fmt.Println("❌ Body Pain Diagram pattern NOT detected")
	}
	if !foundSensationDiagram {
		fmt.Println("❌ Sensation Areas Diagram pattern NOT detected")
	}
	if foundPainAssessment {
		fmt.Println("⚠️ Pain Assessment pattern incorrectly matched (should be excluded)")
	}
}