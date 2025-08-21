# Ultimate Guide: Adding New Form Fields with Metadata

## Overview
This guide provides the complete workflow for adding new form fields to your SurveyJS-based healthcare form system with proper metadata support for PDF pattern detection.

## Architecture Overview

### Current System Components
- **Frontend**: React + SurveyJS with custom question types and panels
- **Backend**: Go-based PDF generation with pattern detection
- **Metadata System**: JSON-based pattern detection for specialized rendering
- **Configuration**: Multiple toolbox configurations for different contexts

### Key Files and Their Roles
- `frontend/src/utils/initializeSurveyMetadata.ts` - Global metadata property registration
- `frontend/src/components/FormBuilder/FormBuilderContainer.tsx` - Main form builder with metadata initialization
- `frontend/src/utils/toolboxConfig.ts` - Main toolbox configuration
- `backend-go/internal/services/pattern_detector.go` - Backend pattern matching logic
- `backend-go/internal/services/pdf_orchestrator.go` - PDF generation orchestration

## Two Approaches for New Form Fields

### Approach 1: Custom Question Components (Recommended for Complex UI)
**Best for**: Interactive components with custom UI (diagrams, sliders, etc.)
**Examples**: Body pain diagrams, height/weight sliders, custom dropdowns

### Approach 2: Panel-Based Fields (Recommended for Simple Forms)
**Best for**: Standard form sections with multiple related fields
**Examples**: Patient demographics, review of systems, vital signs

---

# Approach 1: Custom Question Components

## Step 1: Create the Custom Question Class

**File**: `frontend/src/components/FormBuilder/YourQuestionName.tsx`

```typescript
import React from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// 1. Define the Question Model Class
export class QuestionYourQuestionNameModel extends Question {
  getType(): string {
    return "yourquestionname"; // This becomes the question type
  }

  // Constructor with metadata initialization
  constructor(name: string) {
    super(typeof name === 'string' ? name : '');
    this.metadata = { patternType: 'your_pattern_type' };
  }
}

// 2. Register the question type with SurveyJS
Serializer.addClass(
  "yourquestionname",
  [
    // Add any custom properties your question needs
    { name: "customProperty", default: "" }
  ],
  () => new QuestionYourQuestionNameModel(""),
  "question" // Base class
);

// 3. Create the React Component
export class YourQuestionName extends SurveyQuestionElementBase {
  get question(): QuestionYourQuestionNameModel {
    return this.questionBase as QuestionYourQuestionNameModel;
  }

  renderElement(): JSX.Element {
    return (
      <div className="your-question-container">
        <h3>{this.question.title}</h3>
        {/* Your custom UI here */}
      </div>
    );
  }
}

// 4. Register with React factory
ReactQuestionFactory.Instance.registerQuestion("yourquestionname", (props) => {
  return React.createElement(YourQuestionName, props);
});
```

## Step 2: Add to Toolbox Configuration

**File**: `frontend/src/utils/toolboxConfig.ts`

```typescript
// Add to healthcareToolboxItems array
{
  name: 'your-question-name',
  title: 'Your Question Display Name',
  iconName: 'icon-panel', // Choose appropriate icon
  json: {
    type: 'yourquestionname', // Must match getType() return value
    title: 'Default Title',
    description: 'Default description',
    metadata: {
      patternType: 'your_pattern_type' // Critical for backend detection
    }
    // Add any custom properties
    customProperty: 'default value'
  }
}
```

## Step 3: Register in Form Builder

**File**: `frontend/src/components/FormBuilder/FormBuilderContainer.tsx`

```typescript
// Add import after initializeSurveyMetadata
import './YourQuestionName'; // This registers the question type
```

## Step 4: Create Backend Pattern Matcher

**File**: `backend-go/internal/services/pattern_detector.go`

```go
// Add new matcher struct
type YourQuestionNameMatcher struct{}

// Implement the Match method
func (m *YourQuestionNameMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    elements := extractElements(formDef)

    for _, element := range elements {
        // Check for metadata pattern type
        if metadata, ok := element["metadata"].(map[string]interface{}); ok {
            if patternType, ok := metadata["patternType"].(string); ok {
                if patternType == "your_pattern_type" {
                    // Found your question via metadata
                    if name, ok := element["name"].(string); ok {
                        // Collect relevant field names from response data
                        fieldNames := []string{}
                        for key := range responseData {
                            if strings.HasPrefix(key, name) {
                                fieldNames = append(fieldNames, key)
                            }
                        }

                        return true, PatternMetadata{
                            PatternType:  "your_pattern_type",
                            ElementNames: fieldNames,
                            TemplateData: map[string]interface{}{
                                "element": element,
                                "answers": responseData,
                            },
                        }
                    }
                }
            }
        }
    }

    return false, PatternMetadata{}
}

func (m *YourQuestionNameMatcher) GetPatternType() string { return "your_pattern_type" }
func (m *YourQuestionNameMatcher) GetPriority() int       { return 10 } // Choose appropriate priority
```

## Step 5: Register Matcher in Pattern Detector

**File**: `backend-go/internal/services/pattern_detector.go`

```go
func NewPatternDetector() *PatternDetector {
    return &PatternDetector{
        matchers: []PatternMatcher{
            // ... existing matchers
            &YourQuestionNameMatcher{}, // Add your new matcher
        },
    }
}
```

## Step 6: Create PDF Renderer

**File**: `backend-go/internal/services/renderers/your_question_renderer.go`

```go
package renderers

import (
    "fmt"
    "html/template"
)

// YourQuestionRenderer renders your custom question data
func YourQuestionRenderer(metadata map[string]interface{}, context *PDFContext) (string, error) {
    result := ""

    // Extract data from metadata
    if element, ok := metadata["element"].(map[string]interface{}); ok {
        if title, ok := element["title"].(string); ok {
            result += fmt.Sprintf("<h3>%s</h3>", title)
        }
    }

    if answers, ok := metadata["answers"].(map[string]interface{}); ok {
        // Render your question data
        result += "<div class='your-question-content'>"
        for key, value := range answers {
            if strings.HasPrefix(key, "your_question_prefix") {
                result += fmt.Sprintf("<p><strong>%s:</strong> %v</p>", key, value)
            }
        }
        result += "</div>"
    }

    return result, nil
}
```

## Step 7: Register Renderer

**File**: `backend-go/internal/services/renderer_registry.go`

```go
func NewRendererRegistry(templateStore *templates.TemplateStore) *RendererRegistry {
    return &RendererRegistry{
        renderers: map[string]Renderer{
            // ... existing renderers
            "your_pattern_type": wrapRenderer(YourQuestionRenderer), // Add your renderer
        },
    }
}
```

---

# Approach 2: Panel-Based Fields

## Step 1: Create Panel Configuration

**File**: `frontend/src/utils/toolboxConfig.ts` or `surveyConfigMinimal.ts`

```typescript
{
  name: 'your-panel-name',
  title: 'Your Panel Display Name',
  iconName: 'icon-panel',
  json: {
    type: 'panel',
    name: 'your_panel_unique_name', // Important for backend detection
    title: 'Your Panel Title',
    description: 'Your panel description',
    metadata: {
      patternType: 'your_pattern_type' // Critical for backend detection
    },
    elements: [
      {
        type: 'text',
        name: 'field1',
        title: 'Field 1'
      },
      {
        type: 'radiogroup',
        name: 'field2',
        title: 'Field 2',
        choices: ['Option 1', 'Option 2']
      }
      // Add more fields as needed
    ]
  }
}
```

## Step 2: Create Backend Pattern Matcher

**File**: `backend-go/internal/services/pattern_detector.go`

```go
type YourPanelMatcher struct{}

func (m *YourPanelMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    elements := extractElements(formDef)
    var foundPanel map[string]interface{}
    var allFieldNames []string

    for _, element := range elements {
        // Check for metadata pattern type
        if metadata, ok := element["metadata"].(map[string]interface{}); ok {
            if patternType, ok := metadata["patternType"].(string); ok {
                if patternType == "your_pattern_type" {
                    foundPanel = element
                    panelName, _ := element["name"].(string)

                    // Collect all nested field names
                    var collectFieldNames func(elem map[string]interface{})
                    collectFieldNames = func(elem map[string]interface{}) {
                        if name, ok := elem["name"].(string); ok && name != "" {
                            if _, hasAnswer := responseData[name]; hasAnswer {
                                allFieldNames = append(allFieldNames, name)
                            }
                        }

                        if nestedElements, ok := elem["elements"].([]interface{}); ok {
                            for _, nested := range nestedElements {
                                if nestedMap, ok := nested.(map[string]interface{}); ok {
                                    collectFieldNames(nestedMap)
                                }
                            }
                        }
                    }

                    collectFieldNames(element)

                    fmt.Printf("DEBUG: Found your panel via metadata, name: %s, fields: %v\n", panelName, allFieldNames)

                    return true, PatternMetadata{
                        PatternType:  "your_pattern_type",
                        ElementNames: allFieldNames,
                        TemplateData: map[string]interface{}{
                            "panel": foundPanel,
                            "answers": responseData,
                        },
                    }
                }
            }
        }
    }

    return false, PatternMetadata{}
}

func (m *YourPanelMatcher) GetPatternType() string { return "your_pattern_type" }
func (m *YourPanelMatcher) GetPriority() int       { return 10 }
```

## Step 3: Create HTML Template (Optional but Recommended)

**File**: `backend-go/internal/services/renderers/templates/your_panel.html`

```html
<div class="form-section" style="margin-bottom: 15px;">
    <div class="section-title">{{.panel.title}}</div>
    <div class="panel-description">{{.panel.description}}</div>

    <div class="panel-content">
        {{range .answers}}
            {{if .Value}}
                <div class="field-item">
                    <strong>{{.Key}}:</strong> {{.Value}}
                </div>
            {{end}}
        {{end}}
    </div>
</div>
```

## Step 4: Create PDF Renderer

**File**: `backend-go/internal/services/your_panel_renderer.go`

```go
func YourPanelRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
    // Option 1: Use template
    tmpl, err := context.TemplateStore.Get("your_panel.html")
    if err != nil {
        return "", fmt.Errorf("failed to get template: %w", err)
    }

    var result strings.Builder
    if err := tmpl.Execute(&result, metadata.TemplateData); err != nil {
        return "", fmt.Errorf("template execution failed: %w", err)
    }

    return result.String(), nil
}
```

---

# Configuration Files to Update

## For Custom Questions
1. `frontend/src/utils/initializeSurveyMetadata.ts` - Already handles all question types
2. `frontend/src/components/FormBuilder/FormBuilderContainer.tsx` - Add import
3. `frontend/src/utils/toolboxConfig.ts` - Add toolbox item
4. `backend-go/internal/services/pattern_detector.go` - Add matcher
5. `backend-go/internal/services/renderer_registry.go` - Register renderer

## For Panel-Based Fields
1. `frontend/src/utils/toolboxConfig.ts` - Add panel configuration
2. `backend-go/internal/services/pattern_detector.go` - Add matcher
3. `backend-go/internal/services/renderer_registry.go` - Register renderer

---

# Testing and Verification

## Step 1: Test Frontend
1. Start the development server
2. Open Form Builder
3. Verify your new component appears in toolbox
4. Add it to a form and check JSON output
5. Confirm metadata appears in saved form JSON

## Step 2: Test Backend Detection
1. Submit a form response with your new component
2. Check backend logs for pattern detection messages:
```
DEBUG: Found your_pattern_type panel via metadata, name: your_panel_name, fields: [field1, field2, ...]
```

## Step 3: Test PDF Generation
1. Generate a PDF from the form response
2. Verify your component renders correctly in the PDF
3. Check that no fields are duplicated
4. Confirm proper styling and layout

## Step 4: Verify Field Tracking
1. Check logs for field marking:
```
DEBUG: Marked field 'field1' as rendered by pattern 'your_pattern_type'
DEBUG: Marked field 'field2' as rendered by pattern 'your_pattern_type'
```

---

# Common Pitfalls and Solutions

## ❌ Pitfall 1: Missing Metadata
**Problem**: Component doesn't get detected by backend pattern matcher
**Solution**: Always include `metadata: { patternType: 'your_pattern_type' }` in your configuration

## ❌ Pitfall 2: Import Order Issues
**Problem**: Metadata properties not recognized
**Solution**: Ensure `initializeSurveyMetadata()` is called BEFORE any custom question imports

## ❌ Pitfall 3: Inconsistent Pattern Types
**Problem**: Frontend and backend use different pattern type strings
**Solution**: Use identical strings in both frontend metadata and backend matcher

## ❌ Pitfall 4: Missing Field Collection
**Problem**: Not all fields are tracked, causing duplicates
**Solution**: Implement proper recursive field collection in your matcher

## ❌ Pitfall 5: Renderer Not Registered
**Problem**: Component not rendered in PDF
**Solution**: Ensure renderer is properly registered in `renderer_registry.go`

---

# Examples from Existing Codebase

## Example 1: Simple Panel (Review of Systems)
```typescript
// Configuration in reviewOfSystemsConfig.ts
{
  type: 'panel',
  name: 'page_review_of_systems',
  title: 'Review of Systems',
  metadata: { patternType: 'review_of_systems' },
  elements: [/* checkbox groups */]
}
```

## Example 2: Custom Question (Body Pain Diagram)
```typescript
// In BodyPainDiagramQuestion.tsx
export class QuestionBodyPainDiagramModel extends Question {
  getType(): string {
    return "bodypaindiagram";
  }

  constructor(name: string) {
    super(typeof name === 'string' ? name : '');
    this.metadata = { patternType: 'body_pain_diagram' };
  }
}
```

## Example 3: Pattern Matcher
```go
// In pattern_detector.go
func (m *ReviewOfSystemsMatcher) Match(formDef, responseData map[string]interface{}) (bool, PatternMetadata) {
    elements := extractElements(formDef)

    for _, element := range elements {
        if metadata, ok := element["metadata"].(map[string]interface{}); ok {
            if patternType, ok := metadata["patternType"].(string); ok {
                if patternType == "review_of_systems" {
                    // Found via metadata - collect all checkbox fields
                    // Implementation details...
                }
            }
        }
    }
    return false, PatternMetadata{}
}
```

---

# Best Practices

## 1. Naming Conventions
- Use lowercase with underscores for pattern types: `your_pattern_type`
- Use camelCase for component names: `YourComponentName`
- Use descriptive, unique field names

## 2. Error Handling
- Always check for nil values in Go matchers
- Handle missing metadata gracefully
- Log debug information for troubleshooting

## 3. Performance Considerations
- Cache template loading in renderers
- Use efficient field collection algorithms
- Minimize string operations in hot paths

## 4. Maintainability
- Document pattern types and their purposes
- Keep related code together
- Use consistent code structure across components

## 5. Testing Strategy
- Test both positive and negative cases
- Verify metadata persistence
- Test PDF generation with various data combinations
- Check field tracking prevents duplicates

---

# Troubleshooting Checklist

## Frontend Issues
- [ ] Metadata initialization called before custom imports?
- [ ] Component appears in toolbox?
- [ ] Metadata visible in form JSON?
- [ ] Console shows no errors?

## Backend Issues
- [ ] Pattern matcher registered in NewPatternDetector()?
- [ ] Pattern type strings match exactly?
- [ ] Debug logs show pattern detection?
- [ ] Field collection working correctly?

## PDF Issues
- [ ] Renderer registered in renderer registry?
- [ ] Template exists and is valid?
- [ ] No duplicate fields in output?
- [ ] Styling renders correctly?

## Field Tracking Issues
- [ ] All fields marked as rendered by pattern?
- [ ] Generic renderer not processing pattern fields?
- [ ] ElementNames array complete?
- [ ] No orphaned fields in logs?

---

# Quick Reference Commands

## Frontend Development
```bash
# Start development server
npm start

# Check console for metadata initialization
# Look for: [SurveyJS] Metadata support initialized successfully
```

## Backend Development
```bash
# Build and run backend
go build ./cmd/server
./server

# Check logs for pattern detection
# Look for: DEBUG: Found your_pattern_type panel via metadata
```

## Testing
```bash
# Test pattern detection
curl -X POST http://localhost:8080/api/forms/your-form-id/responses \
  -H "Content-Type: application/json" \
  -d '{"response_data": {"field1": "value1"}}'

# Generate PDF
curl -X GET http://localhost:8080/api/pdf/your-response-id
```

This guide covers everything needed to successfully add new form fields with proper metadata support to your healthcare form system!