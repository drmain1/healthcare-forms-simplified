# Mobile UI Investigation Guide - August 19, 2024

## Overview
This document captures the investigation process and findings for styling SurveyJS form elements on mobile, specifically addressing slider tick label visibility issues.

## Key Findings

### SurveyJS Slider Implementation
- **Not nouislider**: SurveyJS uses its own native slider implementation with `type: 'slider'`
- **CSS Prefix**: All SurveyJS slider classes use `.sd-slider__` prefix
- **Theme System**: Uses `DefaultLightPanelless` theme which defaults to dark text colors

### Critical CSS Classes for SurveyJS Sliders

#### Tick Labels & Numbers
- `.sd-slider__label-text` - The actual number text (0, 2, 4, 6, 8, 10)
- `.sd-slider__label` - Container for each label
- `.sd-slider__label-tick` - Vertical tick marks

#### Slider Components
- `.sd-slider__track` - Filled/active portion of slider
- `.sd-slider__inverse-track` - Unfilled portion of slider  
- `.sd-slider__thumb` - Draggable handle
- `.sd-slider__tooltip-value` - Tooltip showing current value

### File Structure & Dependencies

#### CSS Import Order
1. `survey-core/survey-core.css` - Base SurveyJS styles (341KB)
2. `mobile-minimal.css` - Our custom mobile overrides

#### Key Files
- `/src/styles/mobile-minimal.css` - All mobile-specific styling
- `/src/components/FormRenderer/PublicFormFill.tsx` - Applies mobile theme
- `/src/utils/surveyConfigMinimal.ts` - Slider configuration (min, max, step)
- `/src/config/surveyThemes.ts` - Theme configuration

### Investigation Techniques

#### 1. Finding CSS Classes
```bash
# Search for slider-related classes in survey-core.css
grep -n "\.sd-slider" node_modules/survey-core/survey-core.css

# Check what type of slider is being used
grep "type.*slider" src/utils/surveyConfigMinimal.ts
```

#### 2. Understanding CSS Specificity
- SurveyJS applies default colors via CSS variables
- Our overrides need `!important` due to theme system specificity
- Mobile styles are scoped under `.patient-form-view.mobile-minimal`

#### 3. Theme Color Variables
Default SurveyJS color for labels:
```css
color: var(--lbr-slider-label-text-color, var(--sjs-font-editorfont-color, var(--sjs-general-forecolor, rgba(0, 0, 0, 0.91))));
```

### Common Pitfalls

1. **Assuming nouislider**: Initial investigation wrongly assumed nouislider integration
2. **Wrong CSS classes**: `.noUi-value` vs `.sd-slider__label-text`
3. **Missing theme context**: Not realizing theme applies dark colors by default
4. **CSS load order**: Custom styles must come after survey-core.css

### Solution Applied

```css
/* Correct approach for white slider labels on dark background */
.patient-form-view.mobile-minimal .sd-slider__label-text {
  color: white !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
}
```

## Debugging Workflow for Future UI Issues

### Step 1: Identify the Component Type
- Check form configuration files (`surveyConfigMinimal.ts`)
- Look for `type: 'slider'`, `type: 'rating'`, etc.

### Step 2: Find the CSS Classes
- Inspect element in browser DevTools
- Search survey-core.css for class patterns
- Use grep to find class definitions

### Step 3: Check Theme Overrides
- Review what theme is applied (`DefaultLightPanelless`, etc.)
- Check if theme sets conflicting styles
- Look for CSS variables being used

### Step 4: Apply Targeted Overrides
- Scope styles under `.patient-form-view.mobile-minimal`
- Use `!important` when necessary for specificity
- Test on actual mobile device or responsive mode

## Pure CSS vs Framework Considerations

### Advantages of Pure CSS (Current Approach)
- **Zero dependencies** - No bundle size overhead
- **Full control** - Direct styling of SurveyJS generated HTML
- **Performance** - No runtime CSS-in-JS calculations
- **Maintainability** - Single file to manage (`mobile-minimal.css`)

### Why Not Tailwind/Frameworks
- **SurveyJS generates HTML** - Can't add utility classes to auto-generated elements
- **Mobile performance** - Every KB matters on mobile connections
- **Custom design** - Dark gradient theme doesn't fit framework defaults
- **Medical forms** - Need precise control for accessibility/readability

## Resources & References

### SurveyJS Documentation
- Slider API: https://surveyjs.io/form-library/documentation/api-reference/questionslidermodel
- Theme System: https://surveyjs.io/form-library/documentation/manage-default-themes-and-styles
- CSS Customization: https://surveyjs.io/form-library/examples/customize-survey-with-css/reactjs

### CSS Class Reference
- Survey Core CSS: `/node_modules/survey-core/survey-core.css`
- Class naming pattern: `.sd-[component]__[element]`
- Theme variables: `--sjs-*` and `--lbr-*` prefixes

## Slider Color Investigation & Resolution

### The Color Competition Issue
**Problem**: Two colors were overlapping on the slider - teal/green and blue
- Teal color (`#19b394`) - SurveyJS default primary color
- Blue gradient (`#5E9EFF to #7BB8FF`) - Our custom override

**Root Cause**: Multiple CSS rules targeting different slider elements:
- `.sd-slider__track` - Our custom blue gradient
- `.sd-slider__range-track` - SurveyJS default teal (uses `--sjs-primary-backcolor`)
- Both were rendering, causing visual overlap

### Solution: Embrace the Defaults
Instead of fighting the defaults, we removed custom track colors:
```css
/* REMOVED - Was causing color competition
.patient-form-view.mobile-minimal .sd-slider__track {
  background: linear-gradient(90deg, #5E9EFF, #7BB8FF) !important;
}
*/
```

### Current Slider Styling (Clean Approach)
- **Track filled**: Default teal (`#19b394`) from SurveyJS theme
- **Track unfilled**: Semi-transparent white (`rgba(255,255,255,0.2)`)
- **Handle**: Clean white with shadow, no border
- **Labels**: White text with shadow for readability

### To Change Slider Colors in Future
Option 1: Override the CSS variable (affects all primary elements):
```css
.patient-form-view.mobile-minimal {
  --sjs-primary-backcolor: #YourColorHere;
}
```

Option 2: Target specific slider track element:
```css
.patient-form-view.mobile-minimal .sd-slider__range-track {
  background: #YourColorHere !important;
}
```

### Lesson Learned
- Less is more - removing competing styles created cleaner UI
- SurveyJS has multiple track elements (`.sd-slider__track`, `.sd-slider__range-track`)
- Default theme colors can look good when not fighting custom overrides
- Always check for overlapping elements when colors look wrong

## Notes for Future Development

1. **Before hiring designers**: Test incremental CSS improvements first
2. **Figma handoff**: Pure CSS allows direct copying from Figma's CSS output
3. **Component inspiration**: Look for "CSS-only" examples that work with existing HTML structure
4. **Browser testing**: Always test on actual mobile devices, not just responsive mode
5. **Color debugging**: Remove custom styles first to see defaults, then add back selectively

---

*Document created during investigation of slider tick label visibility issue on mobile forms.*
*Updated with slider color competition resolution.*