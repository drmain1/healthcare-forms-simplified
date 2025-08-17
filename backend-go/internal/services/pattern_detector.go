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
	// Look for panels with consent/terms/policy related titles
	elements := extractElements(formDef)
	var consentPanels []map[string]interface{}
	
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && elementType == "panel" {
			// Check for titles containing consent/terms/policy keywords
			if title, ok := element["title"].(string); ok {
				titleLower := strings.ToLower(title)
				if strings.Contains(titleLower, "consent") ||
				   strings.Contains(titleLower, "acknowledgment") ||
				   strings.Contains(titleLower, "financial responsibility") ||
				   strings.Contains(titleLower, "privacy") ||
				   strings.Contains(titleLower, "terms") ||
				   strings.Contains(titleLower, "agreement") ||
				   strings.Contains(titleLower, "policies") {
					
					// Found a consent/terms panel
					consentPanels = append(consentPanels, element)
					
					// Log for debugging
					fmt.Printf("DEBUG: Found terms/consent panel: %s\n", title)
				}
			}
		}
	}
	
	if len(consentPanels) > 0 {
		return true, PatternMetadata{
			PatternType:  "terms_conditions",
			ElementNames: []string{}, // Will be populated with element names from panels
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
	demographicFields := []string{
		"patient_name", "first_name", "last_name", "date_of_birth", "dob",
		"sex_at_birth", "gender", "sex", "phone", "phone_number", "email", "email_address", 
		"address", "street_address", "city", "state", "zip", "zip_code", 
		"postal_code", "emergency_contact", "emergency_phone",
	}
	
	foundFields := []string{}
	for _, field := range demographicFields {
		if _, exists := responseData[field]; exists {
			foundFields = append(foundFields, field)
		}
	}
	
	// Also check for any field containing these keywords
	for key := range responseData {
		lowerKey := strings.ToLower(key)
		if !contains(foundFields, key) {
			if strings.Contains(lowerKey, "name") ||
			   strings.Contains(lowerKey, "birth") ||
			   strings.Contains(lowerKey, "gender") ||
			   strings.Contains(lowerKey, "sex") ||
			   strings.Contains(lowerKey, "phone") ||
			   strings.Contains(lowerKey, "email") ||
			   strings.Contains(lowerKey, "address") ||
			   strings.Contains(lowerKey, "city") ||
			   strings.Contains(lowerKey, "state") ||
			   strings.Contains(lowerKey, "zip") {
				foundFields = append(foundFields, key)
			}
		}
	}
	
	if len(foundFields) >= 2 { // At least 2 demographic fields
		return true, PatternMetadata{
			PatternType:  "patient_demographics",
			ElementNames: foundFields,
			TemplateData: map[string]interface{}{
				"fields": foundFields,
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
	
	// First check form definition for bodydiagram2 type components with name "sensation_areas"
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok {
			// Check specifically for bodydiagram2 type (sensation diagram)
			if elementType == "bodydiagram2" {
				if name, ok := element["name"].(string); ok {
					// Only match if name is "sensation_areas"
					if name == "sensation_areas" {
						// Check if this field has data in responseData
						if value, exists := responseData[name]; exists {
							if _, isArray := value.([]interface{}); isArray {
								sensationDiagramFields = append(sensationDiagramFields, name)
							}
						}
					}
				}
			}
		}
	}
	
	// If no form definition, check response data for fields that look like bodydiagram2 data
	if len(sensationDiagramFields) == 0 {
		for key, value := range responseData {
			// Check if it's an array with sensation data structure
			if arr, ok := value.([]interface{}); ok && len(arr) > 0 {
				if item, ok := arr[0].(map[string]interface{}); ok {
					// Check if it has sensation field (key differentiator)
					if _, hasSensation := item["sensation"]; hasSensation {
						if _, hasX := item["x"]; hasX {
							if _, hasY := item["y"]; hasY {
								sensationDiagramFields = append(sensationDiagramFields, key)
							}
						}
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
	
	// ONLY check form definition for bodypaindiagram type components with name "pain_areas"
	// Do NOT match on synthetic pain_areas field from pain assessment
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok {
			// Check specifically for bodypaindiagram type (actual diagram component)
			if elementType == "bodypaindiagram" {
				if name, ok := element["name"].(string); ok {
					// Only match if name is "pain_areas"
					if name == "pain_areas" {
						// Check if this field has data in responseData
						if value, exists := responseData[name]; exists {
							if _, isArray := value.([]interface{}); isArray {
								painDiagramFields = append(painDiagramFields, name)
							}
						}
					}
				}
			}
		}
	}
	
	// Do NOT check for pain_areas in response data anymore
	// That's synthetic data from pain assessment, not a real body diagram
	
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
	elements := extractElements(formDef)
	var foundVitals []string

	// Look for a panel with "Vitals" in the title or name
	for _, element := range elements {
		if elemType, ok := element["type"].(string); ok && elemType == "panel" {
			name, _ := element["name"].(string)
			title, _ := element["title"].(string)

			// Corrected case-sensitivity for title check
			if strings.Contains(strings.ToLower(name), "vitals") || strings.Contains(strings.ToLower(title), "vitals") {
				// Panel found, now extract the names of the elements inside it
				if panelElements, ok := element["elements"].([]interface{}); ok {
					for _, panelElem := range panelElements {
						if pe, ok := panelElem.(map[string]interface{}); ok {
							// Only consider elements that are not just for display
							if t, ok := pe["type"].(string); ok && t != "html" {
								if n, ok := pe["name"].(string); ok {
									foundVitals = append(foundVitals, n)
								}
							}
						}
					}
				}
				// Once we find a vitals panel, we assume it's the one and stop looking.
				goto CheckAndReturn
			}
		}
	}

	// Fallback: if no panel was found, look for individual slider elements
	for _, element := range elements {
		if elemType, ok := element["type"].(string); ok {
			if elemType == "heightslider" || elemType == "weightslider" {
				if name, ok := element["name"].(string); ok {
					if !contains(foundVitals, name) {
						foundVitals = append(foundVitals, name)
					}
				}
			}
		}
	}

CheckAndReturn:
	// If we found potential vitals fields in the form definition, we consider it a match.
	// The renderer can handle cases where no data was submitted.
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
	insuranceFields := []string{}
	
	for key := range responseData {
		lowerKey := strings.ToLower(key)
		if strings.Contains(lowerKey, "insurance") ||
		   strings.Contains(lowerKey, "card") ||
		   strings.Contains(lowerKey, "policy") {
			insuranceFields = append(insuranceFields, key)
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