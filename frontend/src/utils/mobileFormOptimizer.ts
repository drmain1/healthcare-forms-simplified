/**
 * Mobile Form Optimizer
 * Modifies SurveyJS form configuration for better mobile display
 */

export function optimizeFormForMobile(surveyJson: any): any {
  // Deep clone to avoid modifying original
  const optimized = JSON.parse(JSON.stringify(surveyJson));
  
  // Process all pages
  if (optimized.pages) {
    optimized.pages.forEach((page: any) => {
      if (page.elements) {
        page.elements.forEach((element: any) => {
          optimizeElement(element);
        });
      }
    });
  }
  
  // Process elements at root level (if any)
  if (optimized.elements) {
    optimized.elements.forEach((element: any) => {
      optimizeElement(element);
    });
  }
  
  return optimized;
}

function optimizeElement(element: any) {
  // Optimize radio button groups
  if (element.type === 'radiogroup' || element.type === 'checkbox') {
    // Force single column on mobile
    element.colCount = 0; // This makes items wrap naturally
    
    // Remove any render as settings that might cause issues
    if (element.renderAs === 'table') {
      delete element.renderAs;
    }
  }
  
  // Optimize dropdowns
  if (element.type === 'dropdown') {
    // Ensure dropdowns have proper placeholder
    if (!element.placeholder) {
      element.placeholder = 'Select an option';
    }
  }
  
  // Process nested elements (panels, etc)
  if (element.elements) {
    element.elements.forEach((nested: any) => {
      optimizeElement(nested);
    });
  }
  
  // Process rows in matrices
  if (element.rows) {
    // Matrix questions might need special handling
    element.mobileView = 'list'; // If supported
  }
}

/**
 * Runtime optimizer for existing survey model
 */
export function optimizeSurveyModelForMobile(survey: any) {
  if (!survey) return;
  
  // Get all questions
  const questions = survey.getAllQuestions();
  
  questions.forEach((question: any) => {
    // Optimize radio groups and checkboxes
    if (question.getType() === 'radiogroup' || question.getType() === 'checkbox') {
      // Force single column layout
      question.colCount = 0;
      
      // Remove table rendering
      if (question.renderAs === 'table') {
        question.renderAs = undefined;
      }
    }
    
    // Add mobile-specific CSS classes
    if (question.cssClasses) {
      question.cssClasses.root = (question.cssClasses.root || '') + ' mobile-optimized';
    }
  });
  
  // Force re-render
  survey.render();
}

/**
 * Check if form needs mobile optimization
 */
export function needsMobileOptimization(surveyJson: any): boolean {
  let needsOptimization = false;
  
  function checkElement(element: any) {
    if (element.type === 'radiogroup' || element.type === 'checkbox') {
      // Check if it has multi-column layout
      if (element.colCount && element.colCount > 1) {
        needsOptimization = true;
      }
      if (element.renderAs === 'table') {
        needsOptimization = true;
      }
    }
    
    // Check nested elements
    if (element.elements) {
      element.elements.forEach(checkElement);
    }
  }
  
  // Check all pages
  if (surveyJson.pages) {
    surveyJson.pages.forEach((page: any) => {
      if (page.elements) {
        page.elements.forEach(checkElement);
      }
    });
  }
  
  // Check root elements
  if (surveyJson.elements) {
    surveyJson.elements.forEach(checkElement);
  }
  
  return needsOptimization;
}