package services

import (
	"fmt"
	"strings"
)

type PatternDetector struct {
	matchers []PatternMatcher
}

type PatternMatcher interface {
	Match(formDefinition, responseData map[string]interface{}) (bool, PatternMetadata)
	GetPatternType() string
	GetPriority() int
}

type PatternMetadata struct {
	PatternType   string
	ElementNames  []string
	TemplateData  map[string]interface{}
	Dependencies  []string
}

func NewPatternDetector() *PatternDetector {
	return &PatternDetector{
		matchers: []PatternMatcher{
			&TermsCheckboxMatcher{},
			&TermsConditionsMatcher{},
			&PatientDemographicsMatcher{},
			&AdditionalDemographicsMatcher{},
			&ReviewOfSystemsMatcher{},
			&NeckDisabilityMatcher{},
			&OswestryDisabilityMatcher{},
			&BodyDiagram2Matcher{},
			&BodyPainDiagram2Matcher{},
			&SensationAreasMatcher{},
			&PainAssessmentMatcher{},
			&PatientVitalsMatcher{},
			&InsuranceCardMatcher{},
			&SignatureMatcher{},
		},
	}
}

func (pd *PatternDetector) DetectPatterns(formDefinition, responseData map[string]interface{}) ([]PatternMetadata, error) {
	var patterns []PatternMetadata

	for _, matcher := range pd.matchers {
		if matched, metadata := matcher.Match(formDefinition, responseData); matched {
			patterns = append(patterns, metadata)
		}
	}

	return patterns, nil
}

// Helper function to extract elements from form definition
func extractElements(formDef map[string]interface{}) []map[string]interface{} {
	var elements []map[string]interface{}
	
	// Recursive helper to extract nested elements
	var extractNestedElements func(elemMap map[string]interface{})
	extractNestedElements = func(elemMap map[string]interface{}) {
		// Add the current element
		elements = append(elements, elemMap)
		
		// Check for nested elements (panels can contain elements)
		if nestedElements, ok := elemMap["elements"].([]interface{}); ok {
			for _, nested := range nestedElements {
				if nestedMap, ok := nested.(map[string]interface{}); ok {
					extractNestedElements(nestedMap)
				}
			}
		}
	}
	
	// Handle SurveyJS structure
	if pages, ok := formDef["pages"].([]interface{}); ok {
		for _, page := range pages {
			if pageMap, ok := page.(map[string]interface{}); ok {
				if pageElements, ok := pageMap["elements"].([]interface{}); ok {
					for _, elem := range pageElements {
						if elemMap, ok := elem.(map[string]interface{}); ok {
							extractNestedElements(elemMap)
						}
					}
				}
			}
		}
	}
	
	// Also check direct elements array
	if elementsArray, ok := formDef["elements"].([]interface{}); ok {
		for _, elem := range elementsArray {
			if elemMap, ok := elem.(map[string]interface{}); ok {
				extractNestedElements(elemMap)
			}
		}
	}
	
	return elements
}

// Helper functions
func filterResponseData(responseData map[string]interface{}, elementNames []string) map[string]interface{} {
	filtered := make(map[string]interface{})
	for _, name := range elementNames {
		if value, exists := responseData[name]; exists {
			filtered[name] = value
		}
	}
	return filtered
}

func getStringValue(data map[string]interface{}, key string) string {
	if value, ok := data[key]; ok {
		if str, ok := value.(string); ok {
			return str
		}
		return fmt.Sprintf("%v", value)
	}
	return ""
}

func GetFloat64(data map[string]interface{}, key string) float64 {
	if value, ok := data[key]; ok {
		switch v := value.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case string:
			// Try to parse string to float64
			if f, err := fmt.Sscanf(v, "%f"); err == nil && f == 1 {
				var result float64
				fmt.Sscanf(v, "%f", &result)
				return result
			}
		}
	}
	return 0
}

func GetInt(data map[string]interface{}, key string) int {
	if value, ok := data[key]; ok {
		switch v := value.(type) {
		case int:
			return v
		case float64:
			return int(v)
		case string:
			var result int
			if n, err := fmt.Sscanf(v, "%d", &result); err == nil && n == 1 {
				return result
			}
		}
	}
	return 0
}

func GetString(data map[string]interface{}, key string) string {
	if value, ok := data[key]; ok {
		if str, ok := value.(string); ok {
			return str
		}
		return fmt.Sprintf("%v", value)
	}
	return ""
}

// Concrete Pattern Matchers

// 1. Terms Checkbox Matcher
type TermsCheckboxMatcher struct{}

func (m *TermsCheckboxMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "checkbox" {
			if name, ok := element["name"].(string); ok {
				if strings.Contains(strings.ToLower(name), "terms") || 
				   strings.Contains(strings.ToLower(name), "agreement") ||
				   strings.Contains(strings.ToLower(name), "consent") {
					return true, PatternMetadata{
						PatternType:  "terms_checkbox",
						ElementNames: []string{name},
						TemplateData: map[string]interface{}{
							"checked": responseData[name],
							"label":   element["title"],
						},
					}
				}
			}
		}
	}
	return false, PatternMetadata{}
}

func (m *TermsCheckboxMatcher) GetPatternType() string { return "terms_checkbox" }
func (m *TermsCheckboxMatcher) GetPriority() int       { return 1 }

// 2. Terms & Conditions Matcher
type TermsConditionsMatcher struct{}

func (m *TermsConditionsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	var consentPanels []map[string]interface{}
	var termsFields []string
	
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "terms_and_conditions" {
					// Found terms and conditions via metadata
					consentPanels = append(consentPanels, element)
					
					// Extract field names from the panel elements
					if panelElements, ok := element["elements"].([]interface{}); ok {
						for _, el := range panelElements {
							if elem, ok := el.(map[string]interface{}); ok {
								if name, ok := elem["name"].(string); ok {
									// Add field names (skip HTML elements)
									if !strings.HasPrefix(name, "terms_header") && !strings.HasPrefix(name, "terms_content") {
										termsFields = append(termsFields, name)
									}
								}
							}
						}
					}
					
					// Also check response data for any terms-related fields
					for key := range responseData {
						if strings.Contains(key, "terms") || strings.Contains(key, "accept") || strings.Contains(key, "signature") {
							// Add if not already in list
							found := false
							for _, field := range termsFields {
								if field == key {
									found = true
									break
								}
							}
							if !found {
								termsFields = append(termsFields, key)
							}
						}
					}
				}
			}
		}
	}
	
	if len(consentPanels) > 0 {
		return true, PatternMetadata{
			PatternType:  "terms_conditions",
			ElementNames: termsFields,
			TemplateData: map[string]interface{}{
				"panels": consentPanels,
				"answers": responseData,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *TermsConditionsMatcher) GetPatternType() string { return "terms_conditions" }
func (m *TermsConditionsMatcher) GetPriority() int       { return 2 }

// 3. Patient Demographics Matcher
type PatientDemographicsMatcher struct{}

func (m *PatientDemographicsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	var demographicFields []string
	
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "patient_demographics" {
					// Found patient demographics via metadata
					if name, ok := element["name"].(string); ok {
						demographicFields = append(demographicFields, name)
					}
					// Also collect any nested fields if it's a panel
					if nestedElements, ok := element["elements"].([]interface{}); ok {
						for _, nested := range nestedElements {
							if nestedMap, ok := nested.(map[string]interface{}); ok {
								if nestedName, ok := nestedMap["name"].(string); ok {
									demographicFields = append(demographicFields, nestedName)
								}
							}
						}
					}
				}
			}
		}
	}
	
	if len(demographicFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "patient_demographics",
			ElementNames: demographicFields,
			TemplateData: map[string]interface{}{
				"fields": demographicFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *PatientDemographicsMatcher) GetPatternType() string { return "patient_demographics" }
func (m *PatientDemographicsMatcher) GetPriority() int       { return 3 }

// 4. Pain Assessment Matcher
type PainAssessmentMatcher struct{}

func (m *PainAssessmentMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Look for panel with specific title "Visual Analog Scale & Pain Assessment"
	elements := extractElements(formDef)
	
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "panel" {
			// Check for the specific title
			if title, ok := element["title"].(string); ok && 
			   title == "Visual Analog Scale & Pain Assessment" {
				
				// Found it! Get the panel name and structure
				panelName, _ := element["name"].(string)
				
				// Log for debugging
				fmt.Printf("DEBUG: Found pain assessment panel with title: %s, name: %s\n", title, panelName)
				
				return true, PatternMetadata{
					PatternType:  "pain_assessment",
					ElementNames: []string{panelName},
					TemplateData: map[string]interface{}{
						"panel": element,
						"answers": responseData,
					},
				}
			}
		}
	}
	
	return false, PatternMetadata{}
}

func (m *PainAssessmentMatcher) GetPatternType() string { return "pain_assessment" }
func (m *PainAssessmentMatcher) GetPriority() int       { return 6 }

// 5. Neck Disability Index Matcher
type NeckDisabilityMatcher struct{}

func (m *NeckDisabilityMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Look for panel with specific title "Neck Disability Index Questionnaire"
	elements := extractElements(formDef)
	
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "panel" {
			// Check for the specific title
			if title, ok := element["title"].(string); ok && 
			   title == "Neck Disability Index Questionnaire" {
				
				// Found the NDI panel - collect all question fields
				ndiQuestions := []string{}
				
				// Look for question3-12 in responseData 
				// question1 is name, question2 might be date
				// question3-12 are the actual NDI assessment questions
				for i := 3; i <= 12; i++ {
					fieldName := fmt.Sprintf("question%d", i)
					if _, exists := responseData[fieldName]; exists {
						ndiQuestions = append(ndiQuestions, fieldName)
					}
				}
				
				// Log for debugging
				fmt.Printf("DEBUG: Found NDI form with title: %s, detected %d questions\n", title, len(ndiQuestions))
				
				if len(ndiQuestions) > 0 {
					return true, PatternMetadata{
						PatternType:  "neck_disability_index",
						ElementNames: ndiQuestions,
						TemplateData: map[string]interface{}{
							"panel": element,
							"questions": ndiQuestions,
							"responses": filterResponseData(responseData, ndiQuestions),
						},
					}
				}
			}
		}
	}
	
	return false, PatternMetadata{}
}

func (m *NeckDisabilityMatcher) GetPatternType() string { return "neck_disability_index" }
func (m *NeckDisabilityMatcher) GetPriority() int       { return 4 }

// 6. Oswestry Disability Matcher
type OswestryDisabilityMatcher struct{}

func (m *OswestryDisabilityMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Look for panel with specific title "Oswestry Low Back Pain Disability Index"
	elements := extractElements(formDef)
	
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "panel" {
			// Check for the specific title
			if title, ok := element["title"].(string); ok && 
			   title == "Oswestry Low Back Pain Disability Index" {
				
				// Found the Oswestry panel - collect all question fields
				oswestryQuestions := []string{}
				
				// Look for question1-12 in responseData (question1 and question2 are name/date)
				// question3-12 are the actual ODI assessment questions
				// Skip question13+ as those might be signatures or other fields
				for i := 1; i <= 12; i++ {
					fieldName := fmt.Sprintf("question%d", i)
					if _, exists := responseData[fieldName]; exists {
						oswestryQuestions = append(oswestryQuestions, fieldName)
					}
				}
				
				// Log for debugging
				fmt.Printf("DEBUG: Found Oswestry form with title: %s, detected %d questions\n", title, len(oswestryQuestions))
				
				if len(oswestryQuestions) > 0 {
					return true, PatternMetadata{
						PatternType:  "oswestry_disability",
						ElementNames: oswestryQuestions,
						TemplateData: map[string]interface{}{
							"panel": element,
							"questions": oswestryQuestions,
							"responses": filterResponseData(responseData, oswestryQuestions),
						},
					}
				}
			}
		}
	}
	
	return false, PatternMetadata{}
}

func (m *OswestryDisabilityMatcher) GetPatternType() string { return "oswestry_disability" }
func (m *OswestryDisabilityMatcher) GetPriority() int       { return 5 }

// 7. Body Diagram 2 Matcher (Sensation Diagram - uses bodydiagram2 type)
type BodyDiagram2Matcher struct{}

func (m *BodyDiagram2Matcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	sensationDiagramFields := []string{}
	
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				// Support both naming conventions for clarity
				if patternType == "body_diagram_2" || patternType == "sensation_areas_diagram" {
					// Found sensation diagram via metadata
					if name, ok := element["name"].(string); ok {
						sensationDiagramFields = append(sensationDiagramFields, name)
					}
				}
			}
		}
	}
	
	if len(sensationDiagramFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "sensation_areas_diagram", // Use the renderer name
			ElementNames: sensationDiagramFields,
			TemplateData: map[string]interface{}{
				"diagramFields": sensationDiagramFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *BodyDiagram2Matcher) GetPatternType() string { return "sensation_areas_diagram" }
func (m *BodyDiagram2Matcher) GetPriority() int       { return 7 }

// 8. Body Pain Diagram 2 Matcher (Pain Intensity Diagram - uses bodypaindiagram type)
type BodyPainDiagram2Matcher struct{}

func (m *BodyPainDiagram2Matcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	painDiagramFields := []string{}
	
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "body_pain_diagram" {
					// Found body pain diagram via metadata
					if name, ok := element["name"].(string); ok {
						painDiagramFields = append(painDiagramFields, name)
					}
				}
			}
		}
	}
	
	if len(painDiagramFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "body_pain_diagram_2",
			ElementNames: painDiagramFields,
			TemplateData: map[string]interface{}{
				"diagramFields": painDiagramFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func (m *BodyPainDiagram2Matcher) GetPatternType() string { return "body_pain_diagram_2" }
func (m *BodyPainDiagram2Matcher) GetPriority() int       { return 8 }

// Note: SensationAreasMatcher is now deprecated - handled by BodyDiagram2Matcher
// Keeping for backward compatibility
type SensationAreasMatcher struct{}

func (m *SensationAreasMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// This is now handled by BodyDiagram2Matcher
	return false, PatternMetadata{}
}

func (m *SensationAreasMatcher) GetPatternType() string { return "sensation_areas_diagram" }
func (m *SensationAreasMatcher) GetPriority() int       { return 8 }

// 9. Patient Vitals Matcher
type PatientVitalsMatcher struct{}

func (m *PatientVitalsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	var foundVitals []string

	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "patient_vitals" {
					// Found patient vitals via metadata
					if name, ok := element["name"].(string); ok {
						foundVitals = append(foundVitals, name)
					}
					// Also collect any nested fields if it's a panel
					if nestedElements, ok := element["elements"].([]interface{}); ok {
						for _, nested := range nestedElements {
							if nestedMap, ok := nested.(map[string]interface{}); ok {
								// Only consider elements that are not just for display
								if t, ok := nestedMap["type"].(string); ok && t != "html" {
									if nestedName, ok := nestedMap["name"].(string); ok {
										foundVitals = append(foundVitals, nestedName)
									}
								}
							}
						}
					}
				}
			}
		}
	}

	if len(foundVitals) > 0 {
		var fieldsWithData []string
		for _, fieldName := range foundVitals {
			if _, exists := responseData[fieldName]; exists {
				fieldsWithData = append(fieldsWithData, fieldName)
			}
		}

		return true, PatternMetadata{
			PatternType:  "patient_vitals",
			ElementNames: foundVitals, // Return all potential fields from the form definition
			TemplateData: map[string]interface{}{
				"vitalFields": fieldsWithData, // Pass only fields that have data
			},
		}
	}

	return false, PatternMetadata{}
}

func (m *PatientVitalsMatcher) GetPatternType() string { return "patient_vitals" }
func (m *PatientVitalsMatcher) GetPriority() int       { return 9 }

// 10. Insurance Card Matcher
type InsuranceCardMatcher struct{}

func (m *InsuranceCardMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDef)
	insuranceFields := []string{}
	
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "insurance_card" {
					// Found insurance card via metadata
					if name, ok := element["name"].(string); ok {
						insuranceFields = append(insuranceFields, name)
					}
					// Also collect any nested fields if it's a panel
					if nestedElements, ok := element["elements"].([]interface{}); ok {
						for _, nested := range nestedElements {
							if nestedMap, ok := nested.(map[string]interface{}); ok {
								if nestedName, ok := nestedMap["name"].(string); ok {
									insuranceFields = append(insuranceFields, nestedName)
								}
							}
						}
					}
				}
			}
		}
	}
	
	if len(insuranceFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "insurance_card",
			ElementNames: insuranceFields,
			TemplateData: map[string]interface{}{
				"insuranceFields": insuranceFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *InsuranceCardMatcher) GetPatternType() string { return "insurance_card" }
func (m *InsuranceCardMatcher) GetPriority() int       { return 10 }

// 11. Signature Matcher
type SignatureMatcher struct{}

func (m *SignatureMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	signatureFields := []string{}
	
	// Get signatures that are part of consent/terms panels to exclude them
	consentSignatures := make(map[string]bool)
	
	// Check panels for consent/terms related signatures
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "panel" {
			// Check if this is a consent/terms panel
			if title, ok := element["title"].(string); ok {
				titleLower := strings.ToLower(title)
				if strings.Contains(titleLower, "consent") ||
				   strings.Contains(titleLower, "acknowledgment") ||
				   strings.Contains(titleLower, "financial responsibility") ||
				   strings.Contains(titleLower, "privacy") ||
				   strings.Contains(titleLower, "terms") ||
				   strings.Contains(titleLower, "agreement") ||
				   strings.Contains(titleLower, "policies") {
					
					// This is a consent panel - extract signature fields within it
					if panelElements, ok := element["elements"].([]interface{}); ok {
						for _, panelElem := range panelElements {
							if panelElement, ok := panelElem.(map[string]interface{}); ok {
								if elemType, ok := panelElement["type"].(string); ok && elemType == "signaturepad" {
									if name, ok := panelElement["name"].(string); ok {
										consentSignatures[name] = true
									}
								}
							}
						}
					}
				}
			}
		}
	}
	
	// Now collect standalone signatures (not part of consent panels)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok {
			if elementType == "signaturepad" {
				if name, ok := element["name"].(string); ok {
					// Skip if this signature is part of a consent panel
					if consentSignatures[name] {
						continue
					}
					
					// Check if this field has data in responseData
					if value, exists := responseData[name]; exists {
						if strValue, ok := value.(string); ok {
							// Verify it's base64 image data
							if strings.HasPrefix(strValue, "data:image/") {
								signatureFields = append(signatureFields, name)
							}
						}
					}
				}
			}
		}
	}
	
	// Log for debugging
	if len(signatureFields) > 0 {
		fmt.Printf("DEBUG: Found %d standalone signature fields (excluding consent panel signatures)\n", len(signatureFields))
	}
	
	if len(signatureFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "signature",
			ElementNames: signatureFields,
			TemplateData: map[string]interface{}{
				"signatureFields": signatureFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *SignatureMatcher) GetPatternType() string { return "signature" }
func (m *SignatureMatcher) GetPriority() int       { return 11 }

// ReviewOfSystemsMatcher - matches Review of Systems medical forms
type ReviewOfSystemsMatcher struct{}

func (m *ReviewOfSystemsMatcher) Match(formDefinition, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDefinition)
	var rosFields []string
	
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "review_of_systems" {
					// Found review of systems via metadata
					// Collect all ros_ fields from response data
					for key := range responseData {
						if strings.HasPrefix(key, "ros_") {
							rosFields = append(rosFields, key)
						}
					}
					// Return immediately when metadata found
					return true, PatternMetadata{
						PatternType:  "review_of_systems",
						ElementNames: rosFields,
						TemplateData: map[string]interface{}{
							"rosFields": rosFields,
						},
					}
				}
			}
		}
	}
	
	return false, PatternMetadata{}
}

func (m *ReviewOfSystemsMatcher) GetPatternType() string { return "review_of_systems" }
func (m *ReviewOfSystemsMatcher) GetPriority() int       { return 4 }

// AdditionalDemographicsMatcher - matches Additional Demographics forms
type AdditionalDemographicsMatcher struct{}

func (m *AdditionalDemographicsMatcher) Match(formDefinition, responseData map[string]interface{}) (bool, PatternMetadata) {
	// Clean metadata-only detection for 100% reliability
	elements := extractElements(formDefinition)
	var additionalDemoFields []string
	
	for _, element := range elements {
		// Check for metadata pattern type
		if metadata, ok := element["metadata"].(map[string]interface{}); ok {
			if patternType, ok := metadata["patternType"].(string); ok {
				if patternType == "additional_demographics" {
					// Found additional demographics via metadata
					// Collect all demographics_additional_ fields from response data
					for key := range responseData {
						if strings.HasPrefix(key, "demographics_additional_") {
							additionalDemoFields = append(additionalDemoFields, key)
						}
					}
					// Return immediately when metadata found
					return true, PatternMetadata{
						PatternType:  "additional_demographics",
						ElementNames: additionalDemoFields,
						TemplateData: map[string]interface{}{
							"additionalDemoFields": additionalDemoFields,
						},
					}
				}
			}
		}
	}
	
	return false, PatternMetadata{}
}

func (m *AdditionalDemographicsMatcher) GetPatternType() string { return "additional_demographics" }
func (m *AdditionalDemographicsMatcher) GetPriority() int       { return 3 }

