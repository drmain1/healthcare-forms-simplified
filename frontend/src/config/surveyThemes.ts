// ================================
// SurveyJS Theme Configuration
// Clean slate with standard themes
// ================================

// Standard SurveyJS themes available:
// - "defaultV2" (modern flat design)
// - "defaultV2-dark" (dark mode)
// - "layered" (classic layered look)
// - "solid" (solid backgrounds)
// - "double-border" (bordered design)
// - "modern" (clean modern look)

// For now, we'll just use the default theme without customization
// SurveyJS will automatically use its default "defaultV2" theme

// Function to apply theme to a survey (currently does nothing - uses default)
export const applySurveyTheme = (survey: any, isViewer: boolean = false) => {
  // Using default theme - no need to apply anything
  // If you want to change themes later, uncomment and modify:
  // survey.applyTheme("defaultV2");
};

// Function to apply theme to form builder (currently does nothing - uses default)
export const applyCreatorTheme = (creator: any) => {
  // Using default theme - no need to apply anything
  // If you want to change themes later, uncomment and modify:
  // creator.theme = "defaultV2";
};