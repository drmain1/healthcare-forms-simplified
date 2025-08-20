# SurveyJS Custom Components & PDF Generation Guide

## Overview
This guide documents the lessons learned from debugging patient demographics and provides a comprehensive guide for adding new custom components to SurveyJS with proper PDF generation support.

## Key Lessons Learned

### 1. Metadata-Based Pattern Detection is Critical
- **Problem**: Complex heuristic-based detection (checking field names, titles, etc.) is fragile and unreliable
- **Solution**: Use metadata tags for 100% reliable pattern detection
- **Implementation**: Every custom component should include `metadata: { patternType: 'your_pattern_type' }`

### 2. Field Name Consistency
- **Problem**: Mismatch between frontend field names and backend expectations causes data loss
- **Solution**: Backend should use the actual field names from `metadata.ElementNames` rather than hardcoded lists
- **Key Insight**: The pattern detector correctly extracts field names; the renderer must use these exact names

### 3. Initialization Order Matters
- **Critical**: `initializeSurveyMetadata()` must be called BEFORE importing custom questions
- **Why**: This ensures the metadata property is properly registered with SurveyJS before components try to use it

## Complete Guide: Adding a New Custom SurveyJS Component

### Step 1: Create the Custom Component (Frontend)

```typescript
// frontend/src/components/FormBuilder/YourCustomQuestion.tsx
import { Question } from 'survey-core';
import { PropertyGridEditorCollection } from 'survey-creator-core';
import * as SurveyCore from 'survey-core';

// Define the component type
export class YourCustomQuestionModel extends Question {
  getType() {
    return 'yourcustomtype';
  }
  
  // Add any custom properties
  get customProperty() {
    return this.getPropertyValue('customProperty');
  }
  set customProperty(val) {
    this.setPropertyValue('customProperty', val);
  }
}

// Register the component
SurveyCore.ComponentCollection.Instance.add({
  name: 'yourcustomtype',
  title: 'Your Custom Component',
  iconName: 'icon-panel',
  category: 'Custom Questions',
  questionJSON: {
    type: 'panel',
    name: 'your_custom_component',
    title: 'Your Custom Component',
    metadata: {
      patternType: 'your_custom_pattern'  // CRITICAL: Add this for PDF generation
    },
    elements: [
      // Define your component structure
      {
        type: 'text',
        name: 'custom_field_1',
        title: 'Field 1'
      },
      {
        type: 'text', 
        name: 'custom_field_2',
        title: 'Field 2'
      }
    ]
  }
});
```

### Step 2: Register in Custom Question Registry (Frontend)

```typescript
// frontend/src/components/FormBuilder/customQuestionRegistry.ts

export const customQuestionTypes = {
  // ... existing types
  yourcustomtype: {
    name: 'yourcustomtype',
    title: 'Your Custom Component',
    defaultJSON: {
      type: 'panel',
      name: 'your_custom_component',
      title: 'Your Custom Component',
      metadata: {
        patternType: 'your_custom_pattern'
      },
      elements: [
        // Your elements here
      ]
    }
  }
};
```

### Step 3: Import in Correct Order (Frontend)

```typescript
// In FormBuilderContainer.tsx, PublicFormFill.tsx, ResponseDetail.tsx

// FIRST - Initialize metadata support
import { initializeSurveyMetadata } from '../../utils/initializeSurveyMetadata';
initializeSurveyMetadata();

// SECOND - Import custom questions
import './YourCustomQuestion';
import './BodyPainDiagramQuestion';
// ... other custom questions
```

### Step 4: Create Pattern Matcher (Backend)

```go
// backend-go/internal/services/pattern_detector.go

// Add your matcher type
type YourCustomMatcher struct{}

func (m *YourCustomMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    // Clean metadata-only detection
    elements := extractElements(formDef)
    var yourFields []string
    
    for _, element := range elements {
        // Check for metadata pattern type
        if metadata, ok := element["metadata"].(map[string]interface{}); ok {
            if patternType, ok := metadata["patternType"].(string); ok {
                if patternType == "your_custom_pattern" {
                    // Found your custom component via metadata
                    if name, ok := element["name"].(string); ok {
                        yourFields = append(yourFields, name)
                    }
                    // Collect nested fields if it's a panel
                    if nestedElements, ok := element["elements"].([]interface{}); ok {
                        for _, nested := range nestedElements {
                            if nestedMap, ok := nested.(map[string]interface{}); ok {
                                if nestedName, ok := nestedMap["name"].(string); ok {
                                    yourFields = append(yourFields, nestedName)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    if len(yourFields) > 0 {
        return true, PatternMetadata{
            PatternType:  "your_custom_pattern",
            ElementNames: yourFields,
            TemplateData: map[string]interface{}{
                "fields": yourFields,
            },
        }
    }
    
    return false, PatternMetadata{}
}

func (m *YourCustomMatcher) GetPatternType() string { return "your_custom_pattern" }
func (m *YourCustomMatcher) GetPriority() int       { return 10 }

// Register in NewPatternDetector
func NewPatternDetector() *PatternDetector {
    return &PatternDetector{
        matchers: []PatternMatcher{
            // ... existing matchers
            &YourCustomMatcher{},
        },
    }
}
```

### Step 5: Create Renderer (Backend)

```go
// backend-go/internal/services/your_custom_renderer.go

package services

import (
    "bytes"
    "fmt"
    "html"
    "log"
)

func YourCustomRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    var result bytes.Buffer
    
    result.WriteString(`<div class="form-section" style="margin-bottom: 20px;">`)
    result.WriteString(`<div class="section-title" style="background-color: #4a5568; color: white; padding: 8px 12px; margin-bottom: 15px; font-weight: bold;">Your Custom Section</div>`)
    
    // Log for debugging
    log.Printf("DEBUG: YourCustomRenderer - ElementNames: %v", metadata.ElementNames)
    log.Printf("DEBUG: YourCustomRenderer - Available answers: %v", getMapKeys(context.Answers))
    
    result.WriteString(`<table style="width: 100%; border-collapse: collapse; font-size: 12px;">`)
    
    // Process fields directly from metadata.ElementNames
    for _, fieldName := range metadata.ElementNames {
        // Skip non-data fields
        if fieldName == "your_custom_component" || strings.HasSuffix(fieldName, "_header") {
            continue
        }
        
        if value, exists := context.Answers[fieldName]; exists && value != nil {
            displayValue := fmt.Sprintf("%v", value)
            
            // Skip empty values
            if displayValue == "" {
                continue
            }
            
            // Generate label from field name
            label := formatFieldLabel(fieldName, "")
            
            result.WriteString(`<tr>`)
            result.WriteString(`<td style="padding: 4px 8px; font-weight: bold;">` + html.EscapeString(label) + `:</td>`)
            result.WriteString(`<td style="padding: 4px 8px;">` + html.EscapeString(displayValue) + `</td>`)
            result.WriteString(`</tr>`)
            
            log.Printf("DEBUG: Rendered field %s with value %s", fieldName, displayValue)
        }
    }
    
    result.WriteString(`</table>`)
    result.WriteString(`</div>`)
    
    return result.String(), nil
}
```

### Step 6: Register Renderer (Backend)

```go
// backend-go/internal/services/renderer_registry.go

func (rr *RendererRegistry) registerRenderers() {
    // ... existing renderers
    rr.renderers["your_custom_pattern"] = rr.wrapRenderer(YourCustomRenderer)
}
```

### Step 7: Add to Render Order (Backend)

```go
// backend-go/internal/services/pdf_orchestrator.go

func (o *PDFOrchestrator) getRenderOrder(org *data.Organization, patterns []PatternMetadata) []string {
    defaultOrder := []string{
        "patient_demographics",
        "your_custom_pattern",  // Add your pattern in the desired position
        "additional_demographics",
        // ... other patterns
    }
    // ...
}
```

## Testing Checklist

### Frontend Testing
1. ✅ Component appears in form builder toolbox
2. ✅ Component can be added to form
3. ✅ Component saves with metadata tag
4. ✅ Form submission includes all field data
5. ✅ Check browser console for: `[SurveyJS] Metadata support initialized successfully`

### Backend Testing
1. ✅ Check logs for pattern detection:
   ```
   DEBUG: Detected patterns: 1
   DEBUG: Pattern type=your_custom_pattern, fields=[field1, field2, ...]
   ```

2. ✅ Check logs for renderer execution:
   ```
   DEBUG: YourCustomRenderer - ElementNames: [field1, field2, ...]
   DEBUG: YourCustomRenderer - Available answers: [field1, field2, ...]
   DEBUG: Rendered field field1 with value ...
   ```

3. ✅ PDF generates successfully with your custom section

## Common Pitfalls to Avoid

### 1. Forgetting Metadata Tag
❌ **Wrong:**
```javascript
questionJSON: {
  type: 'panel',
  name: 'my_component',
  elements: [...]
}
```

✅ **Correct:**
```javascript
questionJSON: {
  type: 'panel',
  name: 'my_component',
  metadata: {
    patternType: 'my_pattern_type'
  },
  elements: [...]
}
```

### 2. Hardcoding Field Names in Renderer
❌ **Wrong:**
```go
// Don't hardcode field names
fields := []string{"field1", "field2", "field3"}
for _, field := range fields {
    if value, exists := context.Answers[field]; exists {
        // ...
    }
}
```

✅ **Correct:**
```go
// Use ElementNames from metadata
for _, fieldName := range metadata.ElementNames {
    if value, exists := context.Answers[fieldName]; exists {
        // ...
    }
}
```

### 3. Wrong Import Order
❌ **Wrong:**
```typescript
import './CustomQuestion';  // Imported before initialization
import { initializeSurveyMetadata } from '../../utils/initializeSurveyMetadata';
initializeSurveyMetadata();
```

✅ **Correct:**
```typescript
import { initializeSurveyMetadata } from '../../utils/initializeSurveyMetadata';
initializeSurveyMetadata();  // Initialize FIRST
import './CustomQuestion';   // Then import custom questions
```

### 4. Not Filtering Non-Data Elements
❌ **Wrong:**
```go
// This will try to render HTML elements and panel names
for _, fieldName := range metadata.ElementNames {
    if value, exists := context.Answers[fieldName]; exists {
        // Renders everything including "demographics_header", "panel_name", etc.
    }
}
```

✅ **Correct:**
```go
for _, fieldName := range metadata.ElementNames {
    // Skip non-data elements
    if fieldName == "panel_name" || strings.HasSuffix(fieldName, "_header") {
        continue
    }
    if value, exists := context.Answers[fieldName]; exists {
        // Only renders actual data fields
    }
}
```

## Debugging Tips

### Enable Debug Logging
Add these log statements to trace issues:

```go
// In pattern_detector.go
log.Printf("DEBUG: Checking element for metadata: %v", element)
log.Printf("DEBUG: Found metadata: %v", metadata)
log.Printf("DEBUG: Pattern type: %s", patternType)

// In your renderer
log.Printf("DEBUG: ElementNames from metadata: %v", metadata.ElementNames)
log.Printf("DEBUG: Response data keys: %v", getMapKeys(context.Answers))
for key, value := range context.Answers {
    log.Printf("DEBUG: Answer[%s] = %v", key, value)
}
```

### Check Pattern Detection
Run the backend and submit a form, then check logs:
```bash
cd backend-go
go run cmd/server/main.go 2>&1 | grep "DEBUG:"
```

### Verify Metadata in Firestore
Check the form definition in Firestore to ensure metadata is saved:
1. Go to Firebase Console → Firestore
2. Navigate to `forms` collection
3. Check your form document's `form_definition` field
4. Look for `"metadata": { "patternType": "your_pattern" }`

## Summary

The key to reliable custom SurveyJS components with PDF generation is:

1. **Always use metadata tags** for pattern detection
2. **Initialize metadata support before importing** custom questions  
3. **Use ElementNames from metadata** instead of hardcoding field names
4. **Filter out non-data elements** when rendering
5. **Add comprehensive logging** during development
6. **Test the complete flow** from form builder to PDF generation

By following this guide, you can add new custom components that reliably appear in both the form interface and generated PDFs without the fragility of heuristic-based detection.