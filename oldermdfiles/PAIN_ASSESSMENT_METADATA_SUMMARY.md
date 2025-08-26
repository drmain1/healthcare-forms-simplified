# Pain Assessment Panel - Metadata Implementation Summary

## Core Problem
Pain assessment panel fields are being duplicated in PDFs because the pattern lacks proper metadata tags for detection.

## Current Implementation Status

### Frontend Component Location
**File**: `/frontend/src/utils/toolboxConfig.ts` (Lines 337-346)

**Current Configuration**:
```javascript
{
  name: 'pain-assessment',
  title: 'Complete Pain Assessment (VAS)',
  iconName: 'icon-panel',
  json: {
    type: 'panel',  // ✅ Fixed from 'custom_table'
    name: 'pain_assessment_panel',
    title: 'Visual Analog Scale & Pain Assessment',
    metadata: { patternType: 'pain_assessment' },  // ✅ Added
    elements: [...]  // Nested panels for body parts
  }
}
```

### Backend Pattern Detection
**File**: `/backend-go/internal/services/pattern_detector.go` (Lines 323-378)

**Detection Method**: 
- Looks for `metadata.patternType == "pain_assessment"`
- Recursively collects ALL nested field names for tracking
- Returns all field names in ElementNames array to prevent duplicates

### Backend Renderer
**File**: `/backend-go/internal/services/pain_assessment.go`
- Uses `RenderCustomTable()` for actual HTML generation
- Converts panel structure to Element format

## Critical Issue: Metadata Not Appearing in JSON

### Why It's Not Working
The metadata tag needs to be initialized in the frontend BEFORE the component is used:

1. **Required Import Order** (in FormBuilderContainer.tsx, PublicFormFill.tsx, ResponseDetail.tsx):
```javascript
// FIRST - Initialize metadata support
import { initializeSurveyMetadata } from '../../utils/initializeSurveyMetadata';
initializeSurveyMetadata();

// SECOND - Import custom questions (they inherit metadata property)
import './CustomQuestions';  // If pain assessment is a custom question
```

2. **SurveyJS Creator Configuration**:
- The Survey Creator might be stripping metadata during form building
- Need to ensure `allowEditExpression` is enabled for metadata property

3. **Toolbox Registration**:
- The toolbox item must be registered AFTER metadata initialization
- Check if pain-assessment is being registered as a custom component

## Fields That Need Tracking
The panel contains these field names that MUST be in ElementNames:
- `has_neck_pain`, `neck_pain_intensity`, `neck_pain_frequency`
- `has_upper_back_pain`, `upper_back_intensity`, `upper_back_frequency`
- `has_shoulder_pain`, `shoulder_side`, `shoulder_intensity`, `shoulder_frequency`
- `has_hip_pain`, `hip_side`, `hip_intensity`, `hip_frequency`
- `has_arm_pain`, `arm_side`, `arm_intensity`, `arm_frequency`
- `has_leg_pain`, `leg_side`, `leg_intensity`, `leg_frequency`
- `has_hand_pain`, `hand_side`, `hand_intensity`, `hand_frequency`
- `has_foot_pain`, `foot_side`, `foot_intensity`, `foot_frequency`

## Verification Steps

### 1. Check Browser Console
```javascript
// In FormBuilder, after loading:
console.log(Survey.Serializer.findProperty("question", "metadata"));
// Should return property object, not undefined
```

### 2. Check Saved Form JSON
Look for this structure in the database:
```json
{
  "type": "panel",
  "name": "pain_assessment_panel",
  "metadata": { "patternType": "pain_assessment" },
  "elements": [...]
}
```

### 3. Backend Logs
When generating PDF:
```
DEBUG: Found pain assessment panel via metadata, name: pain_assessment_panel, fields: [has_neck_pain, neck_pain_intensity, ...]
DEBUG: Marked field 'has_neck_pain' as rendered by pattern 'pain_assessment'
```

## Quick Fix If Metadata Still Missing

### Option 1: Force metadata in toolbox registration
```javascript
// In toolboxConfig.ts or where toolbox items are registered
Survey.JsonObject.metaData.addProperty("panel", {
  name: "metadata:patternType",
  default: null
});
```

### Option 2: Add to existing forms programmatically
```javascript
// Before saving form
if (element.name === 'pain_assessment_panel') {
  element.metadata = { patternType: 'pain_assessment' };
}
```

## Dependencies
- **SurveyJS**: Must support metadata property on panels
- **initializeSurveyMetadata()**: Must be called before component registration
- **Pattern Detector**: Checks metadata.patternType
- **PDF Orchestrator**: Uses ElementNames to track rendered fields
- **Generic Field Renderer**: Fallback for orphaned fields

## Success Criteria
✅ Metadata appears in saved form JSON  
✅ Pattern detector finds pain_assessment via metadata  
✅ All nested fields tracked in ElementNames  
✅ No duplicate rendering in PDF output  
✅ Debug logs show proper field tracking