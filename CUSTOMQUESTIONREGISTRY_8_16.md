# Custom Question Registry Documentation
**Created: August 16, 2025**

## 🎯 Overview

The Custom Question Registry provides a centralized, maintainable system for managing custom SurveyJS question types in the Healthcare Forms platform. This solves the critical issue of custom question data not properly flowing from form submission to response viewing.

## 🔧 Problem Solved

Previously, custom question types (like `patient_demographics`) were not consistently registered across different components, leading to:
- Data loss during form submission
- Missing data in response views
- Inconsistent import patterns
- Maintenance difficulties

## 🐞 Important Fix: Data Submission Logic (August 16, 2025)

A critical bug was identified and fixed where form submission data was being sent to the backend in a format that was incompatible with the response viewing and data analysis components.

### The Problem: `survey.getPlainData()` vs `survey.data`

The form submission logic was previously using `survey.getPlainData()`. This SurveyJS function returns a detailed, array-like object containing rich metadata about each question, structured with numeric keys (`"0"`, `"1"`, etc.). While useful for creating custom reports, **this is the incorrect format for data submission.**

This caused the backend to store data in a structure that the frontend couldn't correctly interpret when displaying responses, leading to empty fields.

### The Solution: Using `survey.data`

The fix was to change the submission logic to use `survey.data` instead. The `survey.data` object is a simple, clean **key-value map** of question names to their corresponding values. This is the expected format for both the backend and for reloading survey data.

The corrected data flow ensures that the data shape remains consistent from submission to display.

## 📁 File Structure

```
frontend/src/components/FormBuilder/
├── customQuestionRegistry.ts       # Central registry and utilities
├── PatientDemographicsQuestion.tsx  # Custom patient demographics component
├── BodyPainDiagramQuestion.tsx     # Body pain diagram component
├── BodyDiagram2Question.tsx        # Body sensation diagram component
├── DateOfBirthQuestion.tsx         # Date of birth with age calculation
└── BodyDiagramQuestion.tsx         # Original body diagram component
```

## 🚀 Implementation

### 1. Central Registry (`customQuestionRegistry.ts`)

```typescript
// Centralized registry for all custom SurveyJS question types
import './DateOfBirthQuestion';
import './BodyPainDiagramQuestion';
import './BodyDiagram2Question';
import './PatientDemographicsQuestion';
import './BodyDiagramQuestion';

export const CUSTOM_QUESTION_TYPES = {
  DATE_OF_BIRTH: 'dateofbirth',
  BODY_PAIN_DIAGRAM: 'bodypaindiagram',
  BODY_DIAGRAM: 'bodydiagram',
  BODY_DIAGRAM_2: 'bodydiagram2',
  PATIENT_DEMOGRAPHICS: 'patient_demographics',
} as const;
```

### 2. Data Extraction Function

The `extractCustomQuestionData` function handles nested data structures and flattens them for backend compatibility:

```typescript
export function extractCustomQuestionData(surveyData: any): any {
  const extractedData = { ...surveyData };
  
  // Handle patient demographics - flatten the nested object
  if (surveyData.patient_demographics) {
    const demographics = surveyData.patient_demographics;
    
    // Extract key fields to top level
    if (demographics.firstName) extractedData.first_name = demographics.firstName;
    if (demographics.lastName) extractedData.last_name = demographics.lastName;
    if (demographics.dob) extractedData.patient_dob = demographics.dob;
    // ... etc
    
    // Keep the original nested object as well
    extractedData.patient_demographics = demographics;
  }
  
  return extractedData;
}
```

## 📋 Custom Question Types

### 1. Patient Demographics (`patient_demographics`)
**Purpose**: Captures comprehensive patient information
**Data Structure**:
```javascript
{
  firstName: string,
  lastName: string,
  preferredName: string,
  dob: string,
  email: string,
  primaryPhone: string,
  secondaryPhone: string,
  cellPhone: string,
  address: string,
  city: string,
  state: string,
  zip: string
}
```
**Flattened Fields**: Creates `first_name`, `last_name`, `patient_dob`, etc. at root level

### 2. Body Pain Diagram (`bodypaindiagram`)
**Purpose**: Visual pain area marking with intensity levels
**Data Structure**:
```javascript
[{
  id: string,
  x: number,      // 0-100 percentage
  y: number,      // 0-100 percentage
  intensity: number,  // 0-10 scale
  label?: string
}]
```

### 3. Body Sensation Diagram (`bodydiagram2`)
**Purpose**: Maps different sensation types (numbness, burning, etc.)
**Data Structure**:
```javascript
[{
  id: string,
  x: number,
  y: number,
  sensation: 'numbness' | 'aching' | 'burning' | 'pins_and_needles' | 'stabbing'
}]
```

### 4. Date of Birth (`dateofbirth`)
**Purpose**: Special date picker with automatic age calculation
**Data Structure**:
```javascript
{
  dob: string,    // ISO date format
  age?: number    // Calculated age
}
```

## 🔄 Data Flow

### Form Submission (PublicFormFill.tsx)
1. Import the registry: `import '../FormBuilder/customQuestionRegistry';`
2. On form completion, get the simple key-value data object and process it:
```javascript
// 1. Get the simple key-value data object from the survey
let submissionData = sender.data;

// 2. (Optional) Pass data through an extractor for special handling, like flattening.
submissionData = extractCustomQuestionData(submissionData);

// 3. Submit flattened data to backend
handleFormSubmission(submissionData);
```

### Response Viewing (ResponseDetail.tsx)
1. Import the registry to register all custom types
2. SurveyJS automatically recognizes and renders custom questions
3. Both nested and flattened data are available

## 🛠️ Usage Examples

### Adding to a Component
```typescript
// Simply import the registry - all custom questions are registered
import '../FormBuilder/customQuestionRegistry';
import { extractCustomQuestionData } from '../FormBuilder/customQuestionRegistry';
```

### Creating a New Custom Question
1. Create your custom question component
2. Add it to `customQuestionRegistry.ts`:
```typescript
import './YourNewQuestion';

export const CUSTOM_QUESTION_TYPES = {
  // ... existing types
  YOUR_NEW_TYPE: 'yournewtype',
};
```
3. Update `extractCustomQuestionData` if special data handling is needed

### Accessing Custom Question Data
```typescript
// Correct way to get and process submission data
const submissionData = extractCustomQuestionData(surveyModel.data);

// Patient name is available as both:
submissionData.patient_demographics.firstName  // Nested
submissionData.first_name                      // Flattened
```

## 🐛 Debugging

### Check Registration
```javascript
console.log('[Debug] All questions:', surveyModel.getAllQuestions().map(q => ({
  name: q.name,
  type: q.getType(),
  hasValue: !!q.value
})));
```

### Verify Data Extraction
```javascript
const extracted = extractCustomQuestionData(data);
console.log('[Debug] Extracted data:', extracted);
console.log('[Debug] Has patient demographics:', !!extracted.patient_demographics);
```

## ✅ Benefits

1. **Single Source of Truth**: All custom questions in one place
2. **No Missed Imports**: Import once, get all custom questions
3. **Data Consistency**: Automatic handling of nested structures
4. **Backward Compatible**: Preserves both nested and flattened formats
5. **Easy Extension**: Simple process to add new custom questions
6. **Maintainable**: Clear separation of concerns
7. **Type Safety**: TypeScript interfaces for data structures

## 🚨 Important Notes

1. **Always import the registry** in components that render forms:
   - `PublicFormFill.tsx`
   - `ResponseDetail.tsx`
   - Any form preview/builder components

2. **Data is stored in multiple formats** for compatibility:
   - Nested format: `patient_demographics: { firstName, lastName, ... }`
   - Flattened format: `first_name`, `last_name`, etc.

3. **Backend expectations**:
   - The backend expects certain fields at root level (e.g., `first_name`, `last_name`)
   - The extraction function ensures these are available

4. **Custom question naming convention**:
   - Use snake_case for question type names
   - Use descriptive names that indicate the question's purpose

## 🔮 Future Enhancements

1. **Validation Rules**: Add centralized validation for custom question types
2. **Data Transformers**: More sophisticated data transformation pipelines
3. **Lazy Loading**: Dynamic import of custom questions based on form needs
4. **Question Templates**: Pre-configured custom questions with common settings
5. **Export/Import**: Ability to export custom question configurations

## 📊 Testing Checklist

- [ ] Custom question renders in form builder
- [ ] Data captures correctly during form filling
- [ ] Data submits to backend with proper structure
- [ ] Data displays correctly in response view
- [ ] PDF generation includes custom question data
- [ ] Clinical summary processes custom question data

## 🎯 Migration Guide (for existing forms)

If you have existing forms with custom questions that aren't working:

1. Ensure the custom question is registered in `customQuestionRegistry.ts`
2. Import the registry in your component
3. Use `extractCustomQuestionData` on `survey.data` before submission
4. Test the data flow end-to-end

---

**Last Updated**: August 16, 2025
**Author**: Healthcare Forms Team
**Status**: ✅ Production Ready
