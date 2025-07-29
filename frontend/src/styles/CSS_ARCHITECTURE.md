# CSS Architecture Documentation

## Overview
This document outlines the CSS architecture implemented for the healthcare forms application. The architecture separates styles between the form builder (admin interface) and the form viewer (patient-facing interface).

## Directory Structure (Updated July 22, 2025)

```
src/styles/
├── base/                    # Foundation styles
│   ├── _variables.css      # CSS custom properties for design tokens
│   ├── _reset.css          # Modern CSS reset/normalize
│   └── _typography.css     # Typography rules and Inter font setup
├── main.css               # Main entry point that imports all styles
├── tailwind.css           # Tailwind CSS imports
├── form-viewer-styles.css # Patient-facing form styles
├── height-weight-slider.css # Custom slider styling
└── compatibility.css      # Tailwind/MUI/SurveyJS compatibility layer
```

### Recently Removed Files:
- ❌ `App.css` - Removed (unused React demo styles)
- ❌ `index.css` - Removed (redundant with reset.css)
- ❌ `form-builder-styles.css` - Consolidated into main.css
- ❌ `surveyjs-theme.css` - Removed (legacy theme)
- ❌ Multiple unused SurveyJS theme variations

## Design System

### Color Palette

#### Warm Beige Theme (Patient Forms)
- Background: `#efe9dc` (warm beige)
- Light Background: `#f5f2e8`
- Border: `#ccc3b3`
- Divider: `#d4cdbf`
- Button Primary: `#8e8e8e` (gray)
- Button Hover: `#6e6e6e`

#### Material UI Theme (Form Builder)
- Primary: `#1976d2` (blue)
- Primary Dark: `#1565c0`
- Secondary: `#9c27b0` (purple)
- Background: `#ffffff`
- Surface: `#fafafa`

### Typography
- Primary Font: Inter (patient forms)
- Secondary Font: Roboto (form builder)
- Base Size: 16px
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px

### Spacing System
Based on 8px unit:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px

## Implementation Guidelines

### 1. Scoped Styles
All styles are scoped using parent classes to prevent conflicts:

```css
/* Patient form styles only apply within .patient-form-view */
.patient-form-view .sd-input {
  background-color: var(--color-beige-bg);
  border: 1px solid var(--color-beige-border);
}

/* Builder styles only apply within .form-builder-view */
.form-builder-view .sd-input {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
}
```

### 2. Component Usage

#### Form Builder Component
```tsx
<Box className="form-builder-view">
  <SurveyCreatorComponent creator={creator} />
</Box>
```

#### Patient Form Component
```tsx
<Box className="patient-form-view">
  <Survey model={survey} />
</Box>
```

#### Preview Mode
```tsx
<Box className="form-preview-view">
  <Survey model={survey} />
</Box>
```

### 3. Theme Configuration

The application uses dynamic theme configuration through `surveyThemes.ts`:

```typescript
// For patient forms
const survey = createSurveyModel(json, { isBuilder: false, isPreview: false });

// For form builder
const survey = createSurveyModel(json, { isBuilder: true, isPreview: false });

// For preview mode
const survey = createSurveyModel(json, { isBuilder: true, isPreview: true });
```

## Best Practices

### 1. Use CSS Variables
Always use CSS variables for colors, spacing, and other design tokens:
```css
color: var(--color-primary);
padding: var(--space-4);
```

### 2. Avoid !important
The architecture is designed to avoid specificity conflicts. Use proper scoping instead of !important.

### 3. Mobile-First
Write mobile styles first, then use media queries for larger screens:
```css
.element {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .element {
    /* Tablet and desktop styles */
  }
}
```

### 4. Component Isolation
Each component's styles should be isolated and not affect other components:
- Use specific class names
- Scope styles properly
- Avoid global selectors

## Migration Guide

### From Old System to New
1. Remove inline `sx` props where possible
2. Add appropriate wrapper class (`patient-form-view`, `form-builder-view`, etc.)
3. Use CSS variables instead of hard-coded values
4. Test in both builder and viewer contexts

### Example Migration
```tsx
// Old
<Box sx={{ backgroundColor: '#efe9dc', padding: '16px' }}>

// New
<Box className="patient-form-view">
```

## Maintenance

### Adding New Colors
1. Add to `_variables.css`
2. Update theme configurations in `surveyThemes.ts`
3. Document in this file

### Creating New Components
1. Create new CSS file in `components/` directory
2. Import in `main.css`
3. Use proper scoping and CSS variables
4. Test in all contexts (builder, viewer, preview)

## Known Issues & Future Improvements

1. ~~Legacy `surveyjs-theme.css` needs to be refactored into component files~~ ✅ FIXED - Removed July 22, 2025
2. Some Material-UI components still use inline styles (ongoing)
3. Print styles need enhancement  
4. Dark mode support to be added

## Recent Updates (July 22, 2025)

### ✅ Completed Cleanup:
- **Removed 13 CSS files total** (App.css, index.css, form-builder-styles.css, 10+ legacy themes)
- **Integrated design system** - CSS variables now properly imported in main.css
- **Added bundle monitoring** - `npm run bundle-size` for performance tracking
- **Created MigrationWrapper** - Helper component for gradual Tailwind adoption
- **Consolidated styles** - form-builder-styles.css merged into main.css (only 4 lines!)
- **Simplified imports** - Removed unnecessary CSS imports from components

### 📊 Current Bundle Size:
- **CSS**: 155.76 kB gzipped (target: under 200 kB) ✅
- **JS**: 1.18 MB gzipped (target: under 1.3 MB) ✅

### 🏗️ Architecture Improvements:
- **Cleaner structure**: Only essential CSS files remain
- **Better organization**: Clear separation of concerns
- **Reduced complexity**: Fewer files to maintain
- **Performance maintained**: No increase in bundle size despite improvements