package services

import (
	"bytes"
	goctx "context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"strings"
	"time"

	"github.com/gemini/forms-api/internal/services/renderers/templates"
)

type RendererFunc func(PatternMetadata, *PDFContext) (string, error)

type RendererRegistry struct {
	renderers     map[string]RendererFunc
	renderOrder   []string
	templateStore *templates.TemplateStore
}

type RenderError struct {
	Code      string
	Section   string
	Cause     error
	RequestID string
}

func (re RenderError) Error() string {
	return fmt.Sprintf("[%s] %s: %v (request: %s)", re.Code, re.Section, re.Cause, re.RequestID)
}

func NewRendererRegistry(templateStore *templates.TemplateStore) *RendererRegistry {
	registry := &RendererRegistry{
		renderers:     make(map[string]RendererFunc),
		templateStore: templateStore,
	}

	// Register all renderers
	registry.registerRenderers()

	return registry
}

// Helper function to get keys from a map
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (rr *RendererRegistry) registerRenderers() {
	// Register existing adapted renderers
	rr.renderers["terms_checkbox"] = rr.wrapRenderer(TermsCheckboxRenderer)
	rr.renderers["terms_conditions"] = rr.wrapRenderer(TermsConditionsRenderer)
	rr.renderers["patient_demographics"] = rr.wrapRenderer(PatientDemographicsRenderer)
	
	// Register pain assessment renderer with the embedded template
	rr.renderers["pain_assessment"] = rr.wrapRenderer(func(metadata PatternMetadata, context *PDFContext) (string, error) {
		// Use the metadata fields to create the pain assessment table
		// The pattern detector already found the fields for us
		
		// Build the pain data from the fields
		var painAreas []PainAreaData
		
		// Process the fields we found
		for _, fieldName := range metadata.ElementNames {
			// Skip synthetic fields
			if fieldName == "pain_areas" || strings.Contains(fieldName, "diagram") {
				continue
			}
			
			// Check if this is a "has_X_pain" field
			if strings.HasPrefix(fieldName, "has_") && strings.HasSuffix(fieldName, "_pain") {
				// Extract the area name
				areaName := strings.TrimSuffix(strings.TrimPrefix(fieldName, "has_"), "_pain")
				
				// Check if they have pain in this area
				if hasPain, ok := context.Answers[fieldName]; ok && hasPain == "Yes" {
					// Get intensity and frequency
					intensityField := areaName + "_pain_intensity"
					frequencyField := areaName + "_pain_frequency"
					
					// Handle special case for neck
					if areaName == "neck" {
						// Already correct format
					}
					
					painArea := PainAreaData{
						Area: strings.Title(strings.ReplaceAll(areaName, "_", " ")),
					}
					
					if intensity, ok := context.Answers[intensityField]; ok {
						painArea.Severity = intensity
					}
					
					if frequency, ok := context.Answers[frequencyField]; ok {
						painArea.Frequency = frequency
						// Convert frequency to display values
						if freqFloat, ok := frequency.(float64); ok {
							painArea.FrequencyValue = freqFloat * 33.33 // Map 0-3 to 0-100%
							switch int(freqFloat) {
							case 0:
								painArea.FrequencyText = "Occasional"
							case 1:
								painArea.FrequencyText = "Intermittent"
							case 2:
								painArea.FrequencyText = "Frequent"
							case 3:
								painArea.FrequencyText = "Constant"
							}
						}
					}
					
					painAreas = append(painAreas, painArea)
				}
			}
		}
		
		// If we found pain data, render the table
		if len(painAreas) > 0 {
			// Parse and execute the embedded template
			tmpl, err := template.New("pain_assessment").Parse(PainAssessmentTableTemplate)
			if err != nil {
				return "", fmt.Errorf("failed to parse pain assessment template: %w", err)
			}
			
			var buf bytes.Buffer
			if err := tmpl.Execute(&buf, painAreas); err != nil {
				return "", fmt.Errorf("failed to execute pain assessment template: %w", err)
			}
			
			return buf.String(), nil
		}
		
		// Fallback to simple display
		return generatePlaceholderHTML("Pain Assessment", metadata.ElementNames), nil
	})

	// Register new renderers
	rr.renderers["neck_disability_index"] = rr.wrapRenderer(NeckDisabilityRenderer)
	rr.renderers["oswestry_disability"] = rr.wrapRenderer(OswestryDisabilityRenderer)
	rr.renderers["body_diagram_2"] = rr.wrapRenderer(BodyDiagramV2Renderer)
	rr.renderers["body_pain_diagram_2"] = rr.wrapRenderer(BodyPainDiagramV2Renderer)
	rr.renderers["sensation_areas_diagram"] = rr.wrapRenderer(SensationAreasRenderer)
	rr.renderers["patient_vitals"] = rr.wrapRenderer(PatientVitalsRenderer)
	rr.renderers["insurance_card"] = rr.wrapRenderer(InsuranceCardRenderer)
	rr.renderers["signature"] = rr.wrapRenderer(SignatureRenderer)
}

// wrapRenderer wraps individual renderer functions with security validation
func (rr *RendererRegistry) wrapRenderer(renderer RendererFunc) RendererFunc {
	return func(metadata PatternMetadata, context *PDFContext) (string, error) {
		// Validate input data
		validator := NewSecurityValidator()
		validationResult, err := validator.ValidateAndSanitize("pdf-renderer", context.Answers)
		if err != nil {
			return "", fmt.Errorf("security validation failed: %w", err)
		}
		
		if !validationResult.IsValid {
			return "", fmt.Errorf("security validation failed: %v", validationResult.Errors)
		}
		
		// Create sanitized context
		sanitizedContext := &PDFContext{
			FormResponse:     context.FormResponse,
			FormDefinition:   context.FormDefinition,
			OrganizationInfo: context.OrganizationInfo,
			Answers:          validationResult.SanitizedData,
			RequestID:        context.RequestID,
		}
		
		// Call the actual renderer with sanitized data
		return renderer(metadata, sanitizedContext)
	}
}

func (rr *RendererRegistry) Render(patternType string, metadata PatternMetadata, context *PDFContext) (string, error) {
	renderer, exists := rr.renderers[patternType]
	if !exists {
		return "", RenderError{
			Code:      "RNDR-001",
			Section:   patternType,
			Cause:     fmt.Errorf("renderer not found"),
			RequestID: context.RequestID,
		}
	}

	// Add timeout for each renderer
	ctx, cancel := goctx.WithTimeout(goctx.Background(), 10*time.Second)
	defer cancel()

	done := make(chan string, 1)
	errChan := make(chan error, 1)

	go func() {
		html, err := renderer(metadata, context)
		if err != nil {
			errChan <- err
		} else {
			done <- html
		}
	}()

	select {
	case html := <-done:
		return html, nil
	case err := <-errChan:
		return "", RenderError{
			Code:      fmt.Sprintf("RNDR-%s-001", strings.ToUpper(patternType)),
			Section:   patternType,
			Cause:     err,
			RequestID: context.RequestID,
		}
	case <-ctx.Done():
		return "", RenderError{
			Code:      "RNDR-TIMEOUT",
			Section:   patternType,
			Cause:     fmt.Errorf("renderer timeout after 10s"),
			RequestID: context.RequestID,
		}
	}
}

func (rr *RendererRegistry) generateErrorBlock(err RenderError) string {
	return fmt.Sprintf(`
    <div class="section-error" style="background-color: #FFF3F3; border: 2px solid #FFB3B3; padding: 16px; margin: 16px 0;">
        <h3 style="color: #D8000C;">⚠️ Could Not Render Section: %s</h3>
        <p style="color: #666;">This section could not be generated due to a system error. Please review this information in the patient's online chart or contact support.</p>
        <p style="font-size: 12px; color: #999;">Error Code: %s | Request: %s</p>
    </div>`, err.Section, err.Code, err.RequestID)
}

// Placeholder renderer functions - these will be implemented in separate files

// Existing adapted renderers
func TermsCheckboxRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Terms Checkbox", metadata.ElementNames), nil
}

func TermsConditionsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Terms & Conditions", metadata.ElementNames), nil
}

func PatientDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Patient Demographics", metadata.ElementNames), nil
}


// New renderers - removed placeholders as actual implementations are imported

func PatientVitalsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Patient Vitals", metadata.ElementNames), nil
}

func InsuranceCardRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Insurance Card", metadata.ElementNames), nil
}

func SignatureRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	return generatePlaceholderHTML("Signature", metadata.ElementNames), nil
}

// Helper function for placeholder HTML generation
func generatePlaceholderHTML(title string, elementNames []string) string {
	html := fmt.Sprintf(`
    <div class="form-section">
        <div class="section-title">%s</div>
        <div style="padding: 15px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">
            <p><strong>Section:</strong> %s</p>
            <p><strong>Fields detected:</strong> %s</p>
            <p style="font-style: italic; color: #6c757d;">This section is currently using placeholder rendering. Full implementation coming soon.</p>
        </div>
    </div>`, title, title, strings.Join(elementNames, ", "))
	
	return html
}