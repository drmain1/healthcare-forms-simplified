package services

import (
	"context"
	"crypto/sha256"
	"fmt"
	"html/template"
	"log"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/services/renderers/templates"
)

type PDFOrchestrator struct {
	client        *firestore.Client
	gotenberg     *GotenbergService
	registry      *RendererRegistry
	detector      *PatternDetector
	templateStore *templates.TemplateStore
}

type PDFContext struct {
	FormResponse     map[string]interface{}
	FormDefinition   map[string]interface{}
	OrganizationInfo *data.Organization
	Answers          map[string]interface{}
	RequestID        string
	TemplateStore    *templates.TemplateStore
}

func NewPDFOrchestrator(client *firestore.Client, gotenberg *GotenbergService) (*PDFOrchestrator, error) {
	templateStore, err := templates.NewTemplateStore()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize template store: %w", err)
	}

	detector := NewPatternDetector()
	registry := NewRendererRegistry(templateStore)

	return &PDFOrchestrator{
		client:        client,
		gotenberg:     gotenberg,
		registry:      registry,
		detector:      detector,
		templateStore: templateStore,
	}, nil
}

func (o *PDFOrchestrator) GeneratePDF(ctx context.Context, responseID string, userID string) ([]byte, error) {
	// Generate request ID for audit trail
	requestID := fmt.Sprintf("pdf_%d_%s", time.Now().Unix(), responseID[:8])
	
	// Audit log start
	log.Printf("PDF_GENERATION_START: user=%s, response=%s, request=%s", userID, responseID, requestID)
	
	// 1. Fetch all required data in parallel
	pdfContext, err := o.fetchPDFContext(ctx, responseID, requestID)
	if err != nil {
		log.Printf("PDF_GENERATION_ERROR: user=%s, response=%s, request=%s, error=%v", userID, responseID, requestID, err)
		return nil, fmt.Errorf("failed to fetch PDF context: %w", err)
	}
	
	// 2. Detect patterns and determine render order
	// NOTE: Avoid logging full form definition or answers to maintain HIPAA compliance
	log.Printf("DEBUG: Form definition contains %d keys", len(pdfContext.FormDefinition))
	log.Printf("DEBUG: Response answers contains %d fields", len(pdfContext.Answers))
	
	// Extract surveyJson for pattern detection
	surveyJson, ok := pdfContext.FormDefinition["surveyJson"].(map[string]interface{})
	if !ok {
		surveyJson = pdfContext.FormDefinition // Fallback for backward compatibility
		log.Printf("DEBUG: Using full form definition as surveyJson fallback")
	} else {
		log.Printf("DEBUG: Successfully extracted surveyJson from form definition")
	}
	patterns, err := o.detector.DetectPatterns(surveyJson, pdfContext.Answers)
	if err != nil {
		log.Printf("PDF_GENERATION_ERROR: user=%s, response=%s, request=%s, error=%v", userID, responseID, requestID, err)
		return nil, fmt.Errorf("pattern detection failed: %w", err)
	}
	
	log.Printf("DEBUG: Detected patterns: %d", len(patterns))
	for _, p := range patterns {
		log.Printf("DEBUG: Pattern type=%s, fields=%v", p.PatternType, p.ElementNames)
	}
	
	// 3. Get custom render order from organization or use default
	renderOrder := o.getRenderOrder(pdfContext.OrganizationInfo, patterns)
	
	// 4. Generate HTML sections with streaming
	htmlSections, err := o.renderSections(pdfContext, renderOrder)
	if err != nil {
		log.Printf("PDF_GENERATION_ERROR: user=%s, response=%s, request=%s, error=%v", userID, responseID, requestID, err)
		return nil, fmt.Errorf("section rendering failed: %w", err)
	}
	
	// 5. Assemble HTML and generate PDF
	pdfBytes, err := o.assembleAndGeneratePDF(htmlSections, pdfContext)
	if err != nil {
		log.Printf("PDF_GENERATION_ERROR: user=%s, response=%s, request=%s, error=%v", userID, responseID, requestID, err)
		return nil, fmt.Errorf("PDF generation failed: %w", err)
	}
	
	// 6. Audit log completion
	checksum := o.calculateChecksum(pdfBytes)
	log.Printf("PDF_GENERATION_SUCCESS: user=%s, response=%s, request=%s, checksum=%s, size=%d", 
	           userID, responseID, requestID, checksum, len(pdfBytes))
	
	return pdfBytes, nil
}

func (o *PDFOrchestrator) fetchPDFContext(ctx context.Context, responseID, requestID string) (*PDFContext, error) {
	// Use goroutines for parallel fetching
	type fetchResult struct {
		data interface{}
		err  error
		name string
	}
	
	resultChan := make(chan fetchResult, 3)
	
	// Fetch form response
	go func() {
		doc, err := o.client.Collection("form_responses").Doc(responseID).Get(ctx)
		if err != nil {
			resultChan <- fetchResult{nil, err, "form_response"}
			return
		}
		var data map[string]interface{}
		err = doc.DataTo(&data)
		resultChan <- fetchResult{data, err, "form_response"}
	}()
	
	var formResponse map[string]interface{}
	var formDefinition map[string]interface{}
	var orgInfo *data.Organization
	
	// Collect form response first (needed for subsequent fetches)
	result := <-resultChan
	if result.err != nil {
		return nil, fmt.Errorf("failed to fetch form response: %w", result.err)
	}
	formResponse = result.data.(map[string]interface{})
	
	// Extract IDs for subsequent fetches
	formID, _ := formResponse["form"].(string)
	orgID, _ := formResponse["organizationId"].(string)
	
	// Fetch form definition and organization in parallel
	go func() {
		if formID == "" {
			resultChan <- fetchResult{nil, fmt.Errorf("form ID not found in response"), "form_definition"}
			return
		}
		doc, err := o.client.Collection("forms").Doc(formID).Get(ctx)
		if err != nil {
			resultChan <- fetchResult{nil, err, "form_definition"}
			return
		}
		var data map[string]interface{}
		err = doc.DataTo(&data)
		resultChan <- fetchResult{data, err, "form_definition"}
	}()
	
	go func() {
		if orgID == "" {
			resultChan <- fetchResult{nil, nil, "organization"}
			return
		}
		doc, err := o.client.Collection("organizations").Doc(orgID).Get(ctx)
		if err != nil {
			resultChan <- fetchResult{nil, err, "organization"}
			return
		}
		var data data.Organization
		err = doc.DataTo(&data)
		resultChan <- fetchResult{&data, err, "organization"}
	}()
	
	// Collect remaining results
	for i := 0; i < 2; i++ {
		result := <-resultChan
		switch result.name {
		case "form_definition":
			if result.err != nil {
				return nil, fmt.Errorf("failed to fetch form definition: %w", result.err)
			}
			formDefinition = result.data.(map[string]interface{})
		case "organization":
			if result.err == nil && result.data != nil {
				orgInfo = result.data.(*data.Organization)
			}
		}
	}
	
	// Extract answers
	answers, ok := formResponse["response_data"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("response_data field not found or invalid type")
	}
	
	return &PDFContext{
		FormResponse:     formResponse,
		FormDefinition:   formDefinition,
		OrganizationInfo: orgInfo,
		Answers:          answers,
		RequestID:        requestID,
		TemplateStore:    o.templateStore,
	}, nil
}

func (o *PDFOrchestrator) getRenderOrder(org *data.Organization, patterns []PatternMetadata) []string {
	// Default order for medical forms
	defaultOrder := []string{
		"patient_demographics",  // Patient info should always be first
		"patient_vitals", 
		"review_of_systems",     // Review of Systems section
		"terms_conditions",      // Full T&C sections with all content
		// "terms_checkbox" removed - redundant with terms_conditions
		"neck_disability_index",
		"oswestry_disability",
		"pain_assessment",
		"body_diagram_2",
		"body_pain_diagram_2",
		"sensation_areas_diagram",  // Added sensation areas diagram
		"insurance_card",
		"signature",
	}
	
	// TODO: Allow organization-specific ordering
	// if org != nil && org.PDFConfiguration != nil {
	//     // Custom ordering would go here
	// }
	
	// Filter to only include detected patterns
	detectedTypes := make(map[string]bool)
	for _, pattern := range patterns {
		detectedTypes[pattern.PatternType] = true
	}
	
	var finalOrder []string
	for _, patternType := range defaultOrder {
		if detectedTypes[patternType] {
			finalOrder = append(finalOrder, patternType)
		}
	}
	
	return finalOrder
}

// renderSections now respects JSON order: traverses survey definition in sequence,
// rendering specialized patterns if present, otherwise falling back to generic fields.
func (o *PDFOrchestrator) renderSections(context *PDFContext, _ []string) (map[string]string, error) {
	// Extract surveyJson for traversal
	surveyJson, ok := context.FormDefinition["surveyJson"].(map[string]interface{})
	if !ok {
		surveyJson = context.FormDefinition // Fallback
	}
	patterns, err := o.detector.DetectPatterns(surveyJson, context.Answers)
	if err != nil {
		return nil, err
	}

	// Index patterns by type for lookup
	patternMap := make(map[string]PatternMetadata)
	for _, pattern := range patterns {
		patternMap[pattern.PatternType] = pattern
	}

	htmlSections := make(map[string]string)

	// Recursive traverse elements in order
	var traverse func(elems []interface{})
	traverse = func(elems []interface{}) {
		for _, elem := range elems {
			elemMap, ok := elem.(map[string]interface{})
			if !ok {
				continue
			}
			elemType, _ := elemMap["type"].(string)
			elemName, _ := elemMap["name"].(string)

			// Try to match against known patterns
			if pattern, exists := patternMap[elemName]; exists {
				html, err := o.registry.Render(pattern.PatternType, pattern, context)
				if err != nil {
					errorBlock := o.registry.generateErrorBlock(RenderError{
						Code:      fmt.Sprintf("RNDR-%s-001", pattern.PatternType),
						Section:   pattern.PatternType,
						Cause:     err,
						RequestID: context.RequestID,
					})
					htmlSections[pattern.PatternType] = errorBlock
				} else {
					htmlSections[pattern.PatternType] = html
				}
			} else {
				// Generic fallback render
				genericHTML := fmt.Sprintf("<div class='generic-field'><strong>%s</strong>: %v</div>",
					elemMap["title"], context.Answers[elemName])
				htmlSections[elemName] = genericHTML
			}

			// Traverse children if panel
			if elemType == "panel" {
				if nested, ok := elemMap["elements"].([]interface{}); ok {
					traverse(nested)
				}
			}
		}
	}

	// Traverse by pages
	if pages, ok := surveyJson["pages"].([]interface{}); ok {
		for _, page := range pages {
			if pageMap, ok := page.(map[string]interface{}); ok {
				if elems, ok := pageMap["elements"].([]interface{}); ok {
					traverse(elems)
				}
			}
		}
	} else if elems, ok := surveyJson["elements"].([]interface{}); ok {
		traverse(elems)
	}

	return htmlSections, nil
}

func (o *PDFOrchestrator) assembleAndGeneratePDF(htmlSections map[string]string, context *PDFContext) ([]byte, error) {
	// Get the render order to maintain section ordering
	// Extract surveyJson for pattern detection (fix for missing form fields bug)
	surveyJson, ok := context.FormDefinition["surveyJson"].(map[string]interface{})
	if !ok {
		surveyJson = context.FormDefinition // Fallback for backward compatibility
	}
	patterns, _ := o.detector.DetectPatterns(surveyJson, context.Answers)
	renderOrder := o.getRenderOrder(context.OrganizationInfo, patterns)
	
	// Combine all sections IN ORDER
	var combinedHTML string
	for _, patternType := range renderOrder {
		if html, exists := htmlSections[patternType]; exists && html != "" {
			combinedHTML += html + "\n"
		}
	}
	
	// Use master layout template
	layoutTmpl, err := o.templateStore.Get("pdf_layout.html")
	if err != nil {
		return nil, fmt.Errorf("failed to get layout template: %w", err)
	}
	
	layoutData := map[string]interface{}{
		"PatientName":    getPatientName(context.Answers),
		"ClinicInfo":     nil, // TODO: Extract from organization
		"GenerationDate": FormatTimestampUSA(),
		"Content":        template.HTML(combinedHTML),
		"RequestID":      context.RequestID,
		"Checksum":       "", // Will be calculated after PDF generation
	}
	
	var htmlBuffer strings.Builder
	err = layoutTmpl.Execute(&htmlBuffer, layoutData)
	if err != nil {
		return nil, fmt.Errorf("failed to execute layout template: %w", err)
	}
	
	// Generate PDF using Gotenberg
	return o.gotenberg.ConvertHTMLToPDF(htmlBuffer.String())
}

func (o *PDFOrchestrator) calculateChecksum(data []byte) string {
	hash := sha256.Sum256(data)
	return fmt.Sprintf("%x", hash)[:16]
}

func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// getPatientName is defined in patient_demographics.go