/**
 * Signature validation utilities for SurveyJS forms
 * Ensures signature fields contain valid data before submission
 */

/**
 * Check if a signature data URL contains actual drawing data
 * Empty signatures still have a base64 header but no meaningful content
 */
export const isSignatureEmpty = (signatureData: string | undefined | null): boolean => {
  if (!signatureData || typeof signatureData !== 'string') {
    return true;
  }

  // Check if it's a valid data URL
  if (!signatureData.startsWith('data:image/')) {
    return true;
  }

  // Extract the base64 portion
  const base64Start = signatureData.indexOf('base64,');
  if (base64Start === -1) {
    return true;
  }

  const base64Data = signatureData.substring(base64Start + 7);

  // A blank signature pad can still produce a base64 string, but it's usually very small.
  // A simple check for a very short length can be a first pass.
  if (base64Data.length < 200) { // Reduced from 1000 to a more reasonable threshold
    return true;
  }

  // Additional check: look for common patterns in empty signature pads
  // Some signature libraries produce a specific pattern for empty pads
  const emptyPatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent pixel
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=' // Another common empty pattern
  ];

  return emptyPatterns.some(pattern => base64Data.includes(pattern));
};

/**
 * Validate all signature fields in form data
 * Returns an object with validation results
 */
export const validateSignatures = (
  formData: Record<string, any>,
  signatureFields: string[]
): { isValid: boolean; emptyFields: string[]; messages: string[] } => {
  const emptyFields: string[] = [];
  const messages: string[] = [];

  for (const fieldName of signatureFields) {
    const signatureData = formData[fieldName];
    
    if (isSignatureEmpty(signatureData)) {
      emptyFields.push(fieldName);
      messages.push(`Signature field "${fieldName}" is empty or invalid`);
    }
  }

  return {
    isValid: emptyFields.length === 0,
    emptyFields,
    messages
  };
};

/**
 * Add validation to SurveyJS model for signature fields
 * This adds custom validators to ensure signatures are not empty
 */
export const addSignatureValidation = (survey: any) => {
  // Add custom validator for signature pad questions
  survey.onValidateQuestion.add((sender: any, options: any) => {
    if (options.question.getType() === 'signaturepad') {
      const value = options.question.value;
      
      if (options.question.isRequired && isSignatureEmpty(value)) {
        options.error = 'Please provide your signature';
      }
    }
  });

  // Add validation before completion
  survey.onValidatePanel.add((sender: any, options: any) => {
    const signatureQuestions = options.panel.questions.filter(
      (q: any) => q.getType() === 'signaturepad'
    );

    for (const question of signatureQuestions) {
      if (question.isRequired && isSignatureEmpty(question.value)) {
        options.errors.push({
          question: question,
          error: 'Signature is required'
        });
      }
    }
  });
};

/**
 * Clean signature data for storage
 * Removes empty signatures and normalizes format
 */
export const cleanSignatureData = (
  formData: Record<string, any>
): Record<string, any> => {
  const cleaned = { ...formData };
  
  Object.keys(cleaned).forEach(key => {
    // Check if this might be a signature field (contains signature data URL)
    if (typeof cleaned[key] === 'string' && cleaned[key].startsWith('data:image/')) {
      if (isSignatureEmpty(cleaned[key])) {
        // Remove empty signatures or replace with null
        delete cleaned[key];
      }
    }
  });

  return cleaned;
};

/**
 * Get all signature field names from a SurveyJS model
 */
export const getSignatureFields = (surveyJson: any): string[] => {
  const signatureFields: string[] = [];

  const processElements = (elements: any[]) => {
    if (!elements) return;
    
    for (const element of elements) {
      if (element.type === 'signaturepad' && element.name) {
        signatureFields.push(element.name);
      }
      
      // Check nested elements (panels, etc.)
      if (element.elements) {
        processElements(element.elements);
      }
    }
  };

  // Process pages
  if (surveyJson.pages) {
    for (const page of surveyJson.pages) {
      if (page.elements) {
        processElements(page.elements);
      }
    }
  }

  // Process root elements if no pages
  if (surveyJson.elements) {
    processElements(surveyJson.elements);
  }

  return signatureFields;
};