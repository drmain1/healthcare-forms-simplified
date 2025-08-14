package main

import (
	"fmt"
	"log"

	"github.com/gemini/forms-api/internal/services"
)

func main() {
	// Test Case 1: BodyDiagram2 (sensation diagram)
	fmt.Println("=== Test 1: BodyDiagram2 (Sensation) ===")
	
	formDef1 := map[string]interface{}{
		"pages": []interface{}{
			map[string]interface{}{
				"elements": []interface{}{
					map[string]interface{}{
						"type": "bodydiagram2",
						"name": "myBodyDiagram",
					},
				},
			},
		},
	}
	
	responseData1 := map[string]interface{}{
		"myBodyDiagram": []interface{}{
			map[string]interface{}{
				"id":        "sensation-1",
				"x":         45.2,
				"y":         32.1,
				"sensation": "numbness",
			},
		},
	}
	
	detector := services.NewPatternDetector()
	patterns1, err := detector.DetectPatterns(formDef1, responseData1)
	if err != nil {
		log.Fatal(err)
	}
	
	foundSensation := false
	for _, pattern := range patterns1 {
		fmt.Printf("  Found: %s for fields %v\n", pattern.PatternType, pattern.ElementNames)
		if pattern.PatternType == "sensation_areas_diagram" {
			foundSensation = true
		}
	}
	
	if foundSensation {
		fmt.Println("✅ BodyDiagram2 (sensation) detected correctly!")
	} else {
		fmt.Println("❌ BodyDiagram2 (sensation) NOT detected")
	}
	
	// Test Case 2: BodyPainDiagram (pain intensity)
	fmt.Println("\n=== Test 2: BodyPainDiagram (Pain Intensity) ===")
	
	formDef2 := map[string]interface{}{
		"pages": []interface{}{
			map[string]interface{}{
				"elements": []interface{}{
					map[string]interface{}{
						"type": "bodypaindiagram",
						"name": "pain_areas",
					},
				},
			},
		},
	}
	
	responseData2 := map[string]interface{}{
		"pain_areas": []interface{}{
			map[string]interface{}{
				"id":        "pain-1",
				"x":         45.2,
				"y":         32.1,
				"intensity": "moderate",
			},
		},
	}
	
	patterns2, err := detector.DetectPatterns(formDef2, responseData2)
	if err != nil {
		log.Fatal(err)
	}
	
	foundPain := false
	for _, pattern := range patterns2 {
		fmt.Printf("  Found: %s for fields %v\n", pattern.PatternType, pattern.ElementNames)
		if pattern.PatternType == "body_pain_diagram_2" {
			foundPain = true
		}
	}
	
	if foundPain {
		fmt.Println("✅ BodyPainDiagram (pain intensity) detected correctly!")
	} else {
		fmt.Println("❌ BodyPainDiagram (pain intensity) NOT detected")
	}
	
	// Test Case 3: Both in same form
	fmt.Println("\n=== Test 3: Both Diagrams Together ===")
	
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
						"name": "sensationDiagram",
					},
				},
			},
		},
	}
	
	responseData3 := map[string]interface{}{
		"pain_areas": []interface{}{
			map[string]interface{}{
				"id":        "pain-1",
				"x":         45.2,
				"y":         32.1,
				"intensity": "severe",
			},
		},
		"sensationDiagram": []interface{}{
			map[string]interface{}{
				"id":        "sensation-1",
				"x":         30.1,
				"y":         40.2,
				"sensation": "burning",
			},
		},
	}
	
	patterns3, err := detector.DetectPatterns(formDef3, responseData3)
	if err != nil {
		log.Fatal(err)
	}
	
	foundSensation = false
	foundPain = false
	
	for _, pattern := range patterns3 {
		fmt.Printf("  Found: %s for fields %v\n", pattern.PatternType, pattern.ElementNames)
		if pattern.PatternType == "sensation_areas_diagram" {
			foundSensation = true
		}
		if pattern.PatternType == "body_pain_diagram_2" {
			foundPain = true
		}
	}
	
	fmt.Println("\nResults:")
	if foundPain {
		fmt.Println("✅ Pain diagram detected")
	} else {
		fmt.Println("❌ Pain diagram NOT detected")
	}
	
	if foundSensation {
		fmt.Println("✅ Sensation diagram detected")
	} else {
		fmt.Println("❌ Sensation diagram NOT detected")
	}
}