# Custom SurveyJS Component Development Guide

## Overview
This guide explains how to add new custom form components to the SurveyJS form builder in the Healthcare Forms platform. Custom components allow you to create specialized input types beyond the standard SurveyJS offerings.

## File Structure & Order of Operations

### 1. Component Files Required
For each custom component, you'll need to create/modify these files:

```
frontend/src/
├── components/FormBuilder/
│   ├── YourCustomQuestion.tsx           # Component implementation
│   └── customQuestionRegistry.ts        # Register the component
├── utils/
│   └── toolboxConfig.ts                 # Add to form builder toolbox
├── styles/
│   └── your-custom-component.css        # Optional styling
└── components/FormRenderer/
    └── PublicFormFill.tsx               # Handle special behaviors (if needed)
```

## Step-by-Step Implementation

### Step 1: Create the Component File
Create a new file in `frontend/src/components/FormBuilder/YourCustomQuestion.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// 1. Create your React component
export const YourCustomComponent: React.FC<{
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}> = ({ value, onChange, readOnly = false }) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setInternalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="custom-component-wrapper">
      {/* Your component UI here */}
      <input 
        value={internalValue} 
        onChange={(e) => handleChange(e.target.value)}
        disabled={readOnly}
      />
    </div>
  );
};

// 2. Create the Question Model
export class QuestionYourCustomModel extends Question {
  static readonly typeName = 'yourcustomtype'; // IMPORTANT: lowercase, no spaces

  getType(): string {
    return QuestionYourCustomModel.typeName;
  }

  // Handle value getter/setter
  get value() {
    return this.getPropertyValue('value');
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
  }

  // Optional: Format display value for PDF/preview
  public getDisplayValue(keysAsText: boolean, value?: any): any {
    return value || this.value || 'No value';
  }
}

// 3. Create the React wrapper for SurveyJS
export class SurveyQuestionYourCustom extends SurveyQuestionElementBase {
  get question(): QuestionYourCustomModel {
    return this.questionBase as QuestionYourCustomModel;
  }

  renderElement(): JSX.Element {
    return (
      <YourCustomComponent
        value={this.question.value}
        onChange={(val) => {
          this.question.value = val;
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// 4. Register with SurveyJS (at bottom of file)
// Register the question type
Serializer.addClass(
  QuestionYourCustomModel.typeName,
  [],
  function() {
    return new QuestionYourCustomModel('');
  },
  'question'
);

// Add any custom properties
Serializer.addProperty(QuestionYourCustomModel.typeName, {
  name: 'customProperty',
  default: 'defaultValue',
  category: 'general',
  visibleIndex: 0
});

// Register the React component
ReactQuestionFactory.Instance.registerQuestion(
  QuestionYourCustomModel.typeName,
  (props: any) => {
    return React.createElement(SurveyQuestionYourCustom, props);
  }
);
```

### Step 2: Register in customQuestionRegistry.ts
Add your component to `frontend/src/components/FormBuilder/customQuestionRegistry.ts`:

```typescript
// Import your new component
import './YourCustomQuestion';

// Add to the CUSTOM_QUESTION_TYPES constant
export const CUSTOM_QUESTION_TYPES = {
  // ... existing types ...
  YOUR_CUSTOM_TYPE: 'yourcustomtype', // Must match typeName in component
} as const;

// Add TypeScript interface if needed
export interface CustomQuestionData {
  // ... existing interfaces ...
  [CUSTOM_QUESTION_TYPES.YOUR_CUSTOM_TYPE]?: {
    value: string;
    // other properties
  };
}
```

### Step 3: Add to Toolbox
Add your component to `frontend/src/utils/toolboxConfig.ts`:

```typescript
export const healthcareToolboxItems = [
  // ... existing items ...
  {
    name: 'your-custom-component',
    title: 'Your Custom Component',
    iconName: 'icon-text', // Use appropriate icon
    json: {
      type: 'yourcustomtype', // Must match typeName
      name: 'unique_field_name',
      title: 'Default Title',
      // any default properties
    }
  }
];
```

### Step 4: Handle Special Behaviors (Optional)
If your component needs special handling during form submission or has complex interactions, update `PublicFormFill.tsx`:

```typescript
// In the onValueChanged event handler
surveyModel.onValueChanged.add(async (sender: any, options: any) => {
  if (options.name === 'your_field_name') {
    // Handle special logic
    console.log('Custom component value changed:', options.value);
    
    // Example: Update other fields based on this value
    if (options.value === 'special_case') {
      sender.setValue('another_field', 'computed_value');
    }
  }
});

// In the onComplete handler for data extraction
surveyModel.onComplete.add((sender: any) => {
  let plainData = { ...sender.data };
  
  // Extract custom component data if needed
  if (plainData.your_field_name) {
    // Process or transform the data
    plainData.processed_field = processCustomData(plainData.your_field_name);
  }
});
```

## Examples in the Codebase

### 1. Insurance Card Upload with AI Processing
- **Type**: `insurance-card-upload`
- **Features**: File upload, AI extraction, auto-population
- **Files**: 
  - Processing: `PublicFormFill.tsx` (lines 363-520)
  - Service: `insuranceCardService.ts`
  - Backend: `insurance_card_service.go`

### 2. Body Pain Diagram
- **Type**: `bodypaindiagram`
- **Features**: Interactive SVG, pain marking, intensity levels
- **Files**: 
  - Component: `BodyPainDiagramQuestion.tsx`
  - Registration: `customQuestionRegistry.ts`

### 3. Height/Weight Sliders
- **Type**: `heightslider`, `weightslider`
- **Features**: Visual sliders, formatted display
- **Files**: 
  - Component: `HeightWeightSlider.tsx`
  - Styles: `height-weight-slider.css`

### 4. Patient Demographics
- **Type**: `patient_demographics`
- **Features**: Nested fields, FHIR compliance
- **Files**: 
  - Component: `PatientDemographicsQuestion.tsx`
  - Data extraction: `customQuestionRegistry.ts` (extractCustomQuestionData)

## Data Flow

1. **Form Builder** → User drags component from toolbox
2. **Survey Model** → Component registered with SurveyJS
3. **Form Renderer** → Component renders with React
4. **Value Changes** → Handled by component's onChange
5. **Form Submission** → Data extracted and processed
6. **Backend Storage** → Saved to Firestore
7. **PDF Generation** → getDisplayValue() used for formatting

## Common Patterns

### Pattern 1: File Upload with Processing
```typescript
// Handle file upload
surveyModel.onUploadFiles.add(async (sender: any, options: any) => {
  if (options.name === 'your_file_field') {
    const file = options.files[0];
    // Process file (e.g., extract data, validate, etc.)
    const processedData = await processFile(file);
    // Update other fields
    sender.setValue('extracted_field', processedData);
  }
  options.callback('success');
});
```

### Pattern 2: Conditional Field Visibility
```typescript
// In toolbox config
{
  type: 'panel',
  name: 'conditional_panel',
  visibleIf: '{trigger_field} = "show"',
  elements: [/* nested elements */]
}
```

### Pattern 3: Complex Data Storage
```typescript
// Store complex objects
get value() {
  const stored = this.getPropertyValue('value');
  return stored || { default: 'structure' };
}

set value(newValue: any) {
  // Validate or transform before storing
  const processed = validateAndTransform(newValue);
  this.setPropertyValue('value', processed);
}
```

## Backend Considerations

### PDF Generation
For custom components to appear correctly in PDFs, ensure proper rendering in the Go backend:

```go
// backend-go/internal/services/pattern_detector.go
// Add pattern detection for your custom type
if strings.Contains(elementName, "your_custom") {
    // Handle special rendering
    return renderCustomComponent(data)
}
```

### Data Processing
```go
// Handle special data extraction
if fieldName == "your_custom_field" {
    processedValue := processCustomData(rawValue)
    responseData[fieldName] = processedValue
}
```

## Testing Checklist

- [ ] Component renders in form builder
- [ ] Drag and drop from toolbox works
- [ ] Value persistence (save/load)
- [ ] Form preview displays correctly
- [ ] Public form submission captures data
- [ ] PDF generation shows component data
- [ ] Mobile responsive design
- [ ] Validation rules work
- [ ] Conditional logic functions
- [ ] Data appears in responses list
- [ ] Backend processing handles data correctly

## Troubleshooting

### Component not appearing in toolbox
- Check `toolboxConfig.ts` - ensure it's added to correct array
- Verify component is imported in `customQuestionRegistry.ts`
- Check browser console for registration errors

### Value not persisting
- Ensure `value` getter/setter implemented correctly
- Check `onChange` is calling `setPropertyValue`
- Verify field name is unique in form

### PDF not showing data
- Implement `getDisplayValue()` method
- Check backend pattern detection
- Verify field name mapping

### Type errors in TypeScript
- Add type definitions to `customQuestionRegistry.ts`
- Update `CustomQuestionData` interface
- Ensure consistent type naming

## Best Practices

1. **Naming Convention**: Use lowercase, no spaces for `typeName`
2. **Default Values**: Always provide sensible defaults
3. **Error Handling**: Gracefully handle missing or invalid data
4. **Accessibility**: Include ARIA labels and keyboard navigation
5. **Mobile First**: Design for mobile screens primarily
6. **Performance**: Lazy load heavy components
7. **Documentation**: Comment complex logic
8. **Validation**: Implement both client and server-side validation

## Resources

- [SurveyJS Custom Questions](https://surveyjs.io/form-library/documentation/customize-question-types)
- [React Component Patterns](https://reactpatterns.com/)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)
- [Material-UI Components](https://mui.com/components/)