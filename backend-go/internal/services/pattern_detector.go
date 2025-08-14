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
			&PainAssessmentMatcher{},
			&NeckDisabilityMatcher{},
			&OswestryDisabilityMatcher{},
			&BodyDiagram2Matcher{},
			&BodyPainDiagram2Matcher{},
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
	
	// Handle SurveyJS structure
	if pages, ok := formDef["pages"].([]interface{}); ok {
		for _, page := range pages {
			if pageMap, ok := page.(map[string]interface{}); ok {
				if pageElements, ok := pageMap["elements"].([]interface{}); ok {
					for _, elem := range pageElements {
						if elemMap, ok := elem.(map[string]interface{}); ok {
							elements = append(elements, elemMap)
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
				elements = append(elements, elemMap)
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
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok && (elementType == "html" || elementType == "text") {
			if name, ok := element["name"].(string); ok {
				if strings.Contains(strings.ToLower(name), "terms") ||
				   strings.Contains(strings.ToLower(name), "conditions") {
					return true, PatternMetadata{
						PatternType:  "terms_conditions",
						ElementNames: []string{name},
						TemplateData: map[string]interface{}{
							"content": element["html"],
						},
					}
				}
			}
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
		"gender", "phone", "email", "address", "emergency_contact",
	}
	
	foundFields := []string{}
	for _, field := range demographicFields {
		if _, exists := responseData[field]; exists {
			foundFields = append(foundFields, field)
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
	painFields := []string{}
	
	for key := range responseData {
		if strings.Contains(strings.ToLower(key), "pain") {
			painFields = append(painFields, key)
		}
	}
	
	if len(painFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "pain_assessment",
			ElementNames: painFields,
			TemplateData: map[string]interface{}{
				"painFields": painFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *PainAssessmentMatcher) GetPatternType() string { return "pain_assessment" }
func (m *PainAssessmentMatcher) GetPriority() int       { return 6 }

// 5. Neck Disability Index Matcher
type NeckDisabilityMatcher struct{}

func (m *NeckDisabilityMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	ndiQuestions := []string{}
	
	for key := range responseData {
		if strings.Contains(strings.ToLower(key), "ndi_") || 
		   strings.Contains(strings.ToLower(key), "neck_disability") {
			ndiQuestions = append(ndiQuestions, key)
		}
	}
	
	if len(ndiQuestions) >= 5 { // At least 5 NDI questions
		return true, PatternMetadata{
			PatternType:  "neck_disability_index",
			ElementNames: ndiQuestions,
			TemplateData: map[string]interface{}{
				"questions": ndiQuestions,
				"responses": filterResponseData(responseData, ndiQuestions),
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *NeckDisabilityMatcher) GetPatternType() string { return "neck_disability_index" }
func (m *NeckDisabilityMatcher) GetPriority() int       { return 4 }

// 6. Oswestry Disability Matcher
type OswestryDisabilityMatcher struct{}

func (m *OswestryDisabilityMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	oswestryQuestions := []string{}
	
	for key := range responseData {
		if strings.Contains(strings.ToLower(key), "oswestry") ||
		   strings.Contains(strings.ToLower(key), "odi_") {
			oswestryQuestions = append(oswestryQuestions, key)
		}
	}
	
	if len(oswestryQuestions) >= 5 { // At least 5 Oswestry questions
		return true, PatternMetadata{
			PatternType:  "oswestry_disability",
			ElementNames: oswestryQuestions,
			TemplateData: map[string]interface{}{
				"questions": oswestryQuestions,
				"responses": filterResponseData(responseData, oswestryQuestions),
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *OswestryDisabilityMatcher) GetPatternType() string { return "oswestry_disability" }
func (m *OswestryDisabilityMatcher) GetPriority() int       { return 5 }

// 7. Body Diagram 2 Matcher
type BodyDiagram2Matcher struct{}

func (m *BodyDiagram2Matcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	bodyDiagramFields := []string{}
	
	// Check form definition for body diagram type components
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok {
			// Check for SurveyJS body diagram component types
			if elementType == "bodydiagram2" || elementType == "body_diagram_2" {
				if name, ok := element["name"].(string); ok {
					bodyDiagramFields = append(bodyDiagramFields, name)
				}
			}
		}
	}
	
	// Also check response data for body diagram fields
	for key, value := range responseData {
		lowerKey := strings.ToLower(key)
		if strings.Contains(lowerKey, "bodydiagram2") || 
		   strings.Contains(lowerKey, "body_diagram_2") ||
		   (strings.Contains(lowerKey, "body") && strings.Contains(lowerKey, "diagram")) {
			// Check if value contains pain area data
			if _, ok := value.([]interface{}); ok {
				bodyDiagramFields = append(bodyDiagramFields, key)
			}
		}
	}
	
	if len(bodyDiagramFields) > 0 {
		return true, PatternMetadata{
			PatternType:  "body_diagram_2",
			ElementNames: bodyDiagramFields,
			TemplateData: map[string]interface{}{
				"diagramFields": bodyDiagramFields,
			},
		}
	}
	
	return false, PatternMetadata{}
}

func (m *BodyDiagram2Matcher) GetPatternType() string { return "body_diagram_2" }
func (m *BodyDiagram2Matcher) GetPriority() int       { return 7 }

// 8. Body Pain Diagram 2 Matcher
type BodyPainDiagram2Matcher struct{}

func (m *BodyPainDiagram2Matcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	painDiagramFields := []string{}
	
	// Check form definition for body pain diagram type components
	elements := extractElements(formDef)
	for _, element := range elements {
		if elementType, ok := element["type"].(string); ok {
			// Check for SurveyJS body pain diagram component types
			if elementType == "bodypaindiagram" || elementType == "body_pain_diagram" {
				if name, ok := element["name"].(string); ok {
					painDiagramFields = append(painDiagramFields, name)
				}
			}
		}
	}
	
	// Also check response data for pain diagram fields
	for key, value := range responseData {
		lowerKey := strings.ToLower(key)
		if strings.Contains(lowerKey, "sensation_areas") || strings.Contains(lowerKey, "bodypaindiagram") || 
		   strings.Contains(lowerKey, "body_pain_diagram") ||
		   strings.Contains(lowerKey, "paindiagram") ||
		   (strings.Contains(lowerKey, "pain") && strings.Contains(lowerKey, "diagram")) {
			// Check if value contains pain area data (array of pain points)
			if painArray, ok := value.([]interface{}); ok {
				// Verify it has pain point structure
				if len(painArray) > 0 {
					if point, ok := painArray[0].(map[string]interface{}); ok {
						// Check for x, y coordinates which indicate pain points
						if _, hasX := point["x"]; hasX {
							if _, hasY := point["y"]; hasY {
								painDiagramFields = append(painDiagramFields, key)
							}
						}
					}
				}
			} else if painMapArray, ok := value.([]map[string]interface{}); ok {
				// Handle the case where the data is a slice of maps
				if len(painMapArray) > 0 {
					point := painMapArray[0]
					if _, hasX := point["x"]; hasX {
						if _, hasY := point["y"]; hasY {
							painDiagramFields = append(painDiagramFields, key)
						}
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

func (m *BodyPainDiagram2Matcher) GetPatternType() string { return "body_pain_diagram_2" }
func (m *BodyPainDiagram2Matcher) GetPriority() int       { return 8 }

// 9. Patient Vitals Matcher
type PatientVitalsMatcher struct{}

func (m *PatientVitalsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
	vitalFields := []string{
		"blood_pressure", "heart_rate", "temperature", "weight", "height",
		"bmi", "oxygen_saturation", "respiratory_rate",
	}
	
	foundVitals := []string{}
	for _, field := range vitalFields {
		if _, exists := responseData[field]; exists {
			foundVitals = append(foundVitals, field)
		}
	}
	
	// Also check for variations
	for key := range responseData {
		lowerKey := strings.ToLower(key)
		if strings.Contains(lowerKey, "vital") ||
		   strings.Contains(lowerKey, "bp_") ||
		   strings.Contains(lowerKey, "hr_") {
			foundVitals = append(foundVitals, key)
		}
	}
	
	if len(foundVitals) >= 2 { // At least 2 vital signs
		return true, PatternMetadata{
			PatternType:  "patient_vitals",
			ElementNames: foundVitals,
			TemplateData: map[string]interface{}{
				"vitalFields": foundVitals,
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
	
	for key, value := range responseData {
		lowerKey := strings.ToLower(key)
		if strings.Contains(lowerKey, "signature") ||
		   strings.Contains(lowerKey, "sign") {
			// Check if it's image data (base64)
			if strValue, ok := value.(string); ok {
				if strings.HasPrefix(strValue, "data:image/") {
					signatureFields = append(signatureFields, key)
				}
			}
		}
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