# CSS Clean Slate Guide

## Date: January 16, 2025

## Overview
We've reset the CSS architecture to use standard SurveyJS themes as a clean foundation. This guide explains the new structure and how to customize styling for different parts of the application.

## Current Architecture

### 1. **Minimal Main CSS** (`/styles/main.css`)
- Contains only essential utility classes
- No SurveyJS-specific styling
- No theme overrides

### 2. **Separate Context-Specific CSS Files**
- `form-builder-styles.css` - For form builder customizations
- `form-viewer-styles.css` - For patient-facing form customizations

### 3. **Theme Configuration** (`/config/surveyThemes.js`)
- Currently uses default SurveyJS themes
- Easy to switch between available themes
- Functions ready for custom theme application

## Available SurveyJS Themes

SurveyJS provides these built-in themes:
- `"defaultV2"` - Modern flat design (current default)
- `"modern"` - Clean modern look
- `"defaultV2-dark"` - Dark mode variant
- `"layered"` - Classic layered appearance
- `"solid"` - Solid color backgrounds
- `"double-border"` - Bordered design
- `"plain"` - Minimal styling

## How to Customize

### 1. **Form Builder Styling**
Edit `/styles/form-builder-styles.css`:
```css
/* Example: Change toolbox background */
.svc-toolbox {
  background-color: #f5f5f5;
}

/* Example: Adjust creator height */
.svc-creator {
  height: calc(100vh - 64px); /* Account for header */
}
```

### 2. **Patient Form Styling**
Edit `/styles/form-viewer-styles.css`:
```css
/* Example: Style the form container */
.patient-form-view {
  background-color: #fafafa;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* Example: Style survey questions */
.patient-form-view .sv-question__title {
  color: #333;
  font-weight: 500;
}
```

### 3. **Changing Themes**
To switch to a different built-in theme, update `/config/surveyThemes.js`:
```javascript
export const applySurveyTheme = (survey, isViewer = false) => {
  // Example: Use modern theme
  survey.applyTheme("modern");
  
  // Or use different themes for builder vs viewer
  const theme = isViewer ? "defaultV2" : "modern";
  survey.applyTheme(theme);
};
```

### 4. **Custom Theme Variables**
For fine-grained control, you can override CSS variables:
```css
/* In form-viewer-styles.css */
.patient-form-view {
  /* Primary color */
  --sjs-primary-backcolor: #1976d2;
  --sjs-primary-forecolor: #ffffff;
  
  /* Background colors */
  --sjs-general-backcolor: #ffffff;
  --sjs-general-backcolor-dim: #f5f5f5;
  
  /* Typography */
  --sjs-font-family: 'Inter', -apple-system, sans-serif;
  --sjs-font-size: 16px;
  
  /* Borders and radius */
  --sjs-corner-radius: 8px;
  --sjs-border-default: #e0e0e0;
}
```

## Best Practices

### 1. **Use CSS Classes for Scoping**
Always scope your styles to prevent conflicts:
```css
/* Good - Scoped to form builder */
.svc-creator .sv-button {
  /* styles */
}

/* Bad - Affects everything */
.sv-button {
  /* styles */
}
```

### 2. **Avoid !important**
Use specific selectors instead of `!important`:
```css
/* Good - Specific selector */
.patient-form-view .sv-root-modern .sv-button {
  background-color: #1976d2;
}

/* Bad - Using !important */
.sv-button {
  background-color: #1976d2 !important;
}
```

### 3. **Test Both Contexts**
Always verify that changes don't affect the other context:
1. Test form builder after changing viewer styles
2. Test patient forms after changing builder styles

### 4. **Use CSS Variables**
Leverage SurveyJS CSS variables for consistency:
```css
.custom-element {
  background-color: var(--sjs-primary-backcolor);
  color: var(--sjs-primary-forecolor);
  border-radius: var(--sjs-corner-radius);
}
```

## Common Customizations

### Change Primary Color
```css
.patient-form-view {
  --sjs-primary-backcolor: #4caf50; /* Green */
  --sjs-primary-backcolor-dark: #388e3c;
  --sjs-primary-backcolor-light: rgba(76, 175, 80, 0.1);
}
```

### Custom Fonts
```css
/* Add to index.html */
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

/* Apply in CSS */
.patient-form-view {
  --sjs-font-family: 'Inter', sans-serif;
}
```

### Button Styling
```css
.patient-form-view .sv-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.patient-form-view .sv-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

### Input Field Styling
```css
.patient-form-view .sv-input,
.patient-form-view .sv-text {
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  transition: border-color 0.2s ease;
}

.patient-form-view .sv-input:focus,
.patient-form-view .sv-text:focus {
  border-color: var(--sjs-primary-backcolor);
  outline: none;
}
```

## Troubleshooting

### Styles Not Applying
1. Check that the CSS file is imported in the component
2. Verify the selector specificity is high enough
3. Use browser DevTools to inspect computed styles

### Conflicts Between Builder and Viewer
1. Ensure styles are properly scoped with parent classes
2. Check for global selectors that might leak
3. Review the import order in components

### Theme Not Changing
1. Clear browser cache
2. Check that theme functions are being called
3. Verify no CSS overrides are blocking theme styles

## Future Enhancements

Consider these improvements as the application grows:

1. **CSS Modules or Styled Components**
   - Better style isolation
   - Component-specific styling
   - No global namespace pollution

2. **Theme Toggle**
   - Allow users to switch themes
   - Dark mode support
   - High contrast accessibility mode

3. **CSS-in-JS**
   - Dynamic theme switching
   - Runtime style generation
   - Better TypeScript support

4. **Design Tokens**
   - Centralized design system
   - Consistent spacing, colors, typography
   - Easy brand updates

## Resources

- [SurveyJS Theme Documentation](https://surveyjs.io/form-library/documentation/manage-default-themes-and-styles)
- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Scoping Best Practices](https://css-tricks.com/strategies-keeping-css-specificity-low/)