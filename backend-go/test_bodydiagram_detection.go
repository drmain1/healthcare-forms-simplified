package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gemini/forms-api/internal/services"
)

func main() {
	// Test Case 1: BodyDiagram2 (sensation diagram) with typical field name
	fmt.Println("=== Test Case 1: BodyDiagram2 with various field names ===")
	testData1 := map[string]interface{}{
		// Using different possible field names
		"bodyDiagram2": []interface{}{ // Common camelCase name
			map[string]interface{}{
				"id":        "sensation-1",
				"x":         45.2,
				"y":         32.1,
				"sensation": "numbness", // Key indicator: has "sensation" field
			},
		},
		"body_diagram_2": []interface{}{ // Snake case variant
			map[string]interface{}{
				"id":        "sensation-2",
				"x":         60.5,
				"y":         50.3,
				"sensation": "burning",
			},
		},
		"sensationDiagram": []interface{}{ // Descriptive name
			map[string]interface{}{
				"id":        "sensation-3",
				"x":         30.1,
				"y":         40.2,
				"sensation": "pins_and_needles",
			},
		},
	}
	
	// Form definition showing type
	formDef1 := map[string]interface{}{
		"pages": []interface{}{
			map[string]interface{}{
				"elements": []interface{}{
					map[string]interface{}{
						"type": "bodydiagram2",
						"name": "bodyDiagram2",
					},
					map[string]interface{}{
						"type": "bodydiagram2",
						"name": "body_diagram_2",
					},
					map[string]interface{}{
						"type": "bodydiagram2",
						"name": "sensationDiagram",
					},
				},
			},
		},
	}
	
	detector := services.NewPatternDetector()
	patterns1, _ := detector.DetectPatterns(formDef1, testData1)
	
	fmt.Println("Detected patterns for sensation diagrams:")
	for _, pattern := range patterns1 {
		fmt.Printf("  - %s: %v\n", pattern.PatternType, pattern.ElementNames)
	}
	
	// Test Case 2: Pain diagram with intensity field
	fmt.Println("\n=== Test Case 2: Pain Diagram (with intensity) ===")
	testData2 := map[string]interface{}{
		"pain_areas": []interface{}{
			map[string]interface{}{
				"id":        "pain-1",
				"x":         45.2,
				"y":         32.1,
				"intensity": "moderate", // Key indicator: has "intensity" field
			},
		},
		"bodyPainDiagram": []interface{}{
			map[string]interface{}{
				"id":        "pain-2",
				"x":         60.5,
				"y":         50.3,
				"intensity": "severe",
			},
		},
	}
	
	formDef2 := map[string]interface{}{
		"pages": []interface{}{
			map[string]interface{}{
				"elements": []interface{}{
					map[string]interface{}{
						"type": "bodypaindiagram",
						"name": "pain_areas",
					},
					map[string]interface{}{
						"type": "bodypaindiagram",
						"name": "bodyPainDiagram",
					},
				},
			},
		},
	}
	
	patterns2, _ := detector.DetectPatterns(formDef2, testData2)
	
	fmt.Println("Detected patterns for pain diagrams:")
	for _, pattern := range patterns2 {
		fmt.Printf("  - %s: %v\n", pattern.PatternType, pattern.ElementNames)
	}
	
	// Test Case 3: Mixed data to ensure proper differentiation
	fmt.Println("\n=== Test Case 3: Mixed Data (both types) ===")
	testData3 := map[string]interface{}{
		"pain_areas": []interface{}{
			map[string]interface{}{
				"id":        "pain-1",
				"x":         45.2,
				"y":         32.1,
				"intensity": "moderate",
			},
		},
		"bodyDiagram2": []interface{}{
			map[string]interface{}{
				"id":        "sensation-1",
				"x":         30.1,
				"y":         40.2,
				"sensation": "numbness",
			},
		},
	}
	
	formDef3 := map[string]interface{}{
		"pages": []interface{}{
			map[string]interface{}{
				"elements": []interface{}{
					map[string]interface{}{
						"type": "bodypaindiagram",
						"name": "pain_areas",
					},
					map[string]interface{}{
						"type": "bodydiagram2",
						"name": "bodyDiagram2",
					},
				},
			},
		},
	}
	
	patterns3, _ := detector.DetectPatterns(formDef3, testData3)
	
	fmt.Println("Detected patterns for mixed data:")
	foundSensation := false
	foundPain := false
	
	for _, pattern := range patterns3 {
		fmt.Printf("  - %s: %v\n", pattern.PatternType, pattern.ElementNames)
		if pattern.PatternType == "sensation_areas_diagram" {
			foundSensation = true
		}
		if pattern.PatternType == "body_pain_diagram_2" {
			foundPain = true
		}
	}
	
	fmt.Println("\nValidation:")
	if foundPain {
		fmt.Println("✅ Pain diagram detected correctly")
	} else {
		fmt.Println("❌ Pain diagram NOT detected")
	}
	
	if foundSensation {
		fmt.Println("✅ Sensation diagram detected correctly")
	} else {
		fmt.Println("❌ Sensation diagram NOT detected")
	}
	
	// Print the key insight
	fmt.Println("\n=== Key Insight ===")
	fmt.Println("The differentiator between the two diagram types is:")
	fmt.Println("1. Pain Diagram: Has 'intensity' field (mild/moderate/severe)")
	fmt.Println("2. Sensation Diagram: Has 'sensation' field (numbness/burning/etc)")
	fmt.Println("\nThe field name can vary, but the data structure is consistent!")
}