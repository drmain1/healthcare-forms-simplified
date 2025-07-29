import { ITheme } from 'survey-core';

// Enterprise Light Theme
export const enterpriseLightTheme: Partial<ITheme> = {
  themeName: 'enterprise-light',
  colorPalette: 'light',
  isPanelless: false,
  
  cssVariables: {
    // Primary colors
    '--sjs-primary-background-500': '#0066cc',
    '--sjs-primary-background-400': '#3385d6',
    '--sjs-primary-background-600': '#0052a3',
    '--sjs-primary-foreground-500': '#ffffff',
    
    // Secondary colors
    '--sjs-secondary-background-500': '#6c757d',
    '--sjs-secondary-background-400': '#868e96',
    '--sjs-secondary-background-600': '#545b62',
    
    // Background layers
    '--sjs-general-background-100': '#ffffff',
    '--sjs-general-background-200': '#f8f9fa',
    '--sjs-general-background-300': '#e9ecef',
    '--sjs-general-background-400': '#dee2e6',
    '--sjs-general-background-500': '#ced4da',
    
    // Text colors
    '--sjs-general-foreground-500': '#212529',
    '--sjs-general-foreground-400': '#495057',
    '--sjs-general-foreground-300': '#6c757d',
    '--sjs-general-foreground-200': '#adb5bd',
    
    // Border colors
    '--sjs-border-default': '#dee2e6',
    '--sjs-border-light': '#e9ecef',
    '--sjs-border-inside': '#f8f9fa',
    
    // Status colors
    '--sjs-special-red': '#dc3545',
    '--sjs-special-red-light': '#f8d7da',
    '--sjs-special-green': '#28a745',
    '--sjs-special-green-light': '#d4edda',
    '--sjs-special-blue': '#17a2b8',
    '--sjs-special-blue-light': '#d1ecf1',
    '--sjs-special-yellow': '#ffc107',
    '--sjs-special-yellow-light': '#fff3cd',
    
    // Typography
    '--sjs-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '--sjs-font-size': '14px',
    '--sjs-font-weight': '400',
    '--sjs-header-font-weight': '600',
    '--sjs-title-font-weight': '500',
    '--sjs-subtitle-font-weight': '400',
    
    // Spacing
    '--sjs-base-unit': '8px',
    '--sjs-corner-radius': '6px',
    '--sjs-edge-radius': '4px',
    
    // Shadows
    '--sjs-shadow-small': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
    '--sjs-shadow-medium': '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
    '--sjs-shadow-large': '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
    '--sjs-shadow-inner': 'inset 0 2px 4px rgba(0,0,0,0.06)',
    
    // Questions
    '--sjs-question-background': '#ffffff',
    '--sjs-question-border': '1px solid #dee2e6',
    '--sjs-question-border-radius': '6px',
    '--sjs-question-padding': '20px',
    '--sjs-question-margin': '0 0 20px 0',
    
    // Inputs
    '--sjs-input-background': '#ffffff',
    '--sjs-input-border': '1px solid #ced4da',
    '--sjs-input-border-focus': '1px solid #0066cc',
    '--sjs-input-padding': '10px 12px',
    '--sjs-input-border-radius': '4px',
    
    // Buttons
    '--sjs-button-background': '#0066cc',
    '--sjs-button-background-hover': '#0052a3',
    '--sjs-button-color': '#ffffff',
    '--sjs-button-border-radius': '4px',
    '--sjs-button-padding': '10px 20px',
    '--sjs-button-font-weight': '500',
    '--sjs-button-text-transform': 'none',
    '--sjs-button-letter-spacing': '0.02em'
  }
};

// Enterprise Dark Theme
export const enterpriseDarkTheme: Partial<ITheme> = {
  themeName: 'enterprise-dark',
  colorPalette: 'dark',
  isPanelless: false,
  
  cssVariables: {
    ...enterpriseLightTheme.cssVariables,
    
    // Override for dark theme
    '--sjs-primary-background-500': '#4dabf7',
    '--sjs-primary-background-400': '#74c0fc',
    '--sjs-primary-background-600': '#339af0',
    
    // Dark backgrounds
    '--sjs-general-background-100': '#1a1d21',
    '--sjs-general-background-200': '#22262b',
    '--sjs-general-background-300': '#2a2f36',
    '--sjs-general-background-400': '#343a40',
    '--sjs-general-background-500': '#495057',
    
    // Light text
    '--sjs-general-foreground-500': '#f8f9fa',
    '--sjs-general-foreground-400': '#e9ecef',
    '--sjs-general-foreground-300': '#ced4da',
    '--sjs-general-foreground-200': '#adb5bd',
    
    // Dark borders
    '--sjs-border-default': '#495057',
    '--sjs-border-light': '#343a40',
    '--sjs-border-inside': '#2a2f36',
    
    // Dark inputs
    '--sjs-input-background': '#2a2f36',
    '--sjs-input-border': '1px solid #495057',
    '--sjs-question-background': '#22262b'
  }
};

// High Contrast Theme (Accessibility)
export const enterpriseHighContrastTheme: Partial<ITheme> = {
  themeName: 'enterprise-high-contrast',
  colorPalette: 'contrast',
  isPanelless: false,
  
  cssVariables: {
    ...enterpriseLightTheme.cssVariables,
    
    // High contrast overrides
    '--sjs-primary-background-500': '#000000',
    '--sjs-primary-background-400': '#333333',
    '--sjs-primary-foreground-500': '#ffffff',
    
    // Maximum contrast
    '--sjs-general-background-100': '#ffffff',
    '--sjs-general-background-200': '#ffffff',
    '--sjs-general-foreground-500': '#000000',
    '--sjs-general-foreground-400': '#000000',
    
    // Strong borders
    '--sjs-border-default': '#000000',
    '--sjs-input-border': '2px solid #000000',
    '--sjs-input-border-focus': '3px solid #000000',
    
    // No shadows in high contrast
    '--sjs-shadow-small': 'none',
    '--sjs-shadow-medium': 'none',
    '--sjs-shadow-large': 'none'
  }
};

// Theme configuration helper
export const getEnterpriseTheme = (themeName: 'light' | 'dark' | 'high-contrast' = 'light'): Partial<ITheme> => {
  switch (themeName) {
    case 'dark':
      return enterpriseDarkTheme;
    case 'high-contrast':
      return enterpriseHighContrastTheme;
    default:
      return enterpriseLightTheme;
  }
};

// Apply enterprise customizations
export const applyEnterpriseCustomizations = (creator: any): void => {
  // Add custom CSS classes
  creator.css = {
    ...creator.css,
    root: 'enterprise-creator',
    toolbox: 'enterprise-toolbox',
    propertyGrid: 'enterprise-property-grid'
  };
  
  // Configure for enterprise use
  creator.showSurveyTitle = 'always';
  creator.allowChangeTheme = true;
  creator.showObjectTitles = true;
  creator.showTitlesInExpressions = true;
  
  // Enable advanced features
  creator.maximumChoicesCount = 100; // Support large choice lists
  creator.maximumColumnsCount = 20;  // Support wide matrix questions
  creator.maximumRateValues = 10;    // Support detailed rating scales
  creator.maximumRowsCount = 50;     // Support large matrix questions
};