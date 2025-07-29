# Form Builder Theme Reset to Default

## Date: June 16, 2025

## What We Did
Reset the SurveyJS Form Builder to use the factory default "flat" theme.

## Changes Made
1. **Commented out custom theme CSS** in `/frontend/src/styles/main.css`:
   - Line 19: `/* @import './surveyjs-theme.css'; */`
   - This removed all custom Material-UI inspired styling

2. **Verified no theme is applied programmatically**:
   - FormBuilder uses `createMinimalSurveyCreator()` which doesn't apply any theme
   - The minimal config has `allowChangeTheme: false`
   - No `creator.theme = ...` assignment happens

## Result
The form builder now uses SurveyJS's default "flat" theme with:
- Default colors and styling
- Standard SurveyJS appearance
- No custom CSS overrides affecting the builder

## To Re-enable Custom Theme
If you want to apply custom themes again:
1. Uncomment the theme import in `main.css`
2. OR switch to using `createSurveyCreator()` instead of `createMinimalSurveyCreator()`

## Notes
- Patient-facing forms can still have custom styling by using scoped CSS
- The form builder and form viewer can have different themes
- Consider using SurveyJS's built-in theme system instead of CSS overrides