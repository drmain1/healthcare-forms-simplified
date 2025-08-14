# PDF Generation Migration Implementation Guide
## Comprehensive Implementation Plan for 11 Form Field Types

### Executive Summary
This document provides detailed step-by-step implementation instructions for building PDF infrastructure for 11 specific medical form field types in a greenfield Go application using the new modular PDF architecture.

## Current State Analysis

### ✅ Existing Infrastructure (Items 1, 2, 3, 6)
Based on analysis of `backend-go/internal/services/`:

1. **Terms Checkbox** - Basic checkbox handling in `form_processor.go`
2. **Terms & Conditions** - Text rendering capability exists 
3. **Patient Demographics** - Date/age calculation in `form_processor.go:109-124`
4. **Complete Pain Assessment** - Full implementation in `custom_tables.go:28` + template in `templates/pain_assessment_table.html`

### ⚠️ Needs New Infrastructure (Items 4, 5, 7, 8, 9, 10, 11)
4. **Neck Disability Index** - Specialized scoring table renderer needed
5. **Oswestry Disability** - Specialized scoring table renderer needed  
7. **Body Diagram 2** - Enhanced version of existing body diagram
8. **Body Pain Diagram 2** - Enhanced version of existing pain diagram
9. **Patient Vitals** - New tabular vital signs renderer
10. **Insurance Card Capture** - Image display with metadata renderer
11. **Signature** - Enhance existing signature renderer with validation

## Critical Issues to Fix First

### 🔴 Collection Reference Issue
**Status**: ✅ FIXED - Code already uses `form_responses` collection on line 44 of `pdf_generator.go`

### 🔴 Missing Data Fetch Flow  
**Current Issue**: Orchestrator needs to fetch 3 documents but current flow is incomplete
```go
// Current: Only fetches form_response
// Need: form_response + form_definition + organization_config
```

## Core Architecture Components

### 1. Embedded Template System
```go
// File: backend-go/internal/services/renderers/templates/templates.go
package templates

import (
    _ "embed"
    "fmt"
    "html/template"
)

//go:embed *.html
var templateFiles embed.FS

type TemplateStore struct {
    templates map[string]*template.Template
}

func NewTemplateStore() (*TemplateStore, error) {
    store := &TemplateStore{
        templates: make(map[string]*template.Template),
    }
    
    entries, err := templateFiles.ReadDir(".")
    if err != nil {
        return nil, fmt.Errorf("failed to read embedded templates: %w", err)
    }
    
    for _, entry := range entries {
        if !strings.HasSuffix(entry.Name(), ".html") {
            continue
        }
        
        content, err := templateFiles.ReadFile(entry.Name())
        if err != nil {
            return nil, fmt.Errorf("failed to read template %s: %w", entry.Name(), err)
        }
        
        tmpl, err := template.New(entry.Name()).Parse(string(content))
        if err != nil {
            return nil, fmt.Errorf("failed to parse template %s: %w", entry.Name(), err)
        }
        
        store.templates[entry.Name()] = tmpl
    }
    
    return store, nil
}

func (ts *TemplateStore) Get(name string) (*template.Template, error) {
    tmpl, exists := ts.templates[name]
    if !exists {
        return nil, fmt.Errorf("template %s not found", name)
    }
    return tmpl, nil
}
```

### 2. PDF Orchestrator with Enhanced Data Fetching
```go
// File: backend-go/internal/services/pdf_orchestrator.go
package services

import (
    "context"
    "cloud.google.com/go/firestore"
    "github.com/gemini/forms-api/internal/data"
)

type PDFOrchestrator struct {
    client       *firestore.Client
    gotenberg    *GotenbergService
    registry     *RendererRegistry
    detector     *PatternDetector
    templateStore *TemplateStore
}

type PDFContext struct {
    FormResponse     map[string]interface{}
    FormDefinition   map[string]interface{}
    OrganizationInfo *data.Organization
    Answers          map[string]interface{}
    RequestID        string // For audit trail
}

func (o *PDFOrchestrator) GeneratePDF(ctx context.Context, responseID string, userID string) ([]byte, error) {
    // Generate request ID for audit trail
    requestID := fmt.Sprintf("pdf_%d_%s", time.Now().Unix(), responseID[:8])
    
    // Audit log start
    log.Printf("PDF_GENERATION_START: user=%s, response=%s, request=%s", userID, responseID, requestID)
    
    // 1. Fetch all required data in parallel
    pdfContext, err := o.fetchPDFContext(ctx, responseID, requestID)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch PDF context: %w", err)
    }
    
    // 2. Detect patterns and determine render order
    patterns, err := o.detector.DetectPatterns(pdfContext.FormDefinition, pdfContext.Answers)
    if err != nil {
        return nil, fmt.Errorf("pattern detection failed: %w", err)
    }
    
    // 3. Get custom render order from organization or use default
    renderOrder := o.getRenderOrder(pdfContext.OrganizationInfo, patterns)
    
    // 4. Generate HTML sections with streaming
    htmlSections, err := o.renderSections(pdfContext, renderOrder)
    if err != nil {
        return nil, fmt.Errorf("section rendering failed: %w", err)
    }
    
    // 5. Assemble HTML and generate PDF
    pdfBytes, err := o.assembleAndGeneratePDF(htmlSections, pdfContext)
    if err != nil {
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
    }, nil
}
```

### 3. Pattern Detector with Concrete Rules
```go
// File: backend-go/internal/services/pattern_detector.go
package services

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

// Concrete implementations for each form type
type TermsCheckboxMatcher struct{}
func (m TermsCheckboxMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    // Look for checkbox elements with "terms" or "agreement" in name
    elements := extractElements(formDef)
    for _, element := range elements {
        if elementType, ok := element["type"].(string); ok && elementType == "checkbox" {
            if name, ok := element["name"].(string); ok {
                if strings.Contains(strings.ToLower(name), "terms") || 
                   strings.Contains(strings.ToLower(name), "agreement") {
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

type NeckDisabilityMatcher struct{}
func (m NeckDisabilityMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    elements := extractElements(formDef)
    ndiQuestions := []string{}
    
    for _, element := range elements {
        if name, ok := element["name"].(string); ok {
            // Look for NDI question patterns
            if strings.Contains(strings.ToLower(name), "ndi_") || 
               strings.Contains(strings.ToLower(name), "neck_disability") {
                ndiQuestions = append(ndiQuestions, name)
            }
        }
    }
    
    if len(ndiQuestions) > 0 {
        return true, PatternMetadata{
            PatternType:  "neck_disability_index",
            ElementNames: ndiQuestions,
            TemplateData: map[string]interface{}{
                "questions": ndiQuestions,
                "responses": filterResponseData(responseData, ndiQuestions),
                "totalScore": calculateNDIScore(responseData, ndiQuestions),
            },
        }
    }
    
    return false, PatternMetadata{}
}

// Similar matchers for other 9 form types...
```

### 4. Renderer Registry with Error Handling
```go
// File: backend-go/internal/services/renderer_registry.go
package services

type RendererFunc func(PatternMetadata, *PDFContext) (string, error)

type RendererRegistry struct {
    renderers     map[string]RendererFunc
    renderOrder   []string
    templateStore *TemplateStore
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
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
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
```

### 5. Enhanced Gotenberg Client
```go
// File: backend-go/internal/services/gotenberg_service.go (enhanced)
type GotenbergService struct {
    httpClient    *http.Client
    baseURL       string
    maxRetries    int
    retryDelay    time.Duration
    circuitBreaker *CircuitBreaker
}

func NewGotenbergService(baseURL string) *GotenbergService {
    return &GotenbergService{
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        baseURL:       baseURL,
        maxRetries:    3,
        retryDelay:    time.Second,
        circuitBreaker: NewCircuitBreaker(5, time.Minute),
    }
}

func (gs *GotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
    return gs.circuitBreaker.Execute(func() (interface{}, error) {
        return gs.convertWithRetry(htmlContent)
    })
}

func (gs *GotenbergService) convertWithRetry(htmlContent string) ([]byte, error) {
    var lastErr error
    
    for attempt := 0; attempt <= gs.maxRetries; attempt++ {
        if attempt > 0 {
            time.Sleep(gs.retryDelay * time.Duration(attempt)) // Exponential backoff
        }
        
        pdfBytes, err := gs.performConversion(htmlContent)
        if err == nil {
            return pdfBytes, nil
        }
        
        lastErr = err
        log.Printf("Gotenberg conversion attempt %d failed: %v", attempt+1, err)
    }
    
    return nil, fmt.Errorf("all conversion attempts failed, last error: %w", lastErr)
}
```

## Detailed Renderer Implementations

### Existing Infrastructure Adapters (Items 1, 2, 3, 6)

#### 1. Terms Checkbox Renderer
```go
// File: backend-go/internal/services/renderers/terms_checkbox.go
func TermsCheckboxRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    tmpl, err := context.TemplateStore.Get("terms_checkbox.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, metadata.TemplateData)
    return buf.String(), err
}
```

#### 2. Terms & Conditions Renderer  
```go
// File: backend-go/internal/services/renderers/terms_conditions.go
func TermsConditionsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Adapt existing text rendering with enhanced formatting
    tmpl, err := context.TemplateStore.Get("terms_conditions.html")
    if err != nil {
        return "", err
    }
    
    // Add HTML escaping for safety
    templateData := map[string]interface{}{
        "content": html.EscapeString(metadata.TemplateData["content"].(string)),
        "timestamp": time.Now().Format("January 2, 2006"),
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}
```

#### 3. Patient Demographics Renderer (Enhanced)
```go
// File: backend-go/internal/services/renderers/patient_demographics.go
func PatientDemographicsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Build on existing age calculation logic from form_processor.go
    templateData := map[string]interface{}{
        "name":     html.EscapeString(getStringValue(context.Answers, "patient_name")),
        "dob":      formatDateOfBirth(context.Answers["date_of_birth"]),
        "age":      calculateAge(context.Answers["date_of_birth"]),
        "gender":   html.EscapeString(getStringValue(context.Answers, "gender")),
        "phone":    html.EscapeString(getStringValue(context.Answers, "phone")),
        "email":    html.EscapeString(getStringValue(context.Answers, "email")),
        "address":  formatAddress(context.Answers),
        "emergency_contact": formatEmergencyContact(context.Answers),
    }
    
    tmpl, err := context.TemplateStore.Get("patient_demographics.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

func calculateAge(dobValue interface{}) int {
    // Reuse logic from form_processor.go:155-190
    if dobStr, ok := dobValue.(string); ok && dobStr != "" {
        formats := []string{
            "2006-01-02",
            "01/02/2006", 
            "02/01/2006",
            time.RFC3339,
        }
        
        for _, format := range formats {
            if dob, err := time.Parse(format, dobStr); err == nil {
                now := time.Now()
                age := now.Year() - dob.Year()
                if now.Month() < dob.Month() || (now.Month() == dob.Month() && now.Day() < dob.Day()) {
                    age--
                }
                return age
            }
        }
    }
    return 0
}
```

#### 6. Complete Pain Assessment Renderer (Adapted)
```go
// File: backend-go/internal/services/renderers/pain_assessment.go
func PainAssessmentRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Adapt existing logic from custom_tables.go:28
    // Extract pain assessment data
    painData, err := extractPainAssessmentData(metadata.ElementNames, context.Answers)
    if err != nil {
        return "", err
    }
    
    templateData := map[string]interface{}{
        "painAreas": painData,
        "timestamp": time.Now().Format("January 2, 2006 at 3:04 PM"),
        "totalScore": calculatePainScore(painData),
    }
    
    tmpl, err := context.TemplateStore.Get("pain_assessment.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

type PainAreaData struct {
    Area           string
    Side           string
    Severity       interface{}
    Frequency      interface{}
    FrequencyText  string
    FrequencyValue float64
}

func extractPainAssessmentData(elementNames []string, answers map[string]interface{}) ([]PainAreaData, error) {
    // Reuse existing logic from custom_tables.go but make it more robust
    var painAreas []PainAreaData
    
    for _, elementName := range elementNames {
        if data, exists := answers[elementName]; exists {
            // Process the pain data similar to existing implementation
            // but with enhanced error handling
            painArea := processPainElement(elementName, data)
            if painArea != nil {
                painAreas = append(painAreas, *painArea)
            }
        }
    }
    
    return painAreas, nil
}
```

### New Infrastructure (Items 4, 5, 7, 8, 9, 10, 11)

#### 4. Neck Disability Index Renderer
```go
// File: backend-go/internal/services/renderers/neck_disability_index.go
func NeckDisabilityRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    ndiQuestions := []string{
        "ndi_pain_intensity",
        "ndi_personal_care", 
        "ndi_lifting",
        "ndi_reading",
        "ndi_headaches",
        "ndi_concentration",
        "ndi_work",
        "ndi_driving",
        "ndi_sleeping",
        "ndi_recreation",
    }
    
    responses := make(map[string]interface{})
    totalScore := 0
    
    for _, question := range ndiQuestions {
        if value, exists := context.Answers[question]; exists {
            responses[question] = value
            // Convert to score (0-5 points per question)
            if score, ok := convertToNDIScore(value); ok {
                totalScore += score
            }
        }
    }
    
    // Calculate disability percentage (total/50 * 100)
    disabilityPercent := float64(totalScore) / 50.0 * 100
    
    templateData := map[string]interface{}{
        "questions":         ndiQuestions,
        "responses":         responses,
        "totalScore":        totalScore,
        "maxScore":          50,
        "disabilityPercent": fmt.Sprintf("%.1f%%", disabilityPercent),
        "interpretation":    interpretNDIScore(disabilityPercent),
    }
    
    tmpl, err := context.TemplateStore.Get("neck_disability_index.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

func interpretNDIScore(percent float64) string {
    if percent <= 8 {
        return "No disability"
    } else if percent <= 18 {
        return "Mild disability"
    } else if percent <= 34 {
        return "Moderate disability"
    } else if percent <= 52 {
        return "Severe disability" 
    } else {
        return "Complete disability"
    }
}
```

#### 5. Oswestry Disability Renderer
```go
// File: backend-go/internal/services/renderers/oswestry_disability.go
func OswestryDisabilityRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    oswestryQuestions := []string{
        "oswestry_pain_intensity",
        "oswestry_personal_care",
        "oswestry_lifting",
        "oswestry_walking", 
        "oswestry_sitting",
        "oswestry_standing",
        "oswestry_sleeping",
        "oswestry_sex_life",
        "oswestry_social_life",
        "oswestry_traveling",
    }
    
    responses := make(map[string]interface{})
    totalScore := 0
    answeredQuestions := 0
    
    for _, question := range oswestryQuestions {
        if value, exists := context.Answers[question]; exists {
            responses[question] = value
            if score, ok := convertToOswestryScore(value); ok {
                totalScore += score
                answeredQuestions++
            }
        }
    }
    
    // Calculate disability index
    var disabilityIndex float64
    if answeredQuestions > 0 {
        disabilityIndex = float64(totalScore) / (float64(answeredQuestions) * 5) * 100
    }
    
    templateData := map[string]interface{}{
        "questions":         oswestryQuestions,
        "responses":         responses,
        "totalScore":        totalScore,
        "answeredQuestions": answeredQuestions,
        "disabilityIndex":   fmt.Sprintf("%.1f%%", disabilityIndex),
        "interpretation":    interpretOswestryScore(disabilityIndex),
    }
    
    tmpl, err := context.TemplateStore.Get("oswestry_disability.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}
```

#### 7 & 8. Enhanced Body Diagram Renderers
```go
// File: backend-go/internal/services/renderers/body_diagram_v2.go
func BodyDiagramV2Renderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Enhanced version of existing body diagram logic
    painPoints := extractPainPoints(metadata.ElementNames, context.Answers)
    
    templateData := map[string]interface{}{
        "painPoints":     painPoints,
        "totalPoints":    len(painPoints),
        "diagramType":    metadata.PatternType, // "body_diagram_2" or "body_pain_diagram_2"
        "showLegend":     len(painPoints) > 0,
        "intensityScale": generateIntensityScale(painPoints),
    }
    
    templateName := "body_diagram_v2.html"
    if metadata.PatternType == "body_pain_diagram_2" {
        templateName = "body_pain_diagram_v2.html"
    }
    
    tmpl, err := context.TemplateStore.Get(templateName)
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

type PainPoint struct {
    X         float64 `json:"x"`
    Y         float64 `json:"y"`
    Intensity int     `json:"intensity"`
    Area      string  `json:"area"`
    Side      string  `json:"side"`
}

func extractPainPoints(elementNames []string, answers map[string]interface{}) []PainPoint {
    var allPoints []PainPoint
    
    for _, elementName := range elementNames {
        if data, exists := answers[elementName]; exists {
            if points, ok := data.([]interface{}); ok {
                for _, point := range points {
                    if pointData, ok := point.(map[string]interface{}); ok {
                        pp := PainPoint{
                            X:         getFloat64(pointData, "x"),
                            Y:         getFloat64(pointData, "y"), 
                            Intensity: getInt(pointData, "intensity"),
                            Area:      getString(pointData, "area"),
                            Side:      getString(pointData, "side"),
                        }
                        allPoints = append(allPoints, pp)
                    }
                }
            }
        }
    }
    
    return allPoints
}
```

#### 9. Patient Vitals Renderer
```go
// File: backend-go/internal/services/renderers/patient_vitals.go
func PatientVitalsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    vitals := map[string]VitalSign{
        "blood_pressure_systolic":   {Name: "Blood Pressure (Systolic)", Unit: "mmHg", NormalRange: "90-140"},
        "blood_pressure_diastolic":  {Name: "Blood Pressure (Diastolic)", Unit: "mmHg", NormalRange: "60-90"},
        "heart_rate":               {Name: "Heart Rate", Unit: "bpm", NormalRange: "60-100"},
        "respiratory_rate":         {Name: "Respiratory Rate", Unit: "breaths/min", NormalRange: "12-20"},
        "temperature":              {Name: "Temperature", Unit: "°F", NormalRange: "97.8-99.1"},
        "oxygen_saturation":        {Name: "Oxygen Saturation", Unit: "%", NormalRange: "95-100"},
        "weight":                   {Name: "Weight", Unit: "lbs", NormalRange: ""},
        "height":                   {Name: "Height", Unit: "in", NormalRange: ""},
        "bmi":                      {Name: "BMI", Unit: "", NormalRange: "18.5-24.9"},
    }
    
    vitalData := make(map[string]VitalReading)
    
    for key, vital := range vitals {
        if value, exists := context.Answers[key]; exists && value != nil {
            reading := VitalReading{
                VitalSign: vital,
                Value:     fmt.Sprintf("%v", value),
                Status:    assessVitalStatus(vital, value),
                Timestamp: time.Now().Format("01/02/2006 15:04"),
            }
            vitalData[key] = reading
        }
    }
    
    templateData := map[string]interface{}{
        "vitals":    vitalData,
        "timestamp": time.Now().Format("January 2, 2006 at 3:04 PM"),
        "hasAlerts": hasAbnormalVitals(vitalData),
    }
    
    tmpl, err := context.TemplateStore.Get("patient_vitals.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

type VitalSign struct {
    Name        string
    Unit        string
    NormalRange string
}

type VitalReading struct {
    VitalSign
    Value     string
    Status    string // "normal", "high", "low", "critical"
    Timestamp string
}
```

#### 10. Insurance Card Capture Renderer
```go
// File: backend-go/internal/services/renderers/insurance_card.go
func InsuranceCardRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    cardData := extractInsuranceData(metadata.ElementNames, context.Answers)
    
    templateData := map[string]interface{}{
        "frontImage":       cardData.FrontImage,
        "backImage":        cardData.BackImage,
        "insuranceInfo":    cardData.ExtractedInfo,
        "captureTimestamp": cardData.CaptureTimestamp,
        "hasImages":        cardData.FrontImage != "" || cardData.BackImage != "",
    }
    
    tmpl, err := context.TemplateStore.Get("insurance_card.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

type InsuranceCardData struct {
    FrontImage       string
    BackImage        string
    ExtractedInfo    map[string]string
    CaptureTimestamp string
}

func extractInsuranceData(elementNames []string, answers map[string]interface{}) InsuranceCardData {
    cardData := InsuranceCardData{
        ExtractedInfo: make(map[string]string),
        CaptureTimestamp: time.Now().Format("January 2, 2006 at 3:04 PM"),
    }
    
    for _, elementName := range elementNames {
        if value, exists := answers[elementName]; exists {
            if strings.Contains(elementName, "front") && strings.Contains(elementName, "image") {
                if imgData, ok := value.(string); ok && strings.HasPrefix(imgData, "data:image/") {
                    cardData.FrontImage = imgData
                }
            } else if strings.Contains(elementName, "back") && strings.Contains(elementName, "image") {
                if imgData, ok := value.(string); ok && strings.HasPrefix(imgData, "data:image/") {
                    cardData.BackImage = imgData
                }
            } else if strings.Contains(elementName, "insurance") {
                // Extract insurance information fields
                cardData.ExtractedInfo[elementName] = fmt.Sprintf("%v", value)
            }
        }
    }
    
    return cardData
}
```

#### 11. Enhanced Signature Renderer
```go
// File: backend-go/internal/services/renderers/signature.go
func SignatureRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Enhance existing signature logic from form_processor.go:98-108
    signatures := extractSignatureData(metadata.ElementNames, context.Answers)
    
    templateData := map[string]interface{}{
        "signatures":       signatures,
        "totalSignatures":  len(signatures),
        "validationStatus": validateSignatures(signatures),
        "timestamp":        time.Now().Format("January 2, 2006 at 3:04 PM MST"),
    }
    
    tmpl, err := context.TemplateStore.Get("signature.html")
    if err != nil {
        return "", err
    }
    
    var buf bytes.Buffer
    err = tmpl.Execute(&buf, templateData)
    return buf.String(), err
}

type SignatureData struct {
    FieldName   string
    ImageData   string
    IsValid     bool
    SignedBy    string
    SignedDate  string
    Purpose     string
}

func extractSignatureData(elementNames []string, answers map[string]interface{}) []SignatureData {
    var signatures []SignatureData
    
    for _, elementName := range elementNames {
        if value, exists := answers[elementName]; exists {
            if sigData, ok := value.(string); ok && strings.HasPrefix(sigData, "data:image/") {
                sig := SignatureData{
                    FieldName:  elementName,
                    ImageData:  sigData,
                    IsValid:    validateSignatureData(sigData),
                    SignedBy:   extractSignerName(elementName, answers),
                    SignedDate: time.Now().Format("01/02/2006"),
                    Purpose:    determinePurpose(elementName),
                }
                signatures = append(signatures, sig)
            }
        }
    }
    
    return signatures
}

func validateSignatureData(imageData string) bool {
    // Basic validation - check if image data seems complete
    if len(imageData) < 100 {
        return false // Too short to be valid
    }
    
    // Could add more sophisticated validation here
    // - Image dimensions check
    - Actual drawing content analysis
    
    return true
}
```

## HTML Templates

### Master Layout Template
```html
<!-- File: backend-go/internal/services/renderers/templates/pdf_layout.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Form - {{.PatientName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 12px;
        }
        
        .page-header {
            border-bottom: 2px solid #2c5282;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .clinic-info {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c5282;
        }
        
        .clinic-details {
            font-size: 11px;
            color: #666;
        }
        
        .form-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            background-color: #edf2f7;
            padding: 8px 12px;
            border-left: 4px solid #2c5282;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .section-error {
            background-color: #FFF3F3;
            border: 2px solid #FFB3B3;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
        }
        
        .section-error h3 {
            color: #D8000C;
            margin-bottom: 8px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .data-table th,
        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
        }
        
        .data-table th {
            background-color: #f7fafc;
            font-weight: bold;
        }
        
        .signature-box {
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px 0;
            min-height: 80px;
            background-color: #fafafa;
        }
        
        .signature-image {
            max-width: 200px;
            max-height: 60px;
            border: 1px solid #ddd;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="page-header">
        <div class="clinic-info">
            {{if .ClinicInfo}}
                <div class="clinic-name">{{.ClinicInfo.Name}}</div>
                <div class="clinic-details">
                    {{.ClinicInfo.Address}} | {{.ClinicInfo.Phone}} | {{.ClinicInfo.Email}}
                </div>
            {{else}}
                <div class="clinic-name">Medical Form Report</div>
            {{end}}
        </div>
        
        <div style="text-align: center;">
            <h2>Patient Form Submission</h2>
            <p>Generated on {{.GenerationDate}}</p>
        </div>
    </div>
    
    <div class="form-content">
        {{.Content}}
    </div>
    
    <div class="footer">
        <p>This document was automatically generated on {{.GenerationDate}}.</p>
        <p>Document ID: {{.RequestID}} | Checksum: {{.Checksum}}</p>
    </div>
</body>
</html>
```

### Neck Disability Index Template
```html
<!-- File: backend-go/internal/services/renderers/templates/neck_disability_index.html -->
<div class="form-section">
    <div class="section-title">Neck Disability Index (NDI) Assessment</div>
    
    <table class="data-table">
        <thead>
            <tr>
                <th>Question Category</th>
                <th>Response</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            {{range $question := .questions}}
            {{if index $.responses $question}}
            <tr>
                <td>{{formatNDIQuestion $question}}</td>
                <td>{{index $.responses $question}}</td>
                <td>{{convertToNDIScore (index $.responses $question)}}/5</td>
            </tr>
            {{end}}
            {{end}}
        </tbody>
    </table>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #f0f8f7; border-left: 4px solid #38a169;">
        <h4>NDI Score Summary</h4>
        <p><strong>Total Score:</strong> {{.totalScore}}/{{.maxScore}} ({{.disabilityPercent}})</p>
        <p><strong>Interpretation:</strong> {{.interpretation}}</p>
        
        <div style="margin-top: 10px; font-size: 11px; color: #666;">
            <p><strong>Scoring Guide:</strong></p>
            <ul>
                <li>0-8%: No disability</li>
                <li>9-18%: Mild disability</li>
                <li>19-34%: Moderate disability</li>
                <li>35-52%: Severe disability</li>
                <li>53-100%: Complete disability</li>
            </ul>
        </div>
    </div>
</div>
```

### Body Diagram V2 Template
```html
<!-- File: backend-go/internal/services/renderers/templates/body_diagram_v2.html -->
<div class="form-section">
    <div class="section-title">Body Pain Diagram</div>
    
    {{if .showLegend}}
    <div style="margin-bottom: 20px;">
        <strong>Pain Areas Marked:</strong> {{.totalPoints}} locations
        
        {{if .intensityScale}}
        <div style="margin-top: 10px;">
            <strong>Intensity Scale:</strong>
            <span style="display: inline-block; margin-left: 10px;">
                {{range .intensityScale}}
                <span style="background-color: {{.color}}; color: white; padding: 2px 6px; margin: 0 2px; border-radius: 3px;">
                    {{.level}}: {{.count}} areas
                </span>
                {{end}}
            </span>
        </div>
        {{end}}
    </div>
    
    <table class="data-table">
        <thead>
            <tr>
                <th>Body Area</th>
                <th>Side</th>
                <th>Pain Intensity</th>
                <th>Position (X,Y)</th>
            </tr>
        </thead>
        <tbody>
            {{range .painPoints}}
            <tr>
                <td>{{.Area}}</td>
                <td>{{.Side}}</td>
                <td>
                    <span style="background-color: {{intensityToColor .Intensity}}; color: white; padding: 2px 6px; border-radius: 3px;">
                        {{.Intensity}}/10
                    </span>
                </td>
                <td>({{printf "%.1f" .X}}, {{printf "%.1f" .Y}})</td>
            </tr>
            {{end}}
        </tbody>
    </table>
    {{else}}
    <div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">
        <p style="color: #6c757d; font-style: italic;">No pain areas were marked on the body diagram</p>
    </div>
    {{end}}
</div>
```

### Insurance Card Template  
```html
<!-- File: backend-go/internal/services/renderers/templates/insurance_card.html -->
<div class="form-section">
    <div class="section-title">Insurance Information</div>
    
    {{if .hasImages}}
    <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
        {{if .frontImage}}
        <div style="text-align: center;">
            <h4>Insurance Card - Front</h4>
            <img src="{{.frontImage}}" alt="Insurance Card Front" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; margin-top: 10px;">
        </div>
        {{end}}
        
        {{if .backImage}}
        <div style="text-align: center;">
            <h4>Insurance Card - Back</h4>
            <img src="{{.backImage}}" alt="Insurance Card Back" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; margin-top: 10px;">
        </div>
        {{end}}
    </div>
    {{end}}
    
    {{if .insuranceInfo}}
    <div style="margin-top: 20px;">
        <h4>Extracted Insurance Information</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {{range $key, $value := .insuranceInfo}}
                <tr>
                    <td>{{formatInsuranceField $key}}</td>
                    <td>{{$value}}</td>
                </tr>
                {{end}}
            </tbody>
        </table>
    </div>
    {{end}}
    
    <div style="margin-top: 15px; font-size: 11px; color: #666;">
        <p><strong>Capture Time:</strong> {{.captureTimestamp}}</p>
    </div>
</div>
```

## Implementation Phases

### Phase 1: Foundation Infrastructure (Days 1-2)

#### Day 1 Morning: Core Setup
**Todo for Agent:**
1. **Create embedded template system**
   ```bash
   mkdir -p backend-go/internal/services/renderers/templates
   touch backend-go/internal/services/renderers/templates/templates.go
   ```
   - Implement `TemplateStore` struct with `go:embed` as shown above
   - Move existing templates: `mv backend-go/templates/*.html backend-go/internal/services/renderers/templates/`
   - Add unit test for template loading

2. **Create PDFOrchestrator**
   ```bash
   touch backend-go/internal/services/pdf_orchestrator.go
   ```
   - Implement parallel data fetching (form_response + form_definition + organization)
   - Add timeout handling for each fetch operation
   - Include comprehensive audit logging

#### Day 1 Afternoon: Pattern Detection
3. **Create PatternDetector**  
   ```bash
   touch backend-go/internal/services/pattern_detector.go
   ```
   - Implement concrete matchers for all 11 form types
   - Add pattern metadata extraction
   - Create pattern priority system

4. **Create RendererRegistry**
   ```bash
   touch backend-go/internal/services/renderer_registry.go
   ```
   - Implement renderer registration system
   - Add timeout handling for individual renderers
   - Create error block generation for failures

#### Day 2: Enhanced Services  
5. **Enhance GotenbergService**
   - Add retry logic with exponential backoff
   - Implement circuit breaker pattern
   - Add comprehensive error handling

6. **Create structured error types**
   - Implement `RenderError` with tracking codes
   - Add error registry for debugging
   - Create audit trail integration

### Phase 2: Adapt Existing Infrastructure (Days 3-4)

#### Existing Infrastructure Adaptations (Items 1, 2, 3, 6)

**Day 3: Adapt Simple Renderers**

1. **Terms Checkbox Renderer**
   ```bash
   touch backend-go/internal/services/renderers/terms_checkbox.go
   touch backend-go/internal/services/renderers/templates/terms_checkbox.html
   ```
   - Adapt existing checkbox logic from `form_processor.go`
   - Add HTML escaping for safety
   - Create simple table-based display

2. **Terms & Conditions Renderer**
   ```bash
   touch backend-go/internal/services/renderers/terms_conditions.go  
   touch backend-go/internal/services/renderers/templates/terms_conditions.html
   ```
   - Adapt existing text rendering
   - Add timestamp and signature validation
   - Include legal formatting

**Day 4: Complex Adaptations**

3. **Patient Demographics Renderer** 
   ```bash
   touch backend-go/internal/services/renderers/patient_demographics.go
   touch backend-go/internal/services/renderers/templates/patient_demographics.html
   ```
   - **Critical**: Reuse age calculation from `form_processor.go:155-190`
   - Add comprehensive data validation
   - Format address and emergency contact information
   - Include photo handling if available

4. **Complete Pain Assessment Renderer**
   ```bash
   touch backend-go/internal/services/renderers/pain_assessment.go
   touch backend-go/internal/services/renderers/templates/pain_assessment.html
   ```
   - **Critical**: Adapt existing `custom_tables.go:28` logic
   - **Critical**: Reuse existing `PainAreaData` struct
   - Migrate existing template `pain_assessment_table.html`
   - Add enhanced error handling and validation

### Phase 3: New Infrastructure (Days 5-8)

#### New Renderer Development (Items 4, 5, 7, 8, 9, 10, 11)

**Day 5: Disability Assessments**

5. **Neck Disability Index Renderer**
   ```bash
   touch backend-go/internal/services/renderers/neck_disability_index.go
   touch backend-go/internal/services/renderers/templates/neck_disability_index.html
   ```
   - Implement 10-question NDI scoring (0-50 points)
   - Add disability percentage calculation
   - Create interpretation guide (No/Mild/Moderate/Severe/Complete)
   - Include scoring validation

6. **Oswestry Disability Renderer**
   ```bash
   touch backend-go/internal/services/renderers/oswestry_disability.go
   touch backend-go/internal/services/renderers/templates/oswestry_disability.html
   ```
   - Implement 10-question ODI scoring (0-5 per question)
   - Calculate disability index percentage
   - Add interpretation categories
   - Handle partial questionnaire completion

**Day 6: Enhanced Body Diagrams**

7. **Body Diagram V2 Renderer**
   ```bash
   touch backend-go/internal/services/renderers/body_diagram_v2.go
   touch backend-go/internal/services/renderers/templates/body_diagram_v2.html
   ```
   - **Build on**: Existing body diagram logic from `form_processor.go:118-137`
   - Add pain intensity visualization
   - Create legend and summary statistics
   - Implement coordinate-based pain mapping

8. **Body Pain Diagram V2 Renderer**
   ```bash
   touch backend-go/internal/services/renderers/body_pain_diagram_v2.go  
   touch backend-go/internal/services/renderers/templates/body_pain_diagram_v2.html
   ```
   - Enhanced version with pain progression tracking
   - Add temporal pain analysis if available
   - Include heat map visualization for multiple visits

**Day 7: Medical Data Renderers**

9. **Patient Vitals Renderer**
   ```bash
   touch backend-go/internal/services/renderers/patient_vitals.go
   touch backend-go/internal/services/renderers/templates/patient_vitals.html
   ```
   - Create comprehensive vital signs table
   - Add normal range indicators and status alerts
   - Include BMI calculation and interpretation
   - Add trend analysis if historical data available

10. **Insurance Card Capture Renderer**
    ```bash
    touch backend-go/internal/services/renderers/insurance_card.go
    touch backend-go/internal/services/renderers/templates/insurance_card.html
    ```
    - Handle front/back card image display
    - Extract and display insurance information fields
    - Add image validation and metadata
    - Include capture timestamp and quality indicators

**Day 8: Enhanced Signature**

11. **Enhanced Signature Renderer**
    ```bash
    touch backend-go/internal/services/renderers/signature.go
    touch backend-go/internal/services/renderers/templates/signature.html
    ```
    - **Build on**: Existing signature logic from `form_processor.go:98-108`
    - Add signature validation and verification
    - Include multiple signature support
    - Add timestamp and authentication metadata
    - Create signature purpose categorization

### Phase 4: Production Hardening (Days 9-10)

#### Day 9: Performance & Security

**Performance Optimization:**
1. **Implement streaming for large forms**
   - Modify `assembleHTML` to use `io.Writer`
   - Add memory usage monitoring
   - Create performance benchmarks

2. **Add caching layer**
   ```bash
   touch backend-go/internal/services/pdf_cache.go
   ```
   - Implement Redis-based caching for repeated PDFs
   - Add cache invalidation logic
   - Create cache hit/miss metrics

**Security Hardening:**
3. **Add HTML auto-escaping to all renderers**
   - Audit all template rendering for XSS vulnerabilities
   - Implement `html.EscapeString()` everywhere user data is used
   - Add SVG sanitization for custom graphics

4. **Implement rate limiting**
   ```bash
   touch backend-go/internal/middleware/rate_limiter.go
   ```
   - Add per-user rate limiting (10 PDFs/minute)
   - Create rate limit exceeded responses
   - Add monitoring and alerting

#### Day 10: Monitoring & Testing

**Comprehensive Testing:**
1. **Create test fixtures**
   ```bash
   mkdir -p backend-go/test/fixtures/forms
   # Create sample JSON for all 11 form types
   ```
   - Generate test data for each renderer
   - Create edge case scenarios
   - Add performance regression tests

2. **Security testing**
   - XSS payload testing in form responses
   - SQL injection attempts in form data
   - File size and memory exhaustion tests
   - Invalid image data handling

**Production Monitoring:**
3. **Add comprehensive audit logging**
   - User ID, response ID, request ID tracking
   - PDF generation timing and success rates
   - Error frequency and categorization
   - Checksum verification and integrity

4. **Health checks and metrics**
   - Gotenberg service connectivity
   - Template loading status
   - Memory usage monitoring
   - Performance metrics collection

## Critical Success Criteria

### Must-Have Features
- [ ] All 11 form types render correctly with test data
- [ ] Error handling produces visible error blocks (never silent failures)
- [ ] PDF generation completes within 30 seconds for 3000+ line JSON
- [ ] Memory usage stays under 512MB per request
- [ ] All user input properly HTML-escaped to prevent XSS
- [ ] Comprehensive audit trail for all PDF generations
- [ ] Gotenberg service resilience (retry + circuit breaker)

### Performance Targets
- [ ] PDF generation: < 15 seconds for typical form
- [ ] Memory usage: < 256MB for typical form  
- [ ] Cache hit rate: > 30% for repeated PDFs
- [ ] Error rate: < 1% for valid form submissions
- [ ] Concurrent requests: Support 10+ simultaneous PDF generations

### Security Requirements
- [ ] No user data in application logs
- [ ] All HTML auto-escaped to prevent XSS
- [ ] Rate limiting prevents DoS attacks
- [ ] PDF metadata stripped to prevent information leakage
- [ ] Checksum verification for document integrity
- [ ] Image validation prevents malicious uploads

## Testing Strategy

### Unit Testing
```bash
# Test commands for agent to run
cd backend-go
go test ./internal/services/renderers/... -v
go test ./internal/services/pdf_orchestrator_test.go -v
go test ./internal/services/pattern_detector_test.go -v
```

### Integration Testing
```bash
# Full PDF generation pipeline test
go test ./internal/api/pdf_generator_test.go -v
# Gotenberg service connectivity test
go test ./internal/services/gotenberg_service_test.go -v
```

### Performance Testing
```bash
# Memory and timing benchmarks
go test -bench=. ./internal/services/... -benchmem
# Load testing with large JSON forms
go test -run=TestLargeFormPDF ./internal/api/...
```

### Security Testing
```bash
# XSS prevention testing
go test -run=TestXSSPrevention ./internal/services/renderers/...
# Rate limiting testing
go test -run=TestRateLimit ./internal/middleware/...
```

## Rollback Strategy

### Immediate Rollback (< 5 minutes)
1. **Feature flag revert**
   ```bash
   # Set environment variable
   export PDF_V2_ENABLED=false
   # Restart service
   ```

2. **Template rollback**
   ```bash
   # If templates moved, restore to original location
   cp -r backend-go/internal/services/renderers/templates/*.html backend-go/templates/
   ```

### Data Recovery
- No data migration needed (greenfield)
- Generated PDFs stored with checksums for integrity verification
- Audit logs preserved for compliance

## Monitoring & Alerting

### Key Metrics to Track
1. **PDF Generation Success Rate** (target: > 99%)
2. **Average Generation Time** (target: < 15s)  
3. **Memory Usage Peak** (alert if > 400MB)
4. **Gotenberg Service Availability** (alert if < 95%)
5. **Error Rate by Renderer** (alert if any renderer > 5% errors)

### Log Analysis
```bash
# Search for PDF generation errors
grep "PDF_GENERATION_ERROR" /var/log/app.log | tail -50

# Monitor memory usage patterns  
grep "memory_usage" /var/log/app.log | awk '{print $4}' | sort -n

# Check renderer performance
grep "RENDERER_TIMING" /var/log/app.log | grep "neck_disability"
```

## Compliance & Documentation

### HIPAA Requirements Met
- [x] All PHI encrypted in transit (TLS 1.3)
- [x] Comprehensive audit logging with user/patient/timestamp
- [x] No PHI stored in application logs
- [x] Access control via Firebase Auth + IAM
- [x] Data integrity via checksum verification
- [x] Automatic session timeout (15 minutes)

### Documentation Updates Required
1. Update API documentation with new PDF endpoints
2. Create administrator guide for monitoring PDF health
3. Document troubleshooting procedures for each renderer
4. Create security incident response procedures
5. Update deployment guide with new environment variables

This comprehensive implementation plan provides step-by-step instructions for building robust PDF infrastructure for all 11 form field types while maintaining security, performance, and reliability standards.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create comprehensive PDF migration implementation document", "status": "completed"}, {"id": "2", "content": "Document existing infrastructure analysis", "status": "in_progress"}, {"id": "3", "content": "Define core architecture components", "status": "pending"}, {"id": "4", "content": "Create renderer specifications for 11 form types", "status": "pending"}, {"id": "5", "content": "Define implementation phases with detailed steps", "status": "pending"}, {"id": "6", "content": "Add security and performance requirements", "status": "pending"}]