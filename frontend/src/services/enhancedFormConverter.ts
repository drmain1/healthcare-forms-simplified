// Enhanced form converter with multi-column layout support and professional styling

interface ConditionalLogic {
  field: string;
  value: string | number;
  operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
}

interface MultipleConditions {
  conditions: ConditionalLogic[];
  operator: 'and' | 'or';
}

interface EnhancedField {
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
  width?: 'full' | 'half' | 'third' | 'quarter'; // Layout width
  newRow?: boolean; // Force new row
  description?: string; // Help text
  validation?: any; // Additional validation rules
}

interface EnhancedSection {
  title: string;
  description?: string;
  fields: EnhancedField[];
  columnsCount?: number; // Default columns for section
  conditional?: ConditionalLogic | MultipleConditions;
}

interface EnhancedForm {
  form: {
    title: string;
    description?: string;
    sections: EnhancedSection[];
    theme?: 'default' | 'healthcare' | 'modern';
  };
}

/**
 * Creates a professional healthcare form template
 */
export const createHealthcareFormTemplate = (): any => {
  return {
    title: "Patient Registration Form",
    description: "Please fill out this form with accurate information",
    logoPosition: "right",
    showProgressBar: "bottom",
    progressBarType: "questions",
    showQuestionNumbers: "off",
    questionTitleLocation: "top",
    questionsOnPageMode: "standard",
    showPreviewBeforeComplete: "showAnsweredQuestions",
    theme: "healthcare",
    widthMode: "responsive",
    
    pages: [
      {
        name: "personalInfo",
        title: "Personal Information",
        elements: [
          {
            type: "panel",
            name: "personalInfoPanel",
            title: "Patient Details",
            state: "expanded",
            elements: [
              {
                type: "text",
                name: "patientId",
                title: "Patient ID",
                width: "25%",
                startWithNewLine: true,
                titleLocation: "top"
              },
              {
                type: "text",
                name: "dateOfVisit",
                title: "Date of Visit",
                inputType: "date",
                width: "25%",
                startWithNewLine: false,
                titleLocation: "top"
              },
              {
                type: "text",
                name: "firstName",
                title: "First Name",
                isRequired: true,
                width: "25%",
                startWithNewLine: true,
                titleLocation: "top"
              },
              {
                type: "text",
                name: "middleName",
                title: "Middle Name",
                width: "25%",
                startWithNewLine: false,
                titleLocation: "top"
              },
              {
                type: "text",
                name: "lastName",
                title: "Last Name",
                isRequired: true,
                width: "25%",
                startWithNewLine: false,
                titleLocation: "top"
              },
              {
                type: "dropdown",
                name: "suffix",
                title: "Suffix",
                width: "25%",
                startWithNewLine: false,
                choices: ["Jr.", "Sr.", "II", "III", "IV"],
                showNoneItem: true,
                noneText: "None"
              },
              {
                type: "text",
                name: "dateOfBirth",
                title: "Date of Birth",
                inputType: "date",
                isRequired: true,
                width: "33%",
                startWithNewLine: true
              },
              {
                type: "text",
                name: "ssn",
                title: "Social Security Number",
                inputType: "text",
                inputMask: "999-99-9999",
                width: "33%",
                startWithNewLine: false
              },
              {
                type: "radiogroup",
                name: "gender",
                title: "Gender",
                isRequired: true,
                width: "34%",
                startWithNewLine: false,
                choices: [
                  { value: "male", text: "Male" },
                  { value: "female", text: "Female" },
                  { value: "other", text: "Other" },
                  { value: "prefer_not_to_say", text: "Prefer not to say" }
                ],
                colCount: 2
              }
            ]
          },
          {
            type: "panel",
            name: "contactInfoPanel",
            title: "Contact Information",
            state: "expanded",
            startWithNewLine: true,
            elements: [
              {
                type: "text",
                name: "streetAddress",
                title: "Street Address",
                isRequired: true,
                width: "50%",
                startWithNewLine: true
              },
              {
                type: "text",
                name: "apartmentSuite",
                title: "Apartment/Suite",
                width: "50%",
                startWithNewLine: false
              },
              {
                type: "text",
                name: "city",
                title: "City",
                isRequired: true,
                width: "40%",
                startWithNewLine: true
              },
              {
                type: "dropdown",
                name: "state",
                title: "State",
                isRequired: true,
                width: "30%",
                startWithNewLine: false,
                choices: [
                  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
                ]
              },
              {
                type: "text",
                name: "zipCode",
                title: "ZIP Code",
                isRequired: true,
                width: "30%",
                startWithNewLine: false,
                validators: [{
                  type: "regex",
                  text: "Please enter a valid ZIP code",
                  regex: "^[0-9]{5}(-[0-9]{4})?$"
                }]
              },
              {
                type: "text",
                name: "homePhone",
                title: "Home Phone",
                inputType: "tel",
                width: "33%",
                startWithNewLine: true,
                inputMask: "(999) 999-9999"
              },
              {
                type: "text",
                name: "cellPhone",
                title: "Cell Phone",
                inputType: "tel",
                width: "33%",
                startWithNewLine: false,
                inputMask: "(999) 999-9999"
              },
              {
                type: "text",
                name: "email",
                title: "Email Address",
                inputType: "email",
                width: "34%",
                startWithNewLine: false,
                validators: [{
                  type: "email"
                }]
              }
            ]
          }
        ]
      },
      {
        name: "insuranceInfo",
        title: "Insurance Information",
        elements: [
          {
            type: "panel",
            name: "primaryInsurancePanel",
            title: "Primary Insurance",
            state: "expanded",
            elements: [
              {
                type: "text",
                name: "insuranceCompany",
                title: "Insurance Company",
                width: "50%",
                startWithNewLine: true
              },
              {
                type: "text",
                name: "policyNumber",
                title: "Policy Number",
                width: "50%",
                startWithNewLine: false
              },
              {
                type: "text",
                name: "groupNumber",
                title: "Group Number",
                width: "50%",
                startWithNewLine: true
              },
              {
                type: "text",
                name: "subscriberName",
                title: "Subscriber Name",
                width: "50%",
                startWithNewLine: false
              },
              {
                type: "text",
                name: "subscriberDOB",
                title: "Subscriber Date of Birth",
                inputType: "date",
                width: "50%",
                startWithNewLine: true
              },
              {
                type: "dropdown",
                name: "relationshipToSubscriber",
                title: "Relationship to Subscriber",
                width: "50%",
                startWithNewLine: false,
                choices: ["Self", "Spouse", "Child", "Other"]
              }
            ]
          }
        ]
      },
      {
        name: "medicalHistory",
        title: "Medical History",
        elements: [
          {
            type: "panel",
            name: "allergiesPanel",
            title: "Allergies & Medications",
            state: "expanded",
            elements: [
              {
                type: "radiogroup",
                name: "hasAllergies",
                title: "Do you have any known allergies?",
                isRequired: true,
                choices: ["Yes", "No"],
                colCount: 2
              },
              {
                type: "comment",
                name: "allergyDetails",
                title: "Please list all allergies and reactions",
                visibleIf: "{hasAllergies} = 'Yes'",
                rows: 4
              },
              {
                type: "radiogroup",
                name: "takingMedications",
                title: "Are you currently taking any medications?",
                isRequired: true,
                choices: ["Yes", "No"],
                colCount: 2,
                startWithNewLine: true
              },
              {
                type: "comment",
                name: "medicationList",
                title: "Please list all current medications and dosages",
                visibleIf: "{takingMedications} = 'Yes'",
                rows: 4
              }
            ]
          },
          {
            type: "panel",
            name: "medicalConditionsPanel",
            title: "Medical Conditions",
            state: "expanded",
            startWithNewLine: true,
            elements: [
              {
                type: "checkbox",
                name: "medicalConditions",
                title: "Please check all that apply:",
                choices: [
                  "Diabetes",
                  "High Blood Pressure",
                  "Heart Disease",
                  "Asthma",
                  "Cancer",
                  "Arthritis",
                  "Depression/Anxiety",
                  "Thyroid Disease",
                  "None of the above"
                ],
                colCount: 3
              }
            ]
          }
        ]
      }
    ]
  };
};

/**
 * Converts enhanced conditional logic to SurveyJS visibleIf format
 */
const convertEnhancedConditional = (conditional: ConditionalLogic | MultipleConditions): string => {
  // Check if it's multiple conditions
  if ('conditions' in conditional) {
    const conditions = conditional.conditions.map(cond => convertSingleEnhancedCondition(cond));
    const operator = conditional.operator === 'and' ? ' and ' : ' or ';
    return conditions.join(operator);
  }
  
  // Single condition
  return convertSingleEnhancedCondition(conditional);
};

/**
 * Converts a single conditional logic to SurveyJS format
 */
const convertSingleEnhancedCondition = (conditional: ConditionalLogic): string => {
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
 * Enhanced converter that preserves layout and creates professional forms
 */
export const convertToEnhancedSurveyJS = async (customForm: EnhancedForm): Promise<any> => {
  try {
    const { form } = customForm;
    
    // Base configuration for professional healthcare forms
    const surveyConfig: any = {
      title: form.title || "Healthcare Form",
      description: form.description,
      logoPosition: "right",
      showProgressBar: "bottom",
      progressBarType: "questions",
      showQuestionNumbers: "off",
      questionTitleLocation: "top",
      questionsOnPageMode: "standard",
      showPreviewBeforeComplete: "showAnsweredQuestions",
      widthMode: "responsive",
      pages: [] as any[]
    };

    // Convert sections to pages with enhanced layout
    form.sections.forEach((section, sectionIndex) => {
      const page: any = {
        name: `page${sectionIndex + 1}`,
        title: section.title,
        elements: []
      };

      if (section.description) {
        page.description = section.description;
      }
      
      // Add section-level conditional logic
      if (section.conditional) {
        page.visibleIf = convertEnhancedConditional(section.conditional);
      }

      // Group fields into panels for better organization
      const panel: any = {
        type: "panel",
        name: `panel_${sectionIndex}`,
        title: section.title,
        state: "expanded",
        elements: []
      };

      // Convert fields with layout information
      section.fields.forEach((field, fieldIndex) => {
        const element = convertEnhancedField(field, fieldIndex);
        panel.elements.push(element);
      });

      page.elements.push(panel);
      surveyConfig.pages.push(page);
    });

    return surveyConfig;
  } catch (error) {
    console.error('Error converting to enhanced SurveyJS:', error);
    throw error;
  }
};

/**
 * Convert enhanced field with layout support
 */
const convertEnhancedField = (field: EnhancedField, index: number): any => {
  const { type, inputType } = mapEnhancedFieldType(field.type);
  
  const element: any = {
    type,
    name: field.id,
    title: field.label,
    titleLocation: "top"
  };

  // Layout properties
  if (field.width) {
    const widthMap = {
      'full': '100%',
      'half': '50%',
      'third': '33%',
      'quarter': '25%'
    };
    element.width = widthMap[field.width] || '100%';
  }

  element.startWithNewLine = field.newRow !== false && index === 0 ? true : field.newRow || false;

  // Input type and validation
  if (inputType) {
    element.inputType = inputType;
  }

  if (field.required) {
    element.isRequired = true;
  }

  if (field.placeholder) {
    element.placeholder = field.placeholder;
  }

  if (field.description) {
    element.description = field.description;
  }

  // Choices for selection fields
  if (field.options && ['radiogroup', 'checkbox', 'dropdown'].includes(type)) {
    element.choices = field.options.map(option => ({
      value: option.value,
      text: option.label
    }));
    
    // For radio and checkbox, use column layout
    if (type === 'radiogroup' || type === 'checkbox') {
      element.colCount = field.options.length <= 4 ? field.options.length : 2;
    }
  }

  // Conditional visibility
  if (field.conditional) {
    element.visibleIf = convertEnhancedConditional(field.conditional);
  }
  
  // Skip logic (for navigation)
  if (field.skipTo) {
    element.valueName = field.id; // Ensure we can reference this field
    // Add a custom property that can be used for navigation logic
    element.skipToPage = field.skipTo;
  }

  // Special handling for specific field types
  switch (field.type) {
    case 'ssn':
      element.inputMask = '999-99-9999';
      break;
    case 'phone':
      element.inputMask = '(999) 999-9999';
      break;
    case 'zipcode':
      element.validators = [{
        type: 'regex',
        text: 'Please enter a valid ZIP code',
        regex: '^[0-9]{5}(-[0-9]{4})?$'
      }];
      break;
  }

  return element;
};

/**
 * Enhanced field type mapping
 */
const mapEnhancedFieldType = (customType: string): { type: string; inputType?: string } => {
  const typeMap: { [key: string]: { type: string; inputType?: string } } = {
    text: { type: 'text' },
    textarea: { type: 'comment' },
    number: { type: 'text', inputType: 'number' },
    date: { type: 'text', inputType: 'date' },
    email: { type: 'text', inputType: 'email' },
    tel: { type: 'text', inputType: 'tel' },
    phone: { type: 'text', inputType: 'tel' },
    url: { type: 'text', inputType: 'url' },
    radio: { type: 'radiogroup' },
    checkbox: { type: 'checkbox' },
    select: { type: 'dropdown' },
    dropdown: { type: 'dropdown' },
    range: { type: 'rating' },
    signature: { type: 'signaturepad' },
    file: { type: 'file' },
    html: { type: 'html' },
    panel: { type: 'panel' },
    ssn: { type: 'text' },
    zipcode: { type: 'text' }
  };

  return typeMap[customType] || { type: 'text' };
};