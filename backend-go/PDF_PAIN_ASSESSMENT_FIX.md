# PDF Pain Assessment Fix Instructions

## Problem Summary
The pain assessment form is not generating PDF content because the pattern detector receives the wrong data structure level. The detector gets `{surveyJson: {...}, title: "cpa", ...}` but expects `{pages: [...]}`.

## Current State
- ✅ Body diagrams (BodyDiagram2, BodyPainDiagram) work in PDF generation
- ✅ Distroless container with embedded templates works
- ✅ **FIXED**: Pattern detection now extracts surveyJson correctly from form definition

## Debug Evidence
```
DEBUG: Form definition survey JSON: map[surveyJson:map[pages:[...] title:] ...]
DEBUG: Response answers keys: [has_neck_pain neck_pain_intensity neck_pain_frequency ...]
DEBUG: Detected patterns: 0
```

## Required Fixes

### 1. ✅ COMPLETED: Fix Pattern Detection in `pdf_orchestrator.go`

**Location 1 - Line 70:** ✅ IMPLEMENTED
```go
// BEFORE:
patterns, err := o.detector.DetectPatterns(pdfContext.FormDefinition, pdfContext.Answers)

// AFTER:
// Extract surveyJson for pattern detection
surveyJson, ok := pdfContext.FormDefinition["surveyJson"].(map[string]interface{})
if !ok {
    surveyJson = pdfContext.FormDefinition // Fallback for backward compatibility
    log.Printf("DEBUG: Using full form definition as surveyJson fallback")
} else {
    log.Printf("DEBUG: Successfully extracted surveyJson from form definition")
}
patterns, err := o.detector.DetectPatterns(surveyJson, pdfContext.Answers)
```

**Location 2 - Line 246 (in renderSections function):** ✅ IMPLEMENTED
```go
// BEFORE:
patterns, err := o.detector.DetectPatterns(context.FormDefinition, context.Answers)

// AFTER:
// Extract surveyJson for pattern detection
surveyJson, ok := context.FormDefinition["surveyJson"].(map[string]interface{})
if !ok {
    surveyJson = context.FormDefinition // Fallback
}
patterns, err := o.detector.DetectPatterns(surveyJson, context.Answers)
```

### 2. Verify Pain Assessment Matcher Works

The matcher in `pattern_detector.go` (lines 261-303) should already work once it gets the correct structure. It:
- Looks for panels named `pain_assessment_panel`
- Collects pain-related fields from response data
- Excludes synthetic fields and diagram fields

### 3. Check Pain Assessment Renderer

The renderer in `renderers/pain_assessment.go` currently generates HTML programmatically. It should work but could be enhanced to use the embedded template `pain_assessment_table.html` for better formatting.

## Test Data Structure

The pain assessment form has this structure:
```json
{
  "surveyJson": {
    "pages": [{
      "elements": [{
        "type": "panel",
        "name": "pain_assessment_panel",
        "elements": [
          // Nested panels for each body area (neck, headaches, etc.)
          // Each with has_X_pain, X_pain_intensity, X_pain_frequency fields
        ]
      }]
    }]
  }
}
```

## Files to Consider Deleting (Later)
- `backend-go/internal/services/custom_tables.go` - Uses filesystem instead of embedded templates
- `backend-go/templates/` directory - Old templates, now embedded in `renderers/templates/`

## Testing
After making these changes:
1. Test PDF generation with the pain assessment form
2. Check logs for "Successfully extracted surveyJson" message
3. Verify pattern detection finds the pain_assessment_panel
4. Confirm PDF shows the pain assessment table with data

## Why This Solution Works
- Pattern detector receives the correct JSON structure (`{pages: [...]}`)
- Body diagrams already work with this same system
- No changes needed to distroless container or embedded templates
- Maintains backward compatibility with forms that don't have surveyJson wrapper