/**
 * Mobile Theme Fix
 * Forcefully removes SurveyJS theme backgrounds on mobile
 */

export function forceMobileTheme(survey: any) {
  if (!survey) return;
  
  // Override the theme CSS variables at runtime
  const container = document.querySelector('.patient-form-view.mobile-dark');
  if (!container) return;
  
  // Create a style element to override SurveyJS theme with higher specificity
  const styleId = 'mobile-theme-override';
  let styleEl = document.getElementById(styleId);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  // Add CSS rules with very high specificity to override SurveyJS themes
  styleEl.textContent = `
    /* Force mobile dark theme over SurveyJS themes */
    @media (max-width: 768px) {
      .patient-form-view.mobile-dark,
      .patient-form-view.mobile-dark * {
        --sjs-general-backcolor: transparent !important;
        --sjs-general-backcolor-dim: transparent !important;
        --sjs-general-backcolor-dim-light: transparent !important;
        --sjs-general-backcolor-dim-dark: transparent !important;
        --sjs-question-background: transparent !important;
        --sjs-editorpanel-backcolor: transparent !important;
        --sjs-panel-backcolor: transparent !important;
      }
      
      /* Force all SurveyJS containers to be transparent */
      .patient-form-view.mobile-dark .sd-root-modern,
      .patient-form-view.mobile-dark .sv-root-modern,
      .patient-form-view.mobile-dark .sd-container-modern,
      .patient-form-view.mobile-dark .sv-container-modern,
      .patient-form-view.mobile-dark .sd-body,
      .patient-form-view.mobile-dark .sv-body,
      .patient-form-view.mobile-dark .sd-page,
      .patient-form-view.mobile-dark .sv-page,
      .patient-form-view.mobile-dark .sd-page__content,
      .patient-form-view.mobile-dark .sv-page__content,
      .patient-form-view.mobile-dark .sd-panel,
      .patient-form-view.mobile-dark .sv-panel,
      .patient-form-view.mobile-dark .sd-panel__content,
      .patient-form-view.mobile-dark .sv-panel__content,
      .patient-form-view.mobile-dark .sd-question,
      .patient-form-view.mobile-dark .sv-question,
      .patient-form-view.mobile-dark .sd-question__content,
      .patient-form-view.mobile-dark .sv-question__content,
      .patient-form-view.mobile-dark .sd-row,
      .patient-form-view.mobile-dark .sv-row {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      
      /* Ensure gradient background shows through */
      .patient-form-view.mobile-dark {
        background: linear-gradient(to bottom, #000428, #004e92) !important;
        background-attachment: fixed !important;
      }
      
      /* Fix text colors */
      .patient-form-view.mobile-dark .sd-question__title,
      .patient-form-view.mobile-dark .sv-question__title,
      .patient-form-view.mobile-dark .sd-item__control-label,
      .patient-form-view.mobile-dark .sv-item__control-label,
      .patient-form-view.mobile-dark label,
      .patient-form-view.mobile-dark span {
        color: white !important;
      }
    }
  `;
  
  // Also modify the survey's theme at runtime
  if (survey.css) {
    // Store original theme for desktop
    if (!survey._originalTheme) {
      survey._originalTheme = { ...survey.css };
    }
    
    // Override theme properties
    survey.css.root = 'sd-root-modern mobile-transparent';
    survey.css.container = 'sd-container-modern mobile-transparent';
    survey.css.body = 'sd-body mobile-transparent';
    survey.css.page = 'sd-page mobile-transparent';
  }
  
  // Force re-render
  survey.render();
}

/**
 * Remove mobile theme overrides (for cleanup)
 */
export function removeMobileThemeOverrides() {
  const styleEl = document.getElementById('mobile-theme-override');
  if (styleEl) {
    styleEl.remove();
  }
}