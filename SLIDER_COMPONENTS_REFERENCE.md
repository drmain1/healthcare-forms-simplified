# Height/Weight Slider Components Reference

This document provides a complete reference for the custom height and weight slider components in the healthcare forms application. These components are **brittle** and require careful handling when making modifications.

## ⚠️ Important Notes

- **These components are fragile** - Small changes can break functionality
- **Always test thoroughly** when modifying anything related to these sliders
- **Panel metadata can interfere** - Use hidden HTML elements for metadata instead of direct panel metadata
- **Custom SurveyJS components** - These extend the base Question class and require specific registration

## Component Architecture

### 1. Frontend Component Definition (`HeightWeightSlider.tsx`)

**Location**: `frontend/src/components/FormBuilder/HeightWeightSlider.tsx`

**Key Components**:
- `HeightSlider` - React component for height input
- `WeightSlider` - React component for weight input  
- `QuestionHeightSliderModel` - SurveyJS question model for height
- `QuestionWeightSliderModel` - SurveyJS question model for weight
- `SurveyQuestionHeightSlider` - SurveyJS React wrapper for height
- `SurveyQuestionWeightSlider` - SurveyJS React wrapper for weight

**Registration**:
```typescript
// Register question types with SurveyJS
Serializer.addClass(QuestionHeightSliderModel.typeName, [...], ...);
Serializer.addClass(QuestionWeightSliderModel.typeName, [...], ...);

// Register React components
ReactQuestionFactory.Instance.registerQuestion(
  QuestionHeightSliderModel.typeName,
  (props: any) => React.createElement(SurveyQuestionHeightSlider, props)
);
```

### 2. Component Registry (`customQuestionRegistry.ts`)

**Location**: `frontend/src/components/FormBuilder/customQuestionRegistry.ts`

**Purpose**: Centralized registry that imports and tracks all custom question types

**Important**: This file must be imported once in the app to register all custom questions.

### 3. Toolbox Configuration (`surveyConfigMinimal.ts`)

**Location**: `frontend/src/utils/surveyConfigMinimal.ts`

**Panel Definition**:
```typescript
const vitalsPanel = {
  name: 'vitals-panel',
  title: 'Patient Vitals',
  iconName: 'icon-panel',
  category: 'Vitals',
  json: {
    type: 'panel',
    name: 'patient_vitals',
    title: 'Patient Vitals',
    elements: [
      {
        type: 'html',
        name: 'vitals_metadata',
        html: '<div style="display: none;" data-pattern-type="patient_vitals" data-metadata="true"></div>'
      },
      {
        type: 'html',
        name: 'vitals_instructions',
        html: '<p style="color: #666; margin-bottom: 20px;">Please enter your height and weight using the sliders below:</p>'
      },
      {
        type: 'heightslider',
        name: 'patient_height',
        title: 'Height',
        defaultValue: 66
      },
      {
        type: 'weightslider',
        name: 'patient_weight',
        title: 'Weight',
        defaultValue: 150
      },
      {
        type: 'html',
        name: 'bmi_calculation',
        html: '<div style="margin-top: 20px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"><strong>BMI will be calculated automatically</strong></div>'
      }
    ]
  }
};
```

## Backend Integration

### 1. Pattern Detection (`pattern_detector.go`)

**Location**: `backend-go/internal/services/pattern_detector.go`

**Detection Methods** (in priority order):
1. **Direct metadata property** on panel (legacy method)
2. **Hidden HTML elements** with data attributes (current method)
3. **Panel name/title matching** (fallback)
4. **Individual slider elements** (final fallback)

**Detection Code**:
```go
// Method 2: Look for hidden HTML elements with metadata data attributes
if panelElements, ok := element["elements"].([]interface{}); ok {
  for _, panelElem := range panelElements {
    if pe, ok := panelElem.(map[string]interface{}); ok {
      if t, ok := pe["type"].(string); ok && t == "html" {
        if htmlContent, ok := pe["html"].(string); ok {
          // Check if HTML contains our metadata data attributes
          if strings.Contains(htmlContent, `data-pattern-type="patient_vitals"`) {
            log.Printf("DEBUG: Found patient vitals panel by HTML metadata data attribute")
            // Process all elements in this panel...
          }
        }
      }
    }
  }
}
```

### 2. Rendering (`patient_vitals.go`)

**Location**: `backend-go/internal/services/patient_vitals.go`

**Key Functions**:
- `PatientVitalsRenderer()` - Main rendering function
- `extractVitalReadings()` - Extracts vital data from form responses
- `getVitalSignDefinitions()` - Defines all supported vital signs
- BMI calculation and status assessment functions

## Data Flow

### 1. Form Creation
1. User drags "Patient Vitals" from toolbox
2. Panel created with heightslider and weightslider elements
3. Hidden HTML element with metadata added for backend detection

### 2. Form Submission
1. Custom sliders save values as `patient_height` and `patient_weight`
2. Values are numeric (inches for height, pounds for weight)
3. Data stored in Firestore as part of form response

### 3. PDF Generation
1. Pattern detector finds vitals panel via HTML metadata
2. Extracts field names: `["patient_height", "patient_weight", "vitals_metadata", "vitals_instructions", "bmi_calculation"]`
3. Renderer processes actual data fields and calculates BMI
4. Generates PDF section with height, weight, and BMI

## Common Issues & Solutions

### ❌ Problem: Sliders not working after changes
**Cause**: Metadata or other properties interfering with custom components
**Solution**: Use hidden HTML elements for metadata instead of panel properties

### ❌ Problem: No vital data detected in PDF
**Cause**: Pattern detector not finding the panel
**Solution**: Check debug logs for detection method used, ensure HTML metadata element is present

### ❌ Problem: Height/weight values not saving
**Cause**: Custom question registration issues
**Solution**: Ensure `customQuestionRegistry.ts` is imported in app initialization

### ❌ Problem: Styling broken
**Cause**: CSS dependencies missing
**Solution**: Ensure `height-weight-slider.css` is imported

## Dependencies

### Frontend Dependencies
- `survey-core` - SurveyJS core library
- `survey-react-ui` - SurveyJS React components  
- `survey-creator-react` - SurveyJS Creator
- Custom CSS: `frontend/src/styles/height-weight-slider.css`
- Design tokens: `frontend/src/styles/design-tokens.ts`

### Backend Dependencies
- Go modules in `backend-go/go.mod`
- Firestore for data storage
- Pattern detection system
- PDF generation pipeline

## Testing Checklist

When modifying slider components, test:

- [ ] Sliders render correctly in form builder
- [ ] Sliders render correctly in form preview  
- [ ] Sliders render correctly in public form
- [ ] Values save properly when form is submitted
- [ ] Pattern detection works (check backend logs)
- [ ] PDF generation includes vital signs
- [ ] BMI calculation works correctly
- [ ] Height displays as feet/inches format
- [ ] Weight displays in pounds
- [ ] Default values work (66" height, 150 lbs weight)

## File Locations Summary

**Frontend**:
- `frontend/src/components/FormBuilder/HeightWeightSlider.tsx` - Component implementation
- `frontend/src/components/FormBuilder/customQuestionRegistry.ts` - Registration
- `frontend/src/utils/surveyConfigMinimal.ts` - Toolbox definition
- `frontend/src/styles/height-weight-slider.css` - Styling

**Backend**:
- `backend-go/internal/services/pattern_detector.go` - Detection logic
- `backend-go/internal/services/patient_vitals.go` - Rendering logic

## Version History

- **v1.0**: Initial implementation with direct panel metadata
- **v1.1**: Fixed slider interference by using hidden HTML metadata elements
- **v1.2**: Enhanced pattern detector with dual detection methods

---

**⚠️ Remember**: These components are fragile. Always test thoroughly when making changes, and consider the full data flow from form creation to PDF generation.