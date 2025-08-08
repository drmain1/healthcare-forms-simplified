# Custom Form Field Registration Guide

## Overview
This guide explains how to properly create and register custom SurveyJS form fields to ensure they work correctly throughout the application, including form rendering, data submission, and response viewing.

## Common Issues and Solutions

### Problem: Custom field data not appearing in responses
**Symptom:** The custom field renders correctly but data is not saved or displayed in responses.

**Root Cause:** The custom question type is not registered in all components that render forms (especially `PublicFormFill.tsx`).

**Solution:** Import the custom question component in ALL form rendering components.

## Step-by-Step Guide to Creating a Custom Form Field

### 1. Create the Custom Question Component

Create your custom question component file (e.g., `DateOfBirthQuestion.tsx`):

```typescript
import React from 'react';
import { Question, Serializer, SurveyModel } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// 1. Define your custom question model
export class QuestionCustomModel extends Question {
  static readonly typeName = 'customtype'; // Unique type name

  getType(): string {
    return QuestionCustomModel.typeName;
  }

  // Override value getter/setter to handle data
  get value() {
    return this.getPropertyValue('value', '');
  }

  set value(newValue: any) {
    this.setPropertyValue('value', newValue);
    // Update survey data to ensure it's saved
    if (this.survey) {
      (this.survey as SurveyModel).setValue(this.name, newValue);
    }
  }
}

// 2. Create the React component
export class SurveyQuestionCustom extends SurveyQuestionElementBase {
  get question(): QuestionCustomModel {
    return this.questionBase as QuestionCustomModel;
  }

  protected renderElement(): JSX.Element {
    return (
      <YourCustomComponent
        value={this.question.value}
        onChange={(value) => {
          this.question.value = value; // This triggers the setter
        }}
        readOnly={this.question.isReadOnly}
      />
    );
  }
}

// 3. Register the question type
function registerCustomQuestion() {
  if (Serializer.findClass(QuestionCustomModel.typeName)) {
    return; // Already registered
  }

  // Register with SurveyJS
  Serializer.addClass(
    QuestionCustomModel.typeName,
    [
      {
        name: 'value',
        default: '',
        category: 'general'
      },
      // Add any custom properties here
    ],
    function() {
      return new QuestionCustomModel('');
    },
    'question'
  );

  // Register React Component
  ReactQuestionFactory.Instance.registerQuestion(
    QuestionCustomModel.typeName,
    (props: any) => {
      return React.createElement(SurveyQuestionCustom, props);
    }
  );
}

// 4. Auto-register on import
registerCustomQuestion();
```

### 2. Import in ALL Form Rendering Components

**CRITICAL:** Import your custom question in every component that renders forms:

#### In `FormBuilderContainer.tsx`:
```typescript
import './DateOfBirthQuestion'; // Import to register for form builder
```

#### In `PublicFormFill.tsx`:
```typescript
import '../FormBuilder/DateOfBirthQuestion'; // Import to register for public forms
```

#### In any other form rendering component:
```typescript
import './path/to/DateOfBirthQuestion'; // Always import to register
```

### 3. Add to Toolbox Configuration

Add your custom field to the toolbox in `minimalToolboxConfig.ts`:

```typescript
export const minimalToolboxItems = [
  // ... other items
  {
    name: 'custom-field',
    title: 'Custom Field',
    iconName: 'icon-text',
    category: 'Custom',
    json: {
      type: 'customtype', // Must match your typeName
      name: 'custom_field_name',
      title: 'Custom Field Title',
      // Any default properties
    }
  }
];
```

### 4. Ensure Data Persistence

Make sure your custom question properly saves data:

1. **In the value setter:** Always update the survey data
```typescript
set value(newValue: any) {
  this.setPropertyValue('value', newValue);
  if (this.survey) {
    (this.survey as SurveyModel).setValue(this.name, newValue);
  }
}
```

2. **Handle complex data:** If your field manages multiple values
```typescript
private updateSurveyData() {
  if (this.survey) {
    // Update main field
    (this.survey as SurveyModel).setValue(this.name, this.value);
    
    // Update related fields
    if (this.relatedFieldName) {
      (this.survey as SurveyModel).setValue(this.relatedFieldName, this.relatedValue);
    }
  }
}
```

### 5. Test Your Custom Field

#### Testing Checklist:
- [ ] Field renders in form builder
- [ ] Field renders in public form preview
- [ ] Data is saved when form is submitted
- [ ] Data appears in response detail view
- [ ] Data is included in PDF generation
- [ ] Field works on mobile devices

#### Debug with Console Logging:
```typescript
// Add logging to track data flow
set value(newValue: any) {
  console.log('[CustomField] Setting value:', newValue);
  this.setPropertyValue('value', newValue);
  // ...
}

get value() {
  const val = this.getPropertyValue('value', '');
  console.log('[CustomField] Getting value:', val);
  return val;
}
```

## Common Pitfalls to Avoid

### 1. Not Importing in All Components
**Issue:** Field works in builder but not in public forms
**Fix:** Import in `PublicFormFill.tsx` and any other rendering component

### 2. Not Setting Survey Data
**Issue:** Value not saved to response
**Fix:** Use `survey.setValue(this.name, value)` in your setter

### 3. Wrong Type Name
**Issue:** Field not recognized
**Fix:** Ensure `typeName` matches in all places (model, registration, toolbox)

### 4. Missing Value Property Registration
**Issue:** Value not persisted between sessions
**Fix:** Register 'value' property in `Serializer.addClass`

### 5. Not Handling Display Mode
**Issue:** Field editable in response view
**Fix:** Check `this.question.isReadOnly` in your component

## Example: Date of Birth Field

Here's a complete example from our codebase:

```typescript
// Key points from DateOfBirthQuestion.tsx:

1. Custom type name: 'dateofbirth'
2. Stores both date value and calculated age
3. Updates survey with both patient_dob and patient_age
4. Imported in both FormBuilderContainer and PublicFormFill
5. Registered with proper value property
```

## Backend Considerations

### Form Processor (`backend-go/internal/services/form_processor.go`)
The form processor extracts questions based on the `name` property. Ensure your custom field:
- Has a unique `name` property
- Stores its value in the response data under that name
- Is not filtered out by conditional logic

### PDF Generation
Custom fields are automatically included in PDF generation if they:
- Have a value in the response data
- Have a title for display
- Are not hidden by conditional logic

## Troubleshooting

### Field not appearing in responses:
1. Check browser console for registration logs
2. Verify import in PublicFormFill.tsx
3. Check if value is in form submission data
4. Verify field name matches in backend processing

### Data not saving:
1. Add console.log to value setter
2. Check survey.setValue is called
3. Verify form submission includes field
4. Check backend logs for data processing

## Best Practices

1. **Always import in all rendering components** - This ensures registration
2. **Use descriptive type names** - Avoid conflicts with existing types
3. **Add comprehensive logging during development** - Remove in production
4. **Test in all contexts** - Builder, public form, response view, PDF
5. **Document custom properties** - Help future developers understand your field
6. **Handle edge cases** - Empty values, invalid data, display mode

## Conclusion

Creating custom form fields requires careful attention to registration and data flow. By following this guide and ensuring your custom question is properly imported in all rendering components, you can avoid common issues and create robust custom form fields that work throughout the application.