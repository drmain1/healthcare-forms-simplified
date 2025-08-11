# SurveyJS Toolbox Configuration Analysis
**Date: August 10, 2025**  
**Analysis by: Claude Code**

## Executive Summary

After deep trace analysis of the codebase, I've identified that the application is using `surveyConfigMinimal.ts` as the active toolbox configuration, NOT `minimalToolboxConfig.ts`. The unused file contains different implementations and should be removed to avoid confusion.

## Key Findings

### 1. Active Configuration File
**File:** `frontend/src/utils/surveyConfigMinimal.ts`
- **Status:** ✅ ACTIVE and IN USE
- **Function:** `createMinimalSurveyCreator()`
- **Called by:** `FormBuilderContainer.tsx:46`
- **Pain Assessment Location:** Lines 267-359 (simplified version after recent edit)

### 2. Unused Configuration File  
**File:** `frontend/src/utils/minimalToolboxConfig.ts`
- **Status:** ❌ NOT USED ANYWHERE
- **No imports found** in the codebase
- **Contains:** Different pain assessment implementation with `type: 'custom_table'`
- **Recommendation:** DELETE to avoid confusion

## Pain Assessment Implementation Differences

### Active Implementation (surveyConfigMinimal.ts)
```javascript
const visualAnalogPainAssessment = {
  name: 'visual-analog-pain-assessment',
  title: 'Complete Pain Assessment (VAS)',
  type: 'panel',  // ✅ Standard SurveyJS type
  // ... simplified structure with sliders
}
```

### Unused Implementation (minimalToolboxConfig.ts)
```javascript
{
  name: 'pain-assessment',
  title: 'Complete Pain Assessment (VAS)',
  type: 'custom_table',  // ❌ Never registered as custom component
  // ... complex nested structure
}
```

## Component Registration Flow

1. **Entry Point:** `FormBuilderContainer.tsx`
2. **Line 46:** Calls `createMinimalSurveyCreator()` from `surveyConfigMinimal.ts`
3. **Registered Custom Components:**
   - BodyPainDiagramQuestion
   - HeightWeightSlider
   - DateOfBirthQuestion
   - CustomDropdownItem
4. **Missing:** No registration for `custom_table` type

## Toolbox Items Currently Active

The `surveyConfigMinimal.ts` file adds the following healthcare-specific items:

1. **Insurance Card Capture** - Panel with file upload fields
2. **Patient Vitals** - Height/weight sliders with BMI calculation
3. **Body Pain Diagram** - Visual body diagram for pain location
4. **Visual Analog Pain Assessment** - Simplified pain severity/frequency sliders
5. **Oswestry Disability Index (ODI)** - Comprehensive disability questionnaire
6. **Neck Disability Index (NDI)** - Neck-specific disability assessment
7. **Date of Birth** - Custom component with age calculation
8. **Patient Demographics** - Complete patient information panel
9. **Terms & Conditions** - Legal acceptance components

## File Structure Analysis

```
frontend/src/
├── utils/
│   ├── surveyConfigMinimal.ts     ✅ ACTIVE (1716 lines)
│   ├── minimalToolboxConfig.ts    ❌ UNUSED (653 lines) - TO BE DELETED
│   └── toolboxConfig.ts           ❓ Also contains custom_table type
└── components/
    └── FormBuilder/
        ├── FormBuilderContainer.tsx  ✅ Imports surveyConfigMinimal
        └── [Custom Components...]    ✅ Properly registered
```

## Recommendations

1. **Immediate Action:** Delete `frontend/src/utils/minimalToolboxConfig.ts`
2. **Code Cleanup:** Check if `toolboxConfig.ts` is also unused
3. **Documentation:** Update any developer docs referencing the old file
4. **Naming Convention:** Consider renaming `surveyConfigMinimal.ts` to `surveyToolboxConfig.ts` for clarity

## How to Modify Pain Assessment

To modify the "Complete Pain Assessment (VAS)" component:

1. Edit `frontend/src/utils/surveyConfigMinimal.ts`
2. Locate the `visualAnalogPainAssessment` object (starts at line 267)
3. Modify the structure within the `json` property
4. The component uses standard SurveyJS `panel` type with nested elements
5. Changes will reflect immediately in the FormBuilder toolbox

## Technical Notes

- The confusion likely arose from having two similarly named files
- The `custom_table` type in the unused file would require custom component registration to work
- The active implementation uses only standard SurveyJS types, making it more maintainable
- Recent edit (visible in git status) shows the pain assessment was simplified from the original complex structure

## Verification Commands

To verify these findings:

```bash
# Check for imports of minimalToolboxConfig
grep -r "minimalToolboxConfig" frontend/src/

# Check for imports of surveyConfigMinimal  
grep -r "surveyConfigMinimal" frontend/src/

# Check for custom_table usage
grep -r "custom_table" frontend/src/
```

---

**Last Updated:** August 10, 2025  
**Next Review:** After cleanup is complete