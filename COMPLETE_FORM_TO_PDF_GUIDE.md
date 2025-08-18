# Complete Form to PDF Implementation Guide
## From SurveyJS Frontend to Backend PDF Generation

This guide documents the complete process of adding a new form field type, from frontend implementation through backend pattern detection to PDF rendering. Based on the actual implementation of the Review of Systems (ROS) feature.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Frontend Implementation](#frontend-implementation)
3. [Backend Pattern Detection](#backend-pattern-detection)
4. [Backend PDF Rendering](#backend-pdf-rendering)
5. [Registration & Wiring](#registration--wiring)
6. [Debugging & Troubleshooting](#debugging--troubleshooting)
7. [Complete Example: Review of Systems](#complete-example-review-of-systems)

## Architecture Overview

The form-to-PDF pipeline follows this flow:

```
Frontend (SurveyJS) → Form Definition (JSON) → Backend Detection → PDF Rendering
```

### Key Principles
1. **Simple Detection**: Use unique panel names or field prefixes for reliable pattern detection
2. **Data-Driven Rendering**: Let the data determine what appears in the PDF
3. **Clinical Accuracy**: Handle medical data with appropriate formatting and terminology

## Frontend Implementation

### Step 1: Create the Form Panel Configuration

For structured medical forms, use native SurveyJS panels rather than custom components:

```typescript
// frontend/src/components/FormBuilder/ReviewOfSystemsPanel.ts
export const reviewOfSystemsPanel = {
  type: 'panel',
  name: 'page_review_of_systems',  // UNIQUE IDENTIFIER for backend detection
  title: 'Review of Systems',
  description: 'Select conditions that apply...',
  elements: [
    {
      type: 'checkbox',
      name: 'ros_constitutional',  // PREFIX PATTERN for field grouping
      title: 'Constitutional',
      choices: ['Fatigue', 'Fever', ...],
      // Special "None of the above" handling
      hasNone: true,
      noneText: '✓ None of the above'
    }
  ]
};
```

**Key Points:**
- Use a unique panel name (`page_review_of_systems`) for detection
- Use consistent field prefixes (`ros_*`) for data extraction
- Leverage SurveyJS's built-in `hasNone` for mutual exclusivity

### Step 2: Register in Form Builder

Add to `frontend/src/components/FormBuilder/FormBuilderContainer.tsx`:

```typescript
import { reviewOfSystemsPanel } from './ReviewOfSystemsPanel';

// In toolbox configuration
const customPanels = [
  reviewOfSystemsPanel,
  // other panels...
];

// Add to toolbox
toolbox.addItem({
  name: 'review-of-systems',
  title: 'Review of Systems',
  category: 'Medical Forms',
  json: reviewOfSystemsPanel
});
```

### Step 3: Configure Conditional Logic (if needed)

For gender-specific sections:

```typescript
{
  type: 'panel',
  name: 'ros_women_only',
  visibleIf: "{sex_at_birth} = 'female'",
  elements: [...]
}
```

## Backend Pattern Detection

### Step 1: Create the Pattern Matcher

In `backend-go/internal/services/pattern_detector.go`:

```go
// ReviewOfSystemsMatcher - matches Review of Systems medical forms
type ReviewOfSystemsMatcher struct{}

func (m *ReviewOfSystemsMatcher) Match(formDefinition, responseData map[string]interface{}) (bool, PatternMetadata) {
    // Simple detection based on unique panel name
    if !DetectReviewOfSystemsPattern(formDefinition) {
        return false, PatternMetadata{}
    }
    
    // Collect all fields with the prefix pattern
    var rosFields []string
    for key := range responseData {
        if strings.HasPrefix(key, "ros_") {
            rosFields = append(rosFields, key)
        }
    }
    
    return true, PatternMetadata{
        PatternType:  "review_of_systems",
        ElementNames: rosFields,
        TemplateData: map[string]interface{}{
            "rosFields": rosFields,
        },
    }
}

func (m *ReviewOfSystemsMatcher) GetPatternType() string { return "review_of_systems" }
func (m *ReviewOfSystemsMatcher) GetPriority() int       { return 4 }
```

### Step 2: Add Detection Helper Function

```go
// DetectReviewOfSystemsPattern checks for the specific panel
func DetectReviewOfSystemsPattern(surveyJSON map[string]interface{}) bool {
    // Check pages array
    if pages, ok := surveyJSON["pages"].([]interface{}); ok {
        for _, pageData := range pages {
            if page, ok := pageData.(map[string]interface{}); ok {
                if hasROSPanel(page["elements"]) {
                    return true
                }
            }
        }
    }
    return false
}

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
        
        // Check for unique panel name
        if name, ok := element["name"].(string); ok {
            if name == "page_review_of_systems" {
                return true
            }
        }
        
        // Recursively check nested elements
        if subElements, ok := element["elements"]; ok {
            if hasROSPanel(subElements) {
                return true
            }
        }
    }
    return false
}
```

### Step 3: Register the Matcher

Add to `NewPatternDetector()` in `pattern_detector.go`:

```go
func NewPatternDetector() *PatternDetector {
    return &PatternDetector{
        matchers: []PatternMatcher{
            // ... existing matchers ...
            &ReviewOfSystemsMatcher{},
        },
    }
}
```

## Backend PDF Rendering

### Step 1: Create the Renderer

Create `backend-go/internal/services/review_of_systems_renderer.go`:

```go
package services

import (
    "bytes"
    "fmt"
    "html"
    "strings"
)

// ReviewOfSystemsRenderer renders Review of Systems data
func ReviewOfSystemsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    var result bytes.Buffer
    
    result.WriteString(`<div class="form-section">`)
    result.WriteString(`<div class="section-title">Review of Systems</div>`)
    
    // Define sections with symptoms for "denies" statements
    rosSections := []struct {
        Title       string
        Fields      []string
        AllSymptoms []string
    }{
        {
            Title:  "Constitutional",
            Fields: []string{"ros_constitutional"},
            AllSymptoms: []string{
                "fatigue", "fever", "chills", "weight changes", ...
            },
        },
        // ... more sections ...
    }
    
    hasAnyConditions := false
    
    // Process each section
    for _, section := range rosSections {
        var sectionContent bytes.Buffer
        hasSectionContent := false
        isNoneSelected := false
        
        for _, fieldName := range section.Fields {
            if value, exists := context.Answers[fieldName]; exists {
                // Check for "None of the above"
                if hasNoneValue(value) {
                    isNoneSelected = true
                    continue
                }
                
                // Format positive findings
                formattedValue := formatROSResponse(fieldName, value)
                if formattedValue != "" {
                    if !hasSectionContent {
                        sectionContent.WriteString(fmt.Sprintf(
                            `<h4>%s</h4>`, 
                            html.EscapeString(section.Title)
                        ))
                        hasSectionContent = true
                    }
                    sectionContent.WriteString(fmt.Sprintf(
                        `<p>• %s</p>`, 
                        html.EscapeString(formattedValue)
                    ))
                    hasAnyConditions = true
                }
            }
        }
        
        // Handle "None of the above" - show denials
        if isNoneSelected && len(section.AllSymptoms) > 0 {
            result.WriteString(`<div style="margin-bottom: 10px;">`)
            result.WriteString(fmt.Sprintf(
                `<h4>%s</h4>`, 
                html.EscapeString(section.Title)
            ))
            result.WriteString(`<p style="font-style: italic;">`)
            result.WriteString(fmt.Sprintf(
                `Patient denies: %s.`, 
                strings.Join(section.AllSymptoms, ", ")
            ))
            result.WriteString(`</p></div>`)
            hasAnyConditions = true
        } else if hasSectionContent {
            result.WriteString(sectionContent.String())
        }
    }
    
    // Show message if no conditions reported
    if !hasAnyConditions {
        result.WriteString(`<div style="padding: 10px; background-color: #f0f8f7;">`)
        result.WriteString(`<p>Patient denies all review of systems symptoms.</p>`)
        result.WriteString(`</div>`)
    }
    
    result.WriteString(`</div>`)
    return result.String(), nil
}

// Helper function to detect "None of the above" selections
func hasNoneValue(value interface{}) bool {
    switch v := value.(type) {
    case []interface{}:
        for _, item := range v {
            itemStr := strings.ToLower(fmt.Sprintf("%v", item))
            if strings.Contains(itemStr, "none of the above") {
                return true
            }
        }
    case string:
        return strings.Contains(strings.ToLower(v), "none")
    }
    return false
}

// Format response values for display
func formatROSResponse(fieldName string, value interface{}) string {
    switch v := value.(type) {
    case []interface{}:
        var conditions []string
        for _, item := range v {
            itemStr := fmt.Sprintf("%v", item)
            if !strings.Contains(strings.ToLower(itemStr), "none") {
                conditions = append(conditions, itemStr)
            }
        }
        return strings.Join(conditions, ", ")
    case string:
        if v != "" && !strings.EqualFold(v, "none") {
            return v
        }
    }
    return ""
}
```

## Registration & Wiring

### Step 1: Register the Renderer

In `backend-go/internal/services/renderer_registry.go`:

```go
func (rr *RendererRegistry) registerRenderers() {
    // ... existing renderers ...
    
    // Register Review of Systems renderer
    rr.renderers["review_of_systems"] = rr.wrapRenderer(ReviewOfSystemsRenderer)
}
```

### Step 2: Add to Render Order

**CRITICAL**: Add to the default render order in `backend-go/internal/services/pdf_orchestrator.go`:

```go
func (o *PDFOrchestrator) getRenderOrder(org *data.Organization, patterns []PatternMetadata) []string {
    defaultOrder := []string{
        "patient_demographics",
        "patient_vitals",
        "review_of_systems",  // ADD THIS LINE
        "terms_conditions",
        // ... other patterns ...
    }
    // ... rest of function
}
```

⚠️ **Common Issue**: Forgetting this step results in a blank PDF section even though detection works!

## Debugging & Troubleshooting

### Issue 1: Pattern Not Detected

**Symptoms**: Pattern doesn't appear in logs
**Debug Steps**:
1. Add logging to the matcher:
```go
fmt.Printf("DEBUG: Checking for ROS panel...\n")
```
2. Verify panel name matches exactly
3. Check JSON structure in browser DevTools

### Issue 2: PDF Section is Blank

**Symptoms**: Pattern detected but PDF shows nothing
**Common Causes**:
1. **Missing from render order** (most common!)
2. Renderer returning empty string
3. Data not in context.Answers

**Debug Steps**:
```go
// In renderer
fmt.Printf("DEBUG: Renderer called with %d fields\n", len(metadata.ElementNames))
fmt.Printf("DEBUG: context.Answers: %v\n", context.Answers)
```

### Issue 3: False Positive Matches

**Example**: Insurance matcher detecting "cardiovascular"
**Solution**: Use more specific detection:

```go
// BAD: Too broad
if strings.Contains(fieldName, "card") { ... }

// GOOD: Specific panel detection
if title == "Insurance Card Information" { ... }
```

### Issue 4: None of the Above Not Working

**Debug Steps**:
1. Check SurveyJS configuration has `hasNone: true`
2. Verify the none value in response data
3. Test `hasNoneValue()` function with actual data

## Complete Example: Review of Systems

### Frontend (`ReviewOfSystemsPanel.ts`)
```typescript
export const reviewOfSystemsPanel = {
  type: 'panel',
  name: 'page_review_of_systems',
  title: 'Review of Systems',
  elements: [
    {
      type: 'checkbox',
      name: 'ros_constitutional',
      title: 'Constitutional',
      choices: [
        'Balance issues', 'Cancer', 'Changes in appetite',
        'Changes in sleep', 'Changes in weight', 'Chills',
        'Dizziness', 'Fatigue', 'Fever', 'Hyperactivity',
        'Tumor', 'Vertigo'
      ],
      hasNone: true,
      noneText: '✓ None of the above'
    },
    // Additional sections...
  ]
};
```

### Backend Detection
```go
type ReviewOfSystemsMatcher struct{}

func (m *ReviewOfSystemsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    if !DetectReviewOfSystemsPattern(formDef) {
        return false, PatternMetadata{}
    }
    
    var rosFields []string
    for key := range responseData {
        if strings.HasPrefix(key, "ros_") {
            rosFields = append(rosFields, key)
        }
    }
    
    return true, PatternMetadata{
        PatternType:  "review_of_systems",
        ElementNames: rosFields,
        TemplateData: map[string]interface{}{"rosFields": rosFields},
    }
}
```

### Backend Rendering
```go
func ReviewOfSystemsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Renders either:
    // 1. Positive findings: "• Fatigue, Fever"
    // 2. Denials: "Patient denies: balance issues, cancer, chills..."
    // 3. Complete denial: "Patient denies all review of systems symptoms."
}
```

## Testing Checklist

- [ ] Frontend: Panel appears in form builder toolbox
- [ ] Frontend: Fields save and load correctly
- [ ] Frontend: "None of the above" deselects other options
- [ ] Backend: Pattern detected in logs
- [ ] Backend: All ros_* fields collected
- [ ] PDF: Positive findings displayed correctly
- [ ] PDF: Denials shown for "None of the above"
- [ ] PDF: Section appears in correct order
- [ ] PDF: Professional clinical formatting

## Best Practices

1. **Use Unique Identifiers**: Panel names like `page_review_of_systems`
2. **Consistent Prefixes**: Field names like `ros_*` for grouping
3. **Simple Detection**: Avoid complex regex when possible
4. **Clinical Language**: Use proper medical terminology in PDFs
5. **Handle Edge Cases**: Empty data, "None of the above", etc.
6. **Add Debug Logging**: Remove before production
7. **Test the Full Flow**: From form creation to PDF generation

## Common Patterns

### Medical Form Sections
- Use panel with unique name for detection
- Group related fields with common prefix
- Handle "None of the above" specially
- Format for clinical documentation

### File Upload Processing
- Use specific panel title for detection
- Process files in backend service
- Extract and validate data
- Store processed results

### Conditional Sections
- Use SurveyJS visibleIf expressions
- Base on demographic data
- Handle missing conditions gracefully

## Next Steps

1. Create your panel configuration
2. Add detection logic
3. Implement renderer
4. Register and wire up
5. Test end-to-end
6. Add to documentation

Remember: The key to success is keeping detection simple and using unique identifiers!