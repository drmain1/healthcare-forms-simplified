// Service to convert custom form schema to SurveyJS format

interface ConditionalLogic {
  field: string;
  value: string | number;
  operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
}

interface MultipleConditions {
  conditions: ConditionalLogic[];
  operator: 'and' | 'or';
}

interface CustomField {
  id: string;
  label: string;
  type: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  conditional?: ConditionalLogic | MultipleConditions;
  skipTo?: string;
  min?: number;
  max?: number;
}

interface CustomSection {
  title: string;
  fields: CustomField[];
  conditional?: ConditionalLogic | MultipleConditions;
}

interface CustomForm {
  form: {
    title: string;
    sections: CustomSection[];
  };
}

interface SurveyJSElement {
  type: string;
  name: string;
  title: string;
  isRequired?: boolean;
  choices?: Array<{ value: string; text: string }>;
  placeholder?: string;
  visibleIf?: string;
  rateMin?: number;
  rateMax?: number;
  inputType?: string;
}

interface SurveyJSPage {
  name: string;
  title: string;
  elements: SurveyJSElement[];
}

interface SurveyJSON {
  title: string;
  pages: SurveyJSPage[];
  showProgressBar: string;
  showQuestionNumbers: string;
  questionTitleLocation: string;
}

/**
 * Maps custom field types to SurveyJS field types
 */
const mapFieldType = (customType: string): { type: string; inputType?: string } => {
  const typeMap: { [key: string]: { type: string; inputType?: string } } = {
    text: { type: 'text' },
    textarea: { type: 'comment' },
    number: { type: 'text', inputType: 'number' },
    date: { type: 'text', inputType: 'date' },
    email: { type: 'text', inputType: 'email' },
    tel: { type: 'text', inputType: 'tel' },
    url: { type: 'text', inputType: 'url' },
    radio: { type: 'radiogroup' },
    checkbox: { type: 'checkbox' },
    select: { type: 'dropdown' },
    range: { type: 'rating' },
    textBlock: { type: 'html' },
    file: { type: 'file' },
    bodypaindiagram: { type: 'bodypaindiagram' },
  };

  return typeMap[customType] || { type: 'text' };
};

/**
 * Converts conditional logic to SurveyJS visibleIf format
 */
const convertConditional = (conditional: ConditionalLogic | MultipleConditions): string => {
  // Check if it's multiple conditions
  if ('conditions' in conditional) {
    const conditions = conditional.conditions.map(cond => convertSingleCondition(cond));
    const operator = conditional.operator === 'and' ? ' and ' : ' or ';
    return conditions.join(operator);
  }
  
  // Single condition
  return convertSingleCondition(conditional);
};

/**
 * Converts a single conditional logic to SurveyJS format
 */
const convertSingleCondition = (conditional: ConditionalLogic): string => {
  const { field, value, operator = 'equals' } = conditional;
  
  // Handle different operators
  switch (operator) {
    case 'equals':
      return typeof value === 'string' ? `{${field}} = '${value}'` : `{${field}} = ${value}`;
    case 'notEquals':
      return typeof value === 'string' ? `{${field}} != '${value}'` : `{${field}} != ${value}`;
    case 'contains':
      return `{${field}} contains '${value}'`;
    case 'greaterThan':
      return `{${field}} > ${value}`;
    case 'lessThan':
      return `{${field}} < ${value}`;
    case 'greaterThanOrEqual':
      return `{${field}} >= ${value}`;
    case 'lessThanOrEqual':
      return `{${field}} <= ${value}`;
    default:
      return typeof value === 'string' ? `{${field}} = '${value}'` : `{${field}} = ${value}`;
  }
};

/**
 * Converts a custom field to SurveyJS element
 */
const convertField = (field: CustomField): SurveyJSElement => {
  const { type, inputType } = mapFieldType(field.type);
  
  const element: SurveyJSElement = {
    type,
    name: field.id,
    title: field.label,
  };

  // Add input type for text fields
  if (inputType) {
    element.inputType = inputType;
  }

  // Add required validation
  if (field.required) {
    element.isRequired = true;
  }

  // Add placeholder
  if (field.placeholder) {
    element.placeholder = field.placeholder;
  }

  // Add choices for selection fields
  if (field.options && ['radiogroup', 'checkbox', 'dropdown'].includes(type)) {
    element.choices = field.options.map(option => ({
      value: option.value,
      text: option.label,
    }));
  }

  // Add range properties for rating fields
  if (type === 'rating' && field.min !== undefined && field.max !== undefined) {
    element.rateMin = field.min;
    element.rateMax = field.max;
  }

  // Add conditional visibility
  if (field.conditional) {
    element.visibleIf = convertConditional(field.conditional);
  }

  // Handle textBlock type - convert to HTML
  if (field.type === 'textBlock') {
    element.type = 'html';
    // For HTML elements, the content goes in a different property
    (element as any).html = `<div class="form-text-block"><strong>${field.label}</strong></div>`;
  }

  // Handle file upload fields - add properties for image capture
  if (field.type === 'file') {
    // Add file upload specific properties
    (element as any).acceptedTypes = 'image/*';
    (element as any).storeDataAsText = false;
    (element as any).allowMultiple = false;
    (element as any).maxSize = 10485760; // 10MB
    (element as any).allowImagesPreview = true;
    
    // Enable camera capture on mobile devices
    if (field.label.toLowerCase().includes('insurance') || 
        field.label.toLowerCase().includes('id') ||
        field.label.toLowerCase().includes('license')) {
      (element as any).sourceType = 'camera,file-picker';
      (element as any).description = field.placeholder || 'Take a photo or upload an image';
    }
  }

  return element;
};

/**
 * Converts a custom section to SurveyJS page
 */
const convertSection = (section: CustomSection, index: number): SurveyJSPage => {
  const page: SurveyJSPage = {
    name: `page${index + 1}`,
    title: section.title,
    elements: section.fields.map(field => convertField(field)),
  };
  
  // Add section-level conditional logic
  if (section.conditional) {
    (page as any).visibleIf = convertConditional(section.conditional);
  }
  
  return page;
};

/**
 * Main function to convert custom form schema to SurveyJS format
 */
export const convertToSurveyJS = async (customForm: CustomForm): Promise<SurveyJSON> => {
  try {
    // Additional validation to ensure we have the expected structure
    if (!customForm.form) {
      throw new Error('Invalid form schema: missing form object');
    }

    const { form } = customForm;

    // Convert sections to pages
    const pages = form.sections.map((section, index) => convertSection(section, index));

    // If no sections, create a single page with all fields
    if (pages.length === 0) {
      throw new Error('No sections found in form schema');
    }

    // Ensure each page has at least one element
    const validPages = pages.filter(page => page.elements && page.elements.length > 0);
    
    if (validPages.length === 0) {
      throw new Error('No valid form elements found in any section');
    }

    const surveyJson: SurveyJSON = {
      title: form.title || 'Generated Form',
      pages: validPages,
      showProgressBar: 'bottom',
      showQuestionNumbers: 'onPage',
      questionTitleLocation: 'top',
    };

    console.log('Converted SurveyJS JSON:', JSON.stringify(surveyJson, null, 2));
    return surveyJson;

  } catch (error) {
    console.error('Error converting form schema to SurveyJS:', error);
    throw new Error(`Failed to convert form schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates the custom form schema structure
 */
export const validateCustomForm = (customForm: any): customForm is CustomForm => {
  if (!customForm || typeof customForm !== 'object') {
    return false;
  }

  if (!customForm.form || typeof customForm.form !== 'object') {
    return false;
  }

  const { form } = customForm;

  if (typeof form.title !== 'string') {
    return false;
  }

  if (!Array.isArray(form.sections)) {
    return false;
  }

  // Validate each section
  for (const section of form.sections) {
    if (!section || typeof section !== 'object') {
      return false;
    }

    if (typeof section.title !== 'string') {
      return false;
    }

    if (!Array.isArray(section.fields)) {
      return false;
    }

    // Validate each field
    for (const field of section.fields) {
      if (!field || typeof field !== 'object') {
        return false;
      }

      if (typeof field.id !== 'string' || typeof field.label !== 'string' || typeof field.type !== 'string') {
        return false;
      }
    }
  }

  return true;
};

/**
 * Creates a sample form for testing
 */
export const createSampleForm = (): SurveyJSON => {
  return {
    title: 'Sample Generated Form',
    pages: [
      {
        name: 'page1',
        title: 'Personal Information',
        elements: [
          {
            type: 'text',
            name: 'firstName',
            title: 'First Name',
            isRequired: true,
          },
          {
            type: 'text',
            name: 'lastName',
            title: 'Last Name',
            isRequired: true,
          },
          {
            type: 'text',
            name: 'email',
            title: 'Email Address',
            inputType: 'email',
            isRequired: true,
          },
        ],
      },
      {
        name: 'page2',
        title: 'Medical Information',
        elements: [
          {
            type: 'radiogroup',
            name: 'hasAllergies',
            title: 'Do you have any known allergies?',
            choices: [
              { value: 'yes', text: 'Yes' },
              { value: 'no', text: 'No' },
            ],
            isRequired: true,
          },
          {
            type: 'comment',
            name: 'allergyDetails',
            title: 'Please describe your allergies',
            visibleIf: "{hasAllergies} = 'yes'",
          },
        ],
      },
    ],
    showProgressBar: 'bottom',
    showQuestionNumbers: 'onPage',
    questionTitleLocation: 'top',
  };
};