// Client-side handler for "None of the above" functionality in Review of Systems
import { Model } from 'survey-core';

export const setupROSNoneHandlers = (survey: Model) => {
  // List of all ROS checkbox fields
  const rosFields = [
    'ros_constitutional',
    'ros_gastrointestinal', 
    'ros_musculoskeletal',
    'ros_endocrine',
    'ros_cardiovascular',
    'ros_integumentary',
    'ros_hematological',
    'ros_allergy',
    'ros_respiratory',
    'ros_genitourinary',
    'ros_neurological',
    'ros_eent',
    'ros_psychiatric',
    'ros_headneck',
    'ros_women_symptoms',
    'ros_men_symptoms'
  ];

  // Use onValueChanging to intercept value changes BEFORE they happen
  survey.onValueChanging.add((sender, options) => {
    const fieldName = options.name;
    
    // Check if this is one of our ROS fields
    if (rosFields.includes(fieldName)) {
      const newValue = options.value || [];
      const oldValue = options.oldValue || [];
      const noneValue = `${fieldName}_none`;
      
      // Case 1: User is selecting "None of the above"
      if (newValue.includes(noneValue) && !oldValue.includes(noneValue)) {
        // Clear all other selections, keep only "None"
        options.value = [noneValue];
        console.log(`[ROS Handler] User selected "None" for ${fieldName}, clearing other options`);
        
        // Update visual state
        setTimeout(() => {
          const question = sender.getQuestionByName(fieldName);
          if (question) {
            const currentClasses = question.cssClasses || '';
            if (!currentClasses.includes('has-none-selected')) {
              (question as any).cssClasses = currentClasses + ' has-none-selected';
            }
            // Force re-render
            question.render();
          }
        }, 0);
      }
      // Case 2: User is selecting a regular option while "None" is already selected
      else if (oldValue.includes(noneValue) && newValue.length > 1) {
        // Remove "None" from the new selection
        options.value = newValue.filter((v: string) => v !== noneValue);
        console.log(`[ROS Handler] User selected option while "None" was selected for ${fieldName}, removing "None"`);
        
        // Update visual state
        setTimeout(() => {
          const question = sender.getQuestionByName(fieldName);
          if (question) {
            const currentClasses = question.cssClasses || '';
            (question as any).cssClasses = currentClasses.replace(' has-none-selected', '');
            // Force re-render
            question.render();
          }
        }, 0);
      }
      // Case 3: User is trying to select both "None" and other options simultaneously
      else if (newValue.includes(noneValue) && newValue.length > 1) {
        // This shouldn't happen with onValueChanging, but handle it just in case
        // Keep only "None"
        options.value = [noneValue];
        console.log(`[ROS Handler] Preventing mixed selection for ${fieldName}`);
      }
    }
  });

  // Add visual styling and click interceptors after rendering
  survey.onAfterRenderQuestion.add((sender, options) => {
    const fieldName = options.question.name;
    
    if (rosFields.includes(fieldName)) {
      const htmlElement = options.htmlElement;
      const currentValue = options.question.value || [];
      const noneValue = `${fieldName}_none`;
      
      // Find and style the "None" option
      const noneOption = htmlElement.querySelector(`input[value="${noneValue}"]`);
      if (noneOption) {
        const noneLabel = noneOption.closest('.sv-item');
        if (noneLabel) {
          noneLabel.classList.add('is-none-option');
          
          // Add visual separator
          const htmlNoneLabel = noneLabel as HTMLElement;
          htmlNoneLabel.style.borderTop = '2px solid #e0e0e0';
          htmlNoneLabel.style.marginTop = '12px';
          htmlNoneLabel.style.paddingTop = '12px';
          htmlNoneLabel.style.fontWeight = '600';
          htmlNoneLabel.style.backgroundColor = '#f8f9fa';
          htmlNoneLabel.style.borderRadius = '4px';
          htmlNoneLabel.style.padding = '12px';
        }
      }
      
      // Apply disabled visual state if "None" is selected
      if (currentValue.includes(noneValue)) {
        const checkboxContainer = htmlElement.querySelector('.sv-selectbase');
        if (checkboxContainer) {
          checkboxContainer.classList.add('has-none-selected');
        }
        
        const allOptions = htmlElement.querySelectorAll('.sv-item');
        allOptions.forEach((option: Element) => {
          const input = option.querySelector('input') as HTMLInputElement;
          if (input && input.value !== noneValue) {
            option.classList.add('is-disabled');
            const htmlOption = option as HTMLElement;
            htmlOption.style.opacity = '0.3';
            htmlOption.style.pointerEvents = 'none';
            htmlOption.style.cursor = 'not-allowed';
            
            // Also disable the actual input
            input.disabled = true;
            input.style.cursor = 'not-allowed';
          }
        });
      } else {
        // Re-enable all options if "None" is not selected
        const allOptions = htmlElement.querySelectorAll('.sv-item');
        allOptions.forEach((option: Element) => {
          const input = option.querySelector('input') as HTMLInputElement;
          if (input && input.value !== noneValue) {
            option.classList.remove('is-disabled');
            const htmlOption = option as HTMLElement;
            htmlOption.style.opacity = '1';
            htmlOption.style.pointerEvents = 'auto';
            htmlOption.style.cursor = 'pointer';
            
            // Re-enable the input
            input.disabled = false;
            input.style.cursor = 'pointer';
          }
        });
      }
      
      // Add click interceptor for immediate visual feedback
      const allInputs = htmlElement.querySelectorAll('input[type="checkbox"]');
      allInputs.forEach((input: Element) => {
        const htmlInput = input as HTMLInputElement;
        
        // Remove existing listeners to avoid duplicates
        const newInput = htmlInput.cloneNode(true) as HTMLInputElement;
        htmlInput.parentNode?.replaceChild(newInput, htmlInput);
        
        // Add new listener
        newInput.addEventListener('click', (e) => {
          const currentVal = options.question.value || [];
          
          if (newInput.value === noneValue && !currentVal.includes(noneValue)) {
            // About to select "None" - immediately disable others visually
            const allOpts = htmlElement.querySelectorAll('.sv-item');
            allOpts.forEach((opt: Element) => {
              const inp = opt.querySelector('input') as HTMLInputElement;
              if (inp && inp.value !== noneValue) {
                const htmlOpt = opt as HTMLElement;
                htmlOpt.style.transition = 'opacity 0.3s ease';
                htmlOpt.style.opacity = '0.3';
              }
            });
          } else if (newInput.value !== noneValue && currentVal.includes(noneValue)) {
            // About to select a regular option while "None" is selected - enable others
            const allOpts = htmlElement.querySelectorAll('.sv-item');
            allOpts.forEach((opt: Element) => {
              const htmlOpt = opt as HTMLElement;
              htmlOpt.style.transition = 'opacity 0.3s ease';
              htmlOpt.style.opacity = '1';
            });
          }
        });
      });
    }
  });
  
  // Re-apply visual state when value changes
  survey.onValueChanged.add((sender, options) => {
    const fieldName = options.name;
    
    if (rosFields.includes(fieldName)) {
      // Force re-render to update visual state
      const question = sender.getQuestionByName(fieldName);
      if (question) {
        question.render();
      }
    }
  });
};

// Helper function to clear all ROS selections
export const clearAllROSSelections = (survey: Model) => {
  const rosFields = [
    'ros_constitutional',
    'ros_gastrointestinal', 
    'ros_musculoskeletal',
    'ros_endocrine',
    'ros_cardiovascular',
    'ros_integumentary',
    'ros_hematological',
    'ros_allergy',
    'ros_respiratory',
    'ros_genitourinary',
    'ros_neurological',
    'ros_eent',
    'ros_psychiatric',
    'ros_headneck',
    'ros_women_symptoms',
    'ros_men_symptoms'
  ];

  rosFields.forEach(field => {
    survey.setValue(field, [`${field}_none`]);
  });
};

// Helper function to check if patient has any ROS conditions
export const hasAnyROSConditions = (surveyData: any): boolean => {
  const rosFields = [
    'ros_constitutional',
    'ros_gastrointestinal', 
    'ros_musculoskeletal',
    'ros_endocrine',
    'ros_cardiovascular',
    'ros_integumentary',
    'ros_hematological',
    'ros_allergy',
    'ros_respiratory',
    'ros_genitourinary',
    'ros_neurological',
    'ros_eent',
    'ros_psychiatric',
    'ros_headneck',
    'ros_women_symptoms',
    'ros_men_symptoms'
  ];

  return rosFields.some(field => {
    const value = surveyData[field];
    if (!value || !Array.isArray(value)) return false;
    
    // Check if there are selections other than "none"
    const noneValue = `${field}_none`;
    return value.length > 0 && !value.every((v: string) => v === noneValue);
  });
};