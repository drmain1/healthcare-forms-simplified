# 🚫 DO NOT MODIFY - Critical Components

This document lists components and files that should **NOT BE MODIFIED** during UI modernization. These are critical to the application's core functionality.

## ⛔ SurveyJS Core Components

### Form Rendering Engine
- `src/components/FormRenderer/PublicFormFill.tsx` - Patient form filling interface
- `src/utils/surveyConfig.ts` - Core SurveyJS configuration
- `src/utils/surveyConfigMinimal.ts` - Minimal SurveyJS configuration
- `src/config/surveyThemes.ts` - Theme configuration for SurveyJS

**Why**: These handle the actual form rendering and submission logic. Any changes could break form functionality.

## ⛔ Healthcare-Specific Components

### Custom Question Types
- `src/components/FormBuilder/BodyDiagramField.tsx` - Body diagram for pain mapping
- `src/components/FormBuilder/BodyDiagramQuestion.tsx` - Body diagram integration
- `src/components/FormBuilder/BodyPainDiagram.tsx` - Pain mapping functionality
- `src/components/FormBuilder/BodyPainDiagramQuestion.tsx` - Pain diagram question type
- `src/components/FormBuilder/DateOfBirthQuestion.tsx` - HIPAA-compliant date input
- `src/components/FormBuilder/HeightWeightSlider.tsx` - Medical measurement input
- `src/components/FormBuilder/CustomDropdownItem.tsx` - Healthcare-specific dropdown

**Why**: These implement healthcare-specific functionality with regulatory compliance requirements.

## ⛔ Security & PHI Protection

### Security Wrappers
- `src/components/Common/PHILoadingBoundary.tsx` - HIPAA compliance wrapper
- `src/components/Common/SecurePHIWrapper.tsx` - Protected health information wrapper
- `src/components/SessionTimeoutWarning.tsx` - Security timeout component
- `src/utils/sessionTimeout.ts` - Session management logic

**Why**: These ensure HIPAA compliance and protect patient data.

## ⛔ API & State Management

### Redux/RTK Query
- `src/store/` - Entire directory (Redux store configuration)
- `src/store/api/` - All API slice files
- `src/store/slices/` - All Redux slices

### Services
- `src/services/authService.ts` - Authentication logic
- `src/services/vertexAIService.ts` - AI integration
- `src/services/geminiService.ts` - Gemini AI service

**Why**: These handle all data flow, API calls, and authentication. Changes could break data persistence.

## ⛔ Form Validation & Processing

### Core Logic
- Form validation rules in SurveyJS schemas
- Response submission logic
- FHIR mapping functionality
- Auto-save functionality

**Why**: These ensure data integrity and compliance with healthcare standards.

## ✅ Safe to Modify

You CAN safely modify:
- Visual styling (colors, spacing, typography)
- Layout structure (as long as functionality remains)
- CSS classes and styling approaches
- Component wrappers for styling purposes
- Loading states and animations
- Icons and visual assets

## 🎯 General Rules

1. **Test After Every Change**: Always verify form creation, filling, and submission still work
2. **Preserve Props**: Never change component props or their types
3. **Keep Event Handlers**: Don't modify onClick, onChange, or other event handlers
4. **Maintain Data Flow**: Don't change how data is passed between components
5. **Check Console**: Watch for errors after any changes

## 🚨 Red Flags

Stop immediately if you see:
- Console errors after your changes
- Forms not rendering properly
- Submit buttons not working
- Data not saving
- Authentication issues
- PHI data exposed in logs

## 📞 When in Doubt

If you're unsure whether a component is safe to modify:
1. Check if it imports SurveyJS libraries
2. Look for PHI/HIPAA comments in the code
3. See if it handles form data or authentication
4. When in doubt, ask before modifying

Remember: The goal is to improve the UI without breaking functionality. It's always better to be cautious with healthcare applications.