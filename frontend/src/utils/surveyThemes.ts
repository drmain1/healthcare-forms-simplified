/* ================================
   SurveyJS Theme Configuration
   Separate themes for builder and viewer
   ================================ */

import { ITheme } from 'survey-core';

// Patient Form Theme - Warm Beige
export const patientFormTheme: Partial<ITheme> = {
  themeName: 'patient-form',
  isPanelless: true,
  cssVariables: {
    // Background colors
    '--sjs-general-backcolor': '#efe9dc',
    '--sjs-general-backcolor-dim': '#f5f2e8',
    '--sjs-general-backcolor-dim-light': '#faf8f3',
    '--sjs-general-backcolor-dim-dark': '#e8e2d4',
    
    // Primary colors
    '--sjs-primary-backcolor': '#8e8e8e',
    '--sjs-primary-backcolor-light': 'rgba(142, 142, 142, 0.1)',
    '--sjs-primary-backcolor-dark': '#6e6e6e',
    '--sjs-primary-forecolor': '#ffffff',
    '--sjs-primary-forecolor-light': 'rgba(255, 255, 255, 0.9)',
    
    // Secondary colors
    '--sjs-secondary-backcolor': '#757575',
    '--sjs-secondary-backcolor-light': 'rgba(117, 117, 117, 0.1)',
    '--sjs-secondary-backcolor-semi-light': 'rgba(117, 117, 117, 0.15)',
    '--sjs-secondary-forecolor': '#424242',
    '--sjs-secondary-forecolor-light': 'rgba(66, 66, 66, 0.9)',
    
    // Border colors
    '--sjs-border-default': '#ccc3b3',
    '--sjs-border-light': '#d4cdbf',
    '--sjs-border-inside': '#e0dbd2',
    
    // Typography
    '--sjs-font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    '--sjs-font-size': '16px',
    '--sjs-question-title-font-size': '16px',
    '--sjs-font-pagetitle-size': '30px',
    '--sjs-font-editorfont-size': '16px',
    
    // Spacing
    '--sjs-base-unit': '8px',
    '--sjs-corner-radius': '8px',
    '--sjs-element-padding': '12px 16px',
    
    // Shadows
    '--sjs-shadow-small': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--sjs-shadow-medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '--sjs-shadow-large': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    
    // Special elements
    '--sjs-special-red': '#f44336',
    '--sjs-special-red-light': 'rgba(244, 67, 54, 0.1)',
    '--sjs-special-red-forecolor': '#ffffff',
    '--sjs-special-green': '#4caf50',
    '--sjs-special-green-light': 'rgba(76, 175, 80, 0.1)',
    '--sjs-special-green-forecolor': '#ffffff',
    '--sjs-special-blue': '#2196f3',
    '--sjs-special-blue-light': 'rgba(33, 150, 243, 0.1)',
    '--sjs-special-blue-forecolor': '#ffffff',
    '--sjs-special-yellow': '#ff9800',
    '--sjs-special-yellow-light': 'rgba(255, 152, 0, 0.1)',
    '--sjs-special-yellow-forecolor': '#ffffff',
  },
};

// Form Builder Theme - Material UI Style
export const formBuilderTheme: Partial<ITheme> = {
  themeName: 'form-builder',
  isPanelless: false,
  cssVariables: {
    // Background colors
    '--sjs-general-backcolor': '#ffffff',
    '--sjs-general-backcolor-dim': '#fafafa',
    '--sjs-general-backcolor-dim-light': '#f5f5f5',
    '--sjs-general-backcolor-dim-dark': '#eeeeee',
    
    // Primary colors (Material Blue)
    '--sjs-primary-backcolor': '#1976d2',
    '--sjs-primary-backcolor-light': 'rgba(25, 118, 210, 0.1)',
    '--sjs-primary-backcolor-dark': '#1565c0',
    '--sjs-primary-forecolor': '#ffffff',
    '--sjs-primary-forecolor-light': 'rgba(255, 255, 255, 0.9)',
    
    // Secondary colors
    '--sjs-secondary-backcolor': '#9c27b0',
    '--sjs-secondary-backcolor-light': 'rgba(156, 39, 176, 0.1)',
    '--sjs-secondary-backcolor-semi-light': 'rgba(156, 39, 176, 0.15)',
    '--sjs-secondary-forecolor': '#ffffff',
    '--sjs-secondary-forecolor-light': 'rgba(255, 255, 255, 0.9)',
    
    // Border colors
    '--sjs-border-default': '#e0e0e0',
    '--sjs-border-light': '#f5f5f5',
    '--sjs-border-inside': '#eeeeee',
    
    // Typography
    '--sjs-font-family': "'Roboto', 'Helvetica', 'Arial', sans-serif",
    '--sjs-font-size': '14px',
    '--sjs-question-title-font-size': '16px',
    '--sjs-font-pagetitle-size': '24px',
    '--sjs-font-editorfont-size': '14px',
    
    // Spacing
    '--sjs-base-unit': '8px',
    '--sjs-corner-radius': '4px',
    '--sjs-element-padding': '12px 16px',
    
    // Material shadows
    '--sjs-shadow-small': '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    '--sjs-shadow-medium': '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
    '--sjs-shadow-large': '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    
    // Special elements
    '--sjs-special-red': '#f44336',
    '--sjs-special-red-light': 'rgba(244, 67, 54, 0.1)',
    '--sjs-special-red-forecolor': '#ffffff',
    '--sjs-special-green': '#4caf50',
    '--sjs-special-green-light': 'rgba(76, 175, 80, 0.1)',
    '--sjs-special-green-forecolor': '#ffffff',
    '--sjs-special-blue': '#2196f3',
    '--sjs-special-blue-light': 'rgba(33, 150, 243, 0.1)',
    '--sjs-special-blue-forecolor': '#ffffff',
    '--sjs-special-yellow': '#ff9800',
    '--sjs-special-yellow-light': 'rgba(255, 152, 0, 0.1)',
    '--sjs-special-yellow-forecolor': '#ffffff',
  },
};

// Apply theme to SurveyJS instance
export const applyTheme = (survey: any, theme: Partial<ITheme>) => {
  if (survey && theme.cssVariables) {
    // Apply CSS variables
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      survey.themeVariables[key] = value;
    });
    
    // Apply other theme properties
    if (theme.isPanelless !== undefined) {
      survey.showQuestionNumbers = !theme.isPanelless;
    }
  }
};

// Get theme based on context
export const getThemeForContext = (isBuilder: boolean, isPreview: boolean): Partial<ITheme> => {
  if (isBuilder && !isPreview) {
    return formBuilderTheme;
  }
  return patientFormTheme;
};