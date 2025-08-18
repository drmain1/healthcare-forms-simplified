package services

import (
	"bytes"
	"fmt"
	"html"
	"strings"
)

// ReviewOfSystemsRenderer renders Review of Systems (ROS) assessment data
func ReviewOfSystemsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section" style="margin-bottom: 15px;">`)
	result.WriteString(`<div class="section-title">Review of Systems</div>`)
	
	// ROS sections with their field names and the list of all possible symptoms
	rosSections := []struct {
		Title  string
		Fields []string
		AllSymptoms []string  // All possible symptoms for "denies" statement
	}{
		{
			Title: "Constitutional",
			Fields: []string{"ros_constitutional"},
			AllSymptoms: []string{
				"balance issues", "cancer", "changes in appetite", "changes in sleep",
				"changes in weight", "chills", "dizziness", "fatigue", "fever",
				"hyperactivity", "tumor", "vertigo",
			},
		},
		{
			Title: "Gastrointestinal",
			Fields: []string{"ros_gastrointestinal"},
			AllSymptoms: []string{
				"acid reflux", "belching or gas", "celiac disease", "colon issues",
				"constipation", "Crohn's disease", "diarrhea", "gall bladder issues",
				"heartburn", "hemorrhoids", "hiatal hernia", "jaundice", "liver issues",
				"nausea", "spitting up blood", "stomach aches", "stomach ulcers", "vomiting",
			},
		},
		{
			Title: "Musculoskeletal",
			Fields: []string{"ros_musculoskeletal"},
			AllSymptoms: []string{
				"arm pain", "arthritis", "broken bones", "bursitis", "elbow pain",
				"foot pain", "hip pain", "knee pain", "leg pain", "low backache",
				"muscle atrophy", "pain between shoulders", "painful tailbone",
				"plantar fasciitis", "rib pain", "scoliosis", "shoulder pain",
				"spinal curvature", "sprained ankle", "weakness in arms", "weakness in legs", "wrist pain",
			},
		},
		{
			Title: "Endocrine",
			Fields: []string{"ros_endocrine"},
			AllSymptoms: []string{
				"diabetes type I", "diabetes type II", "enlarged glands",
				"frequent urination", "gout", "hypoglycemia", "swollen joints", "thyroid issues",
			},
		},
		{
			Title: "Cardiovascular",
			Fields: []string{"ros_cardiovascular"},
			AllSymptoms: []string{
				"angina/chest pain", "atrial fibrillation (AFib)", "DVT or blood clot",
				"embolism", "fainting", "hardening of arteries", "heart attack",
				"heart disease", "high blood pressure", "low blood pressure",
				"poor circulation", "rapid heart beat", "slow heart beat", "stroke",
				"swollen ankles", "varicose veins",
			},
		},
		{
			Title: "Integumentary/Skin",
			Fields: []string{"ros_integumentary"},
			AllSymptoms: []string{
				"bruise easily", "eczema/hives", "hair/nail changes", "itching (pruritis)",
				"moles (irregular)", "psoriasis", "rashes", "scaling", "skin cancer",
			},
		},
		{
			Title: "Hematological/Lymphatic",
			Fields: []string{"ros_hematological"},
			AllSymptoms: []string{"anemia", "blood disorder", "HIV/AIDS"},
		},
		{
			Title: "Allergy/Immunologic",
			Fields: []string{"ros_allergy"},
			AllSymptoms: []string{
				"seasonal allergies", "food allergy/intolerance", "rheumatic fever", "tuberculosis",
			},
		},
		{
			Title: "Respiratory",
			Fields: []string{"ros_respiratory", "ros_cpap"},
			AllSymptoms: []string{
				"asthma", "bronchitis", "chronic cough", "COPD", "difficulty breathing",
				"emphysema", "shortness of breath", "sleep apnea",
			},
		},
		{
			Title: "Genitourinary",
			Fields: []string{"ros_genitourinary"},
			AllSymptoms: []string{
				"bed-wetting", "bladder infection", "blood in urine", "kidney infection",
				"kidney stone", "painful urination", "poor urine control", "urinary tract infection",
			},
		},
		{
			Title: "Neurological",
			Fields: []string{"ros_neurological"},
			AllSymptoms: []string{
				"burning sensations", "convulsions", "numbness in arm/hand", "numbness in leg/foot",
				"pins/needles/tingling", "restless leg syndrome (RLS)", "sciatica", "seizures",
			},
		},
		{
			Title: "EENT (Eyes, Ears, Nose, Throat)",
			Fields: []string{"ros_eent", "ros_vision_corrected"},
			AllSymptoms: []string{
				"dental issues", "difficulty swallowing", "ear infections", "hearing issues",
				"nasal congestion", "nosebleeds", "ringing in ears", "sinus infection",
				"sore throat", "TMJ pain", "vision issues",
			},
		},
		{
			Title: "Psychiatric",
			Fields: []string{"ros_psychiatric"},
			AllSymptoms: []string{
				"ADHD/ADD", "anxiety", "dementia", "depression", "nervousness",
				"paranoia", "PTSD", "stress/tension",
			},
		},
		{
			Title: "Head/Neck",
			Fields: []string{"ros_headneck", "ros_migraines_aura"},
			AllSymptoms: []string{"headaches", "migraines", "painful neck", "stiff neck"},
		},
		{
			Title: "Women's Health",
			Fields: []string{
				"ros_women_symptoms",
				"ros_women_hysterectomy_date",
				"ros_women_tubal_ligation_date",
				"ros_women_last_breast_exam",
				"ros_women_last_pap_smear",
				"ros_women_last_menstrual",
				"ros_women_regular_checkups",
				"ros_women_pregnant",
			},
		},
		{
			Title: "Men's Health",
			Fields: []string{
				"ros_men_symptoms",
				"ros_men_vasectomy_date",
				"ros_men_last_prostate_exam",
				"ros_men_last_testicular_exam",
				"ros_men_regular_checkups",
			},
		},
	}
	
	// Track if any conditions were reported
	hasAnyConditions := false
	
	// Process each section
	for _, section := range rosSections {
		sectionContent := bytes.Buffer{}
		hasSectionContent := false
		isNoneSelected := false
		
		for _, fieldName := range section.Fields {
			if value, exists := context.Answers[fieldName]; exists {
				// Check if "None of the above" or similar is selected
				if hasNoneValue(value) {
					isNoneSelected = true
					continue
				}
				
				// Format the response
				formattedValue := formatROSResponse(fieldName, value)
				if formattedValue != "" && formattedValue != "None of the above" {
					if !hasSectionContent {
						sectionContent.WriteString(fmt.Sprintf(`<div style="margin-bottom: 10px;">`))
						sectionContent.WriteString(fmt.Sprintf(`<h4 style="font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #2c3e50;">%s</h4>`, html.EscapeString(section.Title)))
						hasSectionContent = true
					}
					
					// Check if this is a special field like dates or yes/no questions
					if strings.Contains(fieldName, "_date") || strings.Contains(fieldName, "last_") {
						label := formatROSFieldLabel(fieldName)
						sectionContent.WriteString(fmt.Sprintf(`<p style="margin: 2px 0 2px 15px; font-size: 11px;"><span style="font-weight: 600;">%s:</span> %s</p>`, 
							html.EscapeString(label), html.EscapeString(formattedValue)))
					} else if strings.Contains(fieldName, "_regular_checkups") || strings.Contains(fieldName, "_pregnant") {
						label := formatROSFieldLabel(fieldName)
						sectionContent.WriteString(fmt.Sprintf(`<p style="margin: 2px 0 2px 15px; font-size: 11px;"><span style="font-weight: 600;">%s:</span> %s</p>`, 
							html.EscapeString(label), html.EscapeString(formattedValue)))
					} else {
						// Regular symptom list
						sectionContent.WriteString(fmt.Sprintf(`<p style="margin: 2px 0 2px 15px; font-size: 11px;">• %s</p>`, html.EscapeString(formattedValue)))
					}
					hasAnyConditions = true
				}
			}
		}
		
		// If "None of the above" was selected, show denial statement
		if isNoneSelected && len(section.AllSymptoms) > 0 {
			result.WriteString(fmt.Sprintf(`<div style="margin-bottom: 10px;">`))  
			result.WriteString(fmt.Sprintf(`<h4 style="font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #2c3e50;">%s</h4>`, html.EscapeString(section.Title)))
			result.WriteString(`<p style="margin: 2px 0 2px 15px; font-size: 11px; font-style: italic;">`)
			result.WriteString(fmt.Sprintf(`Patient denies: %s.`, strings.Join(section.AllSymptoms, ", ")))
			result.WriteString(`</p></div>`)
			hasAnyConditions = true
		} else if hasSectionContent {
			sectionContent.WriteString(`</div>`)
			result.WriteString(sectionContent.String())
		}
	}
	
	// Add "Other Conditions" if present
	if otherConditions, exists := context.Answers["ros_other_conditions"]; exists {
		if otherStr, ok := otherConditions.(string); ok && otherStr != "" {
			result.WriteString(`<div style="margin-bottom: 10px;">`)
			result.WriteString(`<h4 style="font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #2c3e50;">Other Conditions</h4>`)
			result.WriteString(fmt.Sprintf(`<p style="margin: 2px 0 2px 15px; font-size: 11px;">%s</p>`, html.EscapeString(otherStr)))
			result.WriteString(`</div>`)
			hasAnyConditions = true
		}
	}
	
	// If no conditions were reported, show a message
	if !hasAnyConditions {
		result.WriteString(`<div style="padding: 10px; background-color: #f0f8f7; border-left: 4px solid #38a169; margin-top: 10px;">`)
		result.WriteString(`<p style="font-size: 11px; margin: 0;">Patient denies all review of systems symptoms.</p>`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

// hasNoneValue checks if the value contains "None of the above" or similar
func hasNoneValue(value interface{}) bool {
	switch v := value.(type) {
	case []interface{}:
		for _, item := range v {
			itemStr := strings.ToLower(fmt.Sprintf("%v", item))
			if strings.Contains(itemStr, "none of the above") || 
			   strings.Contains(itemStr, "_none") ||
			   itemStr == "none" {
				return true
			}
		}
	case string:
		lowerStr := strings.ToLower(v)
		return strings.Contains(lowerStr, "none of the above") || 
		       strings.Contains(lowerStr, "_none") ||
		       lowerStr == "none"
	}
	return false
}

// formatROSResponse formats the ROS response, handling arrays and "none" values
func formatROSResponse(fieldName string, value interface{}) string {
	switch v := value.(type) {
	case []interface{}:
		// Handle array of selected conditions
		var conditions []string
		for _, item := range v {
			itemStr := fmt.Sprintf("%v", item)
			// Skip "none" values
			if !strings.Contains(strings.ToLower(itemStr), "_none") && 
			   !strings.EqualFold(itemStr, "none") {
				conditions = append(conditions, itemStr)
			}
		}
		if len(conditions) == 0 {
			return "None of the above"
		}
		return strings.Join(conditions, ", ")
		
	case string:
		// Skip empty strings and "none" responses
		if v == "" || strings.EqualFold(v, "none") || strings.Contains(strings.ToLower(v), "_none") {
			return "None of the above"
		}
		// Format dates if this is a date field
		if strings.Contains(fieldName, "_date") || strings.Contains(fieldName, "last_") {
			return FormatDateUSA(v)
		}
		return v
		
	case bool:
		if v {
			return "Yes"
		}
		return "No"
		
	default:
		result := fmt.Sprintf("%v", value)
		if result == "" || strings.EqualFold(result, "none") {
			return "None of the above"
		}
		return result
	}
}

// formatROSFieldLabel converts ROS field names to human-readable labels
func formatROSFieldLabel(fieldName string) string {
	// Remove prefixes
	label := strings.TrimPrefix(fieldName, "ros_")
	label = strings.TrimPrefix(label, "women_")
	label = strings.TrimPrefix(label, "men_")
	
	// Replace underscores with spaces
	label = strings.ReplaceAll(label, "_", " ")
	
	// Title case
	words := strings.Fields(label)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(word[:1]) + word[1:]
		}
	}
	
	return strings.Join(words, " ")
}

// DetectReviewOfSystemsPattern checks if the form contains Review of Systems elements
func DetectReviewOfSystemsPattern(surveyJSON map[string]interface{}) bool {
	// Check for the specific ROS panel name
	if pages, ok := surveyJSON["pages"].([]interface{}); ok {
		for _, pageData := range pages {
			if page, ok := pageData.(map[string]interface{}); ok {
				if hasROSPanel(page["elements"]) {
					return true
				}
			}
		}
	}
	
	// Also check elements at the root level
	if elements, ok := surveyJSON["elements"].([]interface{}); ok {
		if hasROSPanel(elements) {
			return true
		}
	}
	
	return false
}

// hasROSPanel recursively checks for ROS panel in elements
func hasROSPanel(elements interface{}) bool {
	elementsSlice, ok := elements.([]interface{})
	if !ok {
		return false
	}
	
	for _, elData := range elementsSlice {
		element, ok := elData.(map[string]interface{})
		if !ok {
			continue
		}
		
		// Check if this is the ROS panel
		if name, ok := element["name"].(string); ok {
			if name == "page_review_of_systems" {
				return true
			}
		}
		
		// Check nested elements
		if subElements, ok := element["elements"]; ok {
			if hasROSPanel(subElements) {
				return true
			}
		}
	}
	
	return false
}

// GetReviewOfSystemsFields returns all ROS field names for data extraction
func GetReviewOfSystemsFields() []string {
	return []string{
		"ros_constitutional",
		"ros_gastrointestinal",
		"ros_musculoskeletal",
		"ros_endocrine",
		"ros_cardiovascular",
		"ros_integumentary",
		"ros_hematological",
		"ros_allergy",
		"ros_respiratory",
		"ros_cpap",
		"ros_genitourinary",
		"ros_neurological",
		"ros_eent",
		"ros_vision_corrected",
		"ros_psychiatric",
		"ros_headneck",
		"ros_migraines_aura",
		"ros_women_symptoms",
		"ros_women_hysterectomy_date",
		"ros_women_tubal_ligation_date",
		"ros_women_last_breast_exam",
		"ros_women_last_pap_smear",
		"ros_women_last_menstrual",
		"ros_women_regular_checkups",
		"ros_women_pregnant",
		"ros_men_symptoms",
		"ros_men_vasectomy_date",
		"ros_men_last_prostate_exam",
		"ros_men_last_testicular_exam",
		"ros_men_regular_checkups",
		"ros_other_conditions",
	}
}