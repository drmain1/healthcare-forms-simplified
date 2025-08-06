import { 
  SurveyModel,
  setLicenseKey,
  ITheme
} from 'survey-core';
import { SurveyCreator } from 'survey-creator-react';
import { ICreatorOptions, editorLocalization } from 'survey-creator-core';
// Removed legacy CSS imports - now using minimal main.css
import '../components/FormBuilder/BodyPainDiagramQuestion';
import { patientFormTheme, formBuilderTheme, applyTheme, getThemeForContext } from './surveyThemes';
import { cleanToolboxItems, healthcareToolboxItems } from './toolboxConfig';

// Apply SurveyJS license using the correct method
const licenseKey = process.env.REACT_APP_SURVEYJS_LICENSE_KEY;
if (licenseKey) {
  setLicenseKey(licenseKey);
}   

// Material-UI Inspired Theme for SurveyJS
export const materialUITheme: Partial<ITheme> = {
  themeName: 'material-ui-healthcare',
  colorPalette: 'light',
  isPanelless: false,
  
  // CSS Variables matching Material-UI design system
  cssVariables: {
    // Primary colors
    '--sjs-primary-background-500': '#1976d2',
    '--sjs-primary-background-400': '#42a5f5', 
    '--sjs-primary-background-600': '#1565c0',
    '--sjs-primary-foreground-500': '#ffffff',
    
    // Secondary colors
    '--sjs-secondary-background-500': '#9c27b0',
    '--sjs-secondary-background-400': '#ba68c8',
    '--sjs-secondary-background-600': '#7b1fa2',
    
    // Background layers
    '--sjs-layer-0-background-500': '#ffffff',
    '--sjs-layer-1-background-500': '#fafafa',
    '--sjs-layer-2-background-500': '#f5f5f5',
    '--sjs-layer-3-background-500': '#eeeeee',
    
    // Text colors
    '--sjs-general-foreground-500': '#212121',
    '--sjs-general-foreground-400': '#424242',
    '--sjs-general-foreground-300': '#616161',
    '--sjs-general-foreground-200': '#757575',
    
    // Border colors
    '--sjs-border-default': '#e0e0e0',
    '--sjs-border-light': '#f0f0f0',
    '--sjs-border-inside': '#eeeeee',
    
    // Special colors
    '--sjs-special-red': '#d32f2f',
    '--sjs-special-red-light': '#ffcdd2',
    '--sjs-special-green': '#388e3c',
    '--sjs-special-green-light': '#c8e6c9',
    '--sjs-special-blue': '#1976d2',
    '--sjs-special-blue-light': '#bbdefb',
    '--sjs-special-yellow': '#f57c00',
    '--sjs-special-yellow-light': '#ffe0b2',
    
    // Typography
    '--sjs-font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
    '--sjs-font-size': '14px',
    '--sjs-font-weight': '400',
    '--sjs-header-font-weight': '500',
    '--sjs-title-font-weight': '500',
    '--sjs-subtitle-font-weight': '400',
    
    // Spacing and sizing (Material-UI 8px base unit)
    '--sjs-base-unit': '8px',
    '--sjs-corner-radius': '4px',
    '--sjs-edge-radius': '4px',
    
    // Shadows (Material-UI elevation)
    '--sjs-shadow-small': '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    '--sjs-shadow-medium': '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
    '--sjs-shadow-large': '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    '--sjs-shadow-inner': 'inset 0px 1px 3px rgba(0,0,0,0.12)',
    
    // Component specific variables
    '--sjs-article-font-xx-large-fontSize': '28px',
    '--sjs-article-font-x-large-fontSize': '24px',
    '--sjs-article-font-large-fontSize': '20px',
    '--sjs-article-font-medium-fontSize': '16px',
    '--sjs-article-font-default-fontSize': '14px',
    '--sjs-article-font-small-fontSize': '12px',
    
    // Question specific
    '--sjs-question-background': '#ffffff',
    '--sjs-question-border': '1px solid #e0e0e0',
    '--sjs-question-border-radius': '4px',
    '--sjs-question-padding': '16px',
    '--sjs-question-margin': '0 0 24px 0',
    
    // Input specific
    '--sjs-input-background': '#ffffff',
    '--sjs-input-border': '1px solid #bdbdbd',
    '--sjs-input-border-focus': '2px solid #1976d2',
    '--sjs-input-padding': '12px 14px',
    '--sjs-input-border-radius': '4px',
    
    // Button specific
    '--sjs-button-background': '#1976d2',
    '--sjs-button-background-hover': '#1565c0',
    '--sjs-button-color': '#ffffff',
    '--sjs-button-border-radius': '4px',
    '--sjs-button-padding': '8px 16px',
    '--sjs-button-font-weight': '500',
    '--sjs-button-text-transform': 'uppercase',
    '--sjs-button-letter-spacing': '0.02857em'
  }
};

// Legacy healthcare themes for backward compatibility
export const healthcareThemes = {
  'healthcare-light': materialUITheme,
  'healthcare-dark': {
    ...materialUITheme,
    colorPalette: 'dark',
    cssVariables: {
      ...materialUITheme.cssVariables,
      '--sjs-primary-background-500': '#64b5f6',
      '--sjs-layer-0-background-500': '#121212',
      '--sjs-layer-1-background-500': '#1e1e1e',
      '--sjs-layer-2-background-500': '#232323',
      '--sjs-layer-3-background-500': '#2d2d2d',
      '--sjs-general-foreground-500': '#ffffff',
      '--sjs-general-foreground-400': '#e0e0e0',
      '--sjs-general-foreground-300': '#bdbdbd',
      '--sjs-border-default': '#424242',
      '--sjs-question-background': '#1e1e1e',
      '--sjs-input-background': '#2d2d2d',
      '--sjs-input-border': '1px solid #616161'
    }
  },
  'material-ui': materialUITheme
};

// Custom validators for healthcare data
export const healthcareValidators = {
  'phi-compliant': {
    validate: (value: any) => {
      if (!value) return true;
      // Basic PHI format validation
      return /^[A-Z0-9]{6,}$/.test(value);
    },
    errorText: 'Please enter a valid identifier format (6+ alphanumeric characters)'
  },
  'date-range': {
    validate: (value: any, params: any) => {
      if (!value) return true;
      const date = new Date(value);
      const min = new Date(params.min || '1900-01-01');
      const max = new Date(params.max || new Date());
      return date >= min && date <= max;
    },
    errorText: 'Date must be within the specified range'
  },
  'medical-record-number': {
    validate: (value: any) => {
      if (!value) return true;
      return /^\d{6,12}$/.test(value);
    },
    errorText: 'Please enter a valid Medical Record Number (6-12 digits)'
  },
  'phone-number': {
    validate: (value: any) => {
      if (!value) return true;
      const cleanPhone = value.replace(/\D/g, '');
      return /^\d{10}$/.test(cleanPhone);
    },
    errorText: 'Please enter a valid 10-digit phone number'
  },
  'ssn': {
    validate: (value: any) => {
      if (!value) return true;
      const cleanSSN = value.replace(/\D/g, '');
      return /^\d{9}$/.test(cleanSSN) && cleanSSN !== '000000000';
    },
    errorText: 'Please enter a valid Social Security Number'
  },
  'insurance-id': {
    validate: (value: any) => {
      if (!value) return true;
      return /^[A-Z0-9]{3,20}$/.test(value.toUpperCase());
    },
    errorText: 'Please enter a valid insurance ID (3-20 alphanumeric characters)'
  },
  'blood-pressure': {
    validate: (value: any) => {
      if (!value) return true;
      const bpPattern = /^\d{2,3}\/\d{2,3}$/;
      if (!bpPattern.test(value)) return false;
      const [systolic, diastolic] = value.split('/').map(Number);
      return systolic >= 60 && systolic <= 250 && diastolic >= 40 && diastolic <= 150;
    },
    errorText: 'Please enter blood pressure in format XXX/XX (e.g., 120/80)'
  }
};

// Custom question types for healthcare
export const healthcareQuestionTypes = {
  'patient-demographics': {
    name: 'patient-demographics',
    title: 'Patient Demographics (FHIR)',
    iconName: 'icon-panel',
    category: 'Healthcare',
    questionJSON: {
      type: 'panel',
      title: 'Patient Information',
      description: 'FHIR-compliant patient demographics',
      elements: [
        {
          type: 'dropdown',
          name: 'name_prefix',
          title: 'Prefix',
          width: '20%',
          startWithNewLine: false,
          choices: [
            { value: '', text: 'None' },
            { value: 'Dr.', text: 'Dr.' },
            { value: 'Mr.', text: 'Mr.' },
            { value: 'Mrs.', text: 'Mrs.' },
            { value: 'Ms.', text: 'Ms.' },
            { value: 'Prof.', text: 'Prof.' }
          ]
        },
        {
          type: 'text',
          name: 'first_name',
          title: 'First Name',
          isRequired: true,
          width: '26.67%',
          startWithNewLine: false
        },
        {
          type: 'text',
          name: 'middle_name',
          title: 'Middle Name',
          width: '26.67%',
          startWithNewLine: false
        },
        {
          type: 'text',
          name: 'last_name',
          title: 'Last Name',
          isRequired: true,
          width: '26.67%',
          startWithNewLine: false
        },
        {
          type: 'dropdown',
          name: 'name_suffix',
          title: 'Suffix',
          width: '20%',
          startWithNewLine: true,
          choices: [
            { value: '', text: 'None' },
            { value: 'Jr.', text: 'Jr.' },
            { value: 'Sr.', text: 'Sr.' },
            { value: 'II', text: 'II' },
            { value: 'III', text: 'III' },
            { value: 'IV', text: 'IV' },
            { value: 'PhD', text: 'PhD' },
            { value: 'MD', text: 'MD' }
          ]
        },
        {
          type: 'text',
          name: 'date_of_birth',
          title: 'Date of Birth',
          inputType: 'date',
          isRequired: true,
          width: '40%',
          startWithNewLine: false
        },
        {
          type: 'radiogroup',
          name: 'gender',
          title: 'Gender',
          isRequired: true,
          width: '100%',
          startWithNewLine: true,
          choices: [
            { value: 'male', text: 'Male' },
            { value: 'female', text: 'Female' }
          ],
          colCount: 2
        },
        {
          type: 'text',
          name: 'street_address',
          title: 'Street Address',
          width: '100%',
          startWithNewLine: true
        },
        {
          type: 'text',
          name: 'city',
          title: 'City',
          width: '33.33%',
          startWithNewLine: true
        },
        {
          type: 'dropdown',
          name: 'state',
          title: 'State/Province',
          width: '33.33%',
          startWithNewLine: false,
          placeholder: '-- select an option --',
          choices: [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
          ]
        },
        {
          type: 'text',
          name: 'zip_code',
          title: 'Zip Code',
          width: '33.33%',
          startWithNewLine: false,
          inputType: 'text',
          maxLength: 5,
          validators: [
            {
              type: 'regex',
              text: 'Please enter a valid 5-digit ZIP code',
              regex: '^[0-9]{5}$'
            }
          ]
        },
        {
          type: 'text',
          name: 'cell_phone',
          title: 'Cell Phone',
          inputType: 'tel',
          isRequired: true,
          width: '33.33%',
          startWithNewLine: true,
          validators: [
            {
              type: 'regex',
              text: 'Please enter a valid phone number',
              regex: '^[\\(]?([0-9]{3})[\\)]?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$'
            }
          ]
        },
        {
          type: 'text',
          name: 'home_phone',
          title: 'Home Phone',
          inputType: 'tel',
          width: '33.33%',
          startWithNewLine: false,
          validators: [
            {
              type: 'regex',
              text: 'Please enter a valid phone number',
              regex: '^[\\(]?([0-9]{3})[\\)]?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$'
            }
          ]
        },
        {
          type: 'text',
          name: 'work_phone',
          title: 'Work Phone',
          inputType: 'tel',
          width: '33.33%',
          startWithNewLine: false,
          validators: [
            {
              type: 'regex',
              text: 'Please enter a valid phone number',
              regex: '^[\\(]?([0-9]{3})[\\)]?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$'
            }
          ]
        }
      ]
    }
  },
  'medication-list': {
    name: 'medication-list',
    title: 'Current Medications',
    iconName: 'icon-matrix',
    category: 'Healthcare',
    questionJSON: {
      type: 'matrixdynamic',
      addRowText: 'Add Medication',
      removeRowText: 'Remove',
      columns: [
        {
          name: 'medication',
          title: 'Medication Name',
          cellType: 'text',
          isRequired: true
        },
        {
          name: 'dosage',
          title: 'Dosage',
          cellType: 'text',
          isRequired: true,
          placeholder: 'e.g., 10mg'
        },
        {
          name: 'frequency',
          title: 'Frequency',
          cellType: 'dropdown',
          choices: [
            'Once daily',
            'Twice daily',
            'Three times daily',
            'Four times daily',
            'As needed',
            'Every other day',
            'Weekly'
          ]
        },
        {
          name: 'route',
          title: 'Route',
          cellType: 'dropdown',
          choices: [
            'Oral',
            'Injection',
            'Topical',
            'Inhalation',
            'Sublingual',
            'Rectal',
            'Other'
          ]
        },
        {
          name: 'prescriber',
          title: 'Prescribing Doctor',
          cellType: 'text'
        }
      ]
    }
  },
  'allergy-list': {
    name: 'allergy-list',
    title: 'Allergies & Reactions',
    iconName: 'icon-matrix',
    category: 'Healthcare',
    questionJSON: {
      type: 'matrixdynamic',
      addRowText: 'Add Allergy',
      removeRowText: 'Remove',
      columns: [
        {
          name: 'allergen',
          title: 'Allergen',
          cellType: 'text',
          isRequired: true
        },
        {
          name: 'reaction',
          title: 'Reaction',
          cellType: 'text',
          isRequired: true
        },
        {
          name: 'severity',
          title: 'Severity',
          cellType: 'dropdown',
          choices: ['Mild', 'Moderate', 'Severe', 'Life-threatening']
        }
      ]
    }
  },
  'pain-assessment': {
    name: 'pain-assessment',
    title: 'Pain Assessment',
    iconName: 'icon-panel',
    category: 'Healthcare',
    questionJSON: {
      type: 'panel',
      title: 'Pain Assessment',
      elements: [
        {
          type: 'rating',
          name: 'pain_level',
          title: 'Pain Level (0-10)',
          rateMin: 0,
          rateMax: 10,
          minRateDescription: 'No Pain',
          maxRateDescription: 'Worst Pain',
          displayMode: 'buttons'
        },
        {
          type: 'text',
          name: 'pain_location',
          title: 'Pain Location',
          placeholder: 'Describe where you feel pain',
          description: 'Use the Body Pain Diagram question type for visual pain location marking'
        },
        {
          type: 'dropdown',
          name: 'pain_type',
          title: 'Type of Pain',
          choices: [
            'Sharp',
            'Dull',
            'Throbbing',
            'Burning',
            'Shooting',
            'Cramping',
            'Aching',
            'Stabbing'
          ]
        },
        {
          type: 'dropdown',
          name: 'pain_frequency',
          title: 'Pain Frequency',
          choices: [
            'Constant',
            'Intermittent',
            'Occasional',
            'Only with movement',
            'Only at rest'
          ]
        }
      ]
    }
  },
  'medical-history': {
    name: 'medical-history',
    title: 'Medical History',
    iconName: 'icon-checkbox',
    category: 'Healthcare',
    questionJSON: {
      type: 'checkbox',
      title: 'Please check any conditions you have or have had:',
      choices: [
        'High Blood Pressure',
        'Diabetes',
        'Heart Disease',
        'Stroke',
        'Cancer',
        'Asthma',
        'COPD',
        'Kidney Disease',
        'Liver Disease',
        'Depression',
        'Anxiety',
        'Arthritis',
        'Osteoporosis',
        'Thyroid Disease',
        'None of the above'
      ],
      hasOther: true,
      otherText: 'Other condition not listed'
    }
  },
  'family-history': {
    name: 'family-history',
    title: 'Family Medical History',
    iconName: 'icon-matrix',
    category: 'Healthcare',
    questionJSON: {
      type: 'matrixdynamic',
      addRowText: 'Add Family Condition',
      removeRowText: 'Remove',
      columns: [
        {
          name: 'condition',
          title: 'Medical Condition',
          cellType: 'text',
          isRequired: true
        },
        {
          name: 'relationship',
          title: 'Family Member',
          cellType: 'dropdown',
          choices: [
            'Mother',
            'Father',
            'Sister',
            'Brother',
            'Grandmother',
            'Grandfather',
            'Aunt',
            'Uncle',
            'Other'
          ]
        },
        {
          name: 'age_diagnosed',
          title: 'Age Diagnosed',
          cellType: 'text'
        }
      ]
    }
  },
  'consent-checkbox': {
    name: 'consent-checkbox',
    title: 'Consent Agreement',
    iconName: 'icon-boolean',
    category: 'Healthcare',
    questionJSON: {
      type: 'boolean',
      isRequired: true,
      labelTrue: 'I agree to the terms and conditions',
      labelFalse: 'I do not agree'
    }
  },
  'hipaa-consent': {
    name: 'hipaa-consent',
    title: 'HIPAA Authorization',
    iconName: 'icon-panel',
    category: 'Healthcare',
    questionJSON: {
      type: 'panel',
      title: 'HIPAA Privacy Authorization',
      elements: [
        {
          type: 'html',
          name: 'hipaa_notice',
          html: '<p><strong>HIPAA Privacy Notice:</strong> This notice describes how medical information about you may be used and disclosed and how you can get access to this information.</p>'
        },
        {
          type: 'boolean',
          name: 'hipaa_acknowledgment',
          title: 'I acknowledge that I have received and understand the HIPAA Privacy Notice',
          isRequired: true
        },
        {
          type: 'boolean',
          name: 'treatment_consent',
          title: 'I consent to treatment by this healthcare provider',
          isRequired: true
        },
        {
          type: 'boolean',
          name: 'information_sharing',
          title: 'I authorize sharing my health information for treatment purposes'
        }
      ]
    }
  },
  'insurance-card-upload': {
    name: 'insurance-card-upload',
    title: 'Insurance Card Upload',
    iconName: 'icon-file',
    category: 'Healthcare',
    questionJSON: {
      type: 'panel',
      title: 'Insurance Card Upload',
      description: 'Please upload photos of your insurance card',
      elements: [
        {
          type: 'file',
          name: 'insurance_card_front',
          title: 'Front of Insurance Card',
          acceptedTypes: 'image/*',
          storeDataAsText: false,
          allowMultiple: false,
          maxSize: 10485760,
          description: 'Take a photo or upload an image of the FRONT of your insurance card',
          sourceType: 'camera,file-picker',
          allowImagesPreview: true,
          isRequired: true
        },
        {
          type: 'file',
          name: 'insurance_card_back',
          title: 'Back of Insurance Card',
          acceptedTypes: 'image/*',
          storeDataAsText: false,
          allowMultiple: false,
          maxSize: 10485760,
          description: 'Take a photo or upload an image of the BACK of your insurance card',
          sourceType: 'camera,file-picker',
          allowImagesPreview: true,
          isRequired: true
        }
      ]
    }
  },
  'photo-id-upload': {
    name: 'photo-id-upload',
    title: 'Photo ID Upload',
    iconName: 'icon-file',
    category: 'Healthcare',
    questionJSON: {
      type: 'file',
      name: 'photo_id',
      title: 'Upload a Photo ID',
      acceptedTypes: 'image/*',
      storeDataAsText: false,
      allowMultiple: false,
      maxSize: 10485760,
      description: 'Driver\'s license, passport, or state-issued ID. Take a photo or upload an image.',
      sourceType: 'camera,file-picker',
      allowImagesPreview: true,
      isRequired: true
    }
  },
  'document-upload': {
    name: 'document-upload',
    title: 'Document Upload',
    iconName: 'icon-file',
    category: 'Healthcare',
    questionJSON: {
      type: 'file',
      name: 'medical_documents',
      title: 'Upload Medical Documents',
      acceptedTypes: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
      storeDataAsText: false,
      allowMultiple: true,
      maxSize: 20971520,
      description: 'Upload medical records, test results, or other relevant documents (max 20MB per file)',
      sourceType: 'file-picker',
      allowImagesPreview: true
    }
  }
};

// Register healthcare validators with SurveyJS
export const registerHealthcareValidators = () => {
  // For now, we'll skip validator registration and handle validation in question configs
  // Custom validators will be applied directly to questions in questionJSON
};

// Configure SurveyJS Creator with healthcare customizations
export const createSurveyCreator = (): SurveyCreator => {
  // Register validators first
  registerHealthcareValidators();

  // Create creator with healthcare options
  const creatorOptions: ICreatorOptions = {
    autoSaveEnabled: false,
    showLogicTab: true,
    showJSONEditorTab: true, // Show JSON editor for development
    showTestSurveyTab: false, // Hide test/preview - we have our own preview button
    showSidebar: true, // Updated from showPropertyGrid for V2
    showSurveyTitle: false, // We'll handle this in our custom UI
    showSurveyDescription: false,
    allowChangeTheme: true,
    showToolbox: true // Ensure toolbox is visible
  };

  const creator = new SurveyCreator(creatorOptions);
  
  // Apply Material-UI theme to the creator
  creator.theme = materialUITheme as ITheme;
  
  // Configure toolbox for clean, flat design with full labels always visible
  creator.toolbox.isCompact = false; // Always show full toolbox with labels
  creator.toolbox.forceCompact = false; // Never force compact mode
  creator.toolbox.showCategoryTitles = false;
  creator.toolbox.allowExpandMultipleCategories = false;
  creator.toolbox.keepAllCategoriesExpanded = true;
  
  // Clear default items to rebuild in specific order
  creator.toolbox.items.splice(0, creator.toolbox.items.length);
  
  // Add clean toolbox items from our configuration
  cleanToolboxItems.forEach(item => {
    creator.toolbox.addItem(item);
  });
  
  // Add healthcare-specific items
  healthcareToolboxItems.forEach(item => {
    creator.toolbox.addItem(item);
  });
  
  // Disable search functionality completely
  creator.toolbox.searchEnabled = false;
  
  // Additional settings to ensure toolbox stays expanded
  creator.toolbox.isCompact = false;
  
  // The toolbox is now configured with clean items in expanded view
  
  // Set default theme for all new surveys
  creator.onSurveyInstanceCreated.add((sender, options) => {
    options.survey.applyTheme(materialUITheme as ITheme);
  });
  
  return creator;
};

// Configure Survey Model for rendering
export const createSurveyModel = (json: any, options?: { isBuilder?: boolean; isPreview?: boolean }): SurveyModel => {
  const survey = new SurveyModel(json);
  
  // Apply appropriate theme based on context
  const theme = getThemeForContext(options?.isBuilder || false, options?.isPreview || false);
  survey.applyTheme(theme as ITheme);
  
  // Apply enhanced multi-column layout
  applyMultiColumnLayout(survey);
  
  // Configure survey settings from JSON or use defaults
  survey.showProgressBar = json?.showProgressBar || 'top';
  survey.progressBarType = json?.progressBarType || 'pages';
  survey.showQuestionNumbers = json?.showQuestionNumbers || 'off';
  survey.questionTitleLocation = json?.questionTitleLocation || 'top';
  survey.showCompletedPage = false;
  survey.checkErrorsMode = 'onValueChanged';
  survey.textUpdateMode = 'onTyping';
  survey.questionErrorLocation = 'bottom';
  survey.requiredText = '*';
  survey.questionStartIndex = '1';
  
  // CRITICAL: Enable responsive layout for multi-column forms
  survey.widthMode = json.widthMode || 'responsive';
  survey.fitToContainer = true;
  
  // Support multi-column layout
  survey.questionDescriptionLocation = 'underTitle';
  
  // HIPAA compliance settings
  survey.clearInvisibleValues = 'onHidden';
  survey.sendResultOnPageNext = false;
  survey.storeOthersAsComment = false;
  
  // Enhanced accessibility
  survey.focusOnFirstError = true;
  survey.navigationBarShowProgress = true;
  
  // Multi-column support is now handled by applyMultiColumnLayout function
  
  return survey;
};

// Healthcare form templates
export const healthcareTemplates = {
  'patient-intake': {
    name: 'Patient Intake Form',
    category: 'intake',
    description: 'Comprehensive patient intake form for new patients',
    json: {
      title: 'Patient Intake Form',
      description: 'Please complete this form with your personal and medical information',
      pages: [
        {
          name: 'personal-info',
          title: 'Personal Information',
          elements: [
            {
              type: 'dropdown',
              name: 'name_prefix',
              title: 'Prefix',
              choices: [
                { value: '', text: 'None' },
                { value: 'Dr.', text: 'Dr.' },
                { value: 'Mr.', text: 'Mr.' },
                { value: 'Mrs.', text: 'Mrs.' },
                { value: 'Ms.', text: 'Ms.' }
              ]
            },
            {
              type: 'text',
              name: 'first_name',
              title: 'First Name',
              isRequired: true
            },
            {
              type: 'text',
              name: 'middle_name',
              title: 'Middle Name'
            },
            {
              type: 'text',
              name: 'last_name',
              title: 'Last Name',
              isRequired: true
            },
            {
              type: 'dropdown',
              name: 'name_suffix',
              title: 'Suffix',
              choices: [
                { value: '', text: 'None' },
                { value: 'Jr.', text: 'Jr.' },
                { value: 'Sr.', text: 'Sr.' },
                { value: 'II', text: 'II' },
                { value: 'III', text: 'III' },
                { value: 'IV', text: 'IV' }
              ]
            },
            {
              type: 'text',
              name: 'date_of_birth',
              title: 'Date of Birth',
              inputType: 'date',
              isRequired: true
            },
            {
              type: 'dropdown',
              name: 'gender',
              title: 'Gender',
              choices: ['Male', 'Female', 'Other', 'Prefer not to say']
            },
            {
              type: 'text',
              name: 'phone',
              title: 'Phone Number',
              validators: [{ type: 'regex', regex: '^\\d{10}$|^\\d{3}-\\d{3}-\\d{4}$' }],
              isRequired: true
            },
            {
              type: 'text',
              name: 'email',
              title: 'Email Address',
              inputType: 'email',
              isRequired: true
            }
          ]
        },
        {
          name: 'medical-history',
          title: 'Medical History',
          elements: [
            {
              type: 'checkbox',
              name: 'allergies',
              title: 'Do you have any allergies?',
              choices: [
                'No known allergies',
                'Drug allergies',
                'Food allergies',
                'Environmental allergies',
                'Other'
              ]
            },
            {
              type: 'medication-list',
              name: 'current_medications',
              title: 'Current Medications'
            },
            {
              type: 'checkbox',
              name: 'medical_conditions',
              title: 'Please check any conditions you currently have:',
              choices: [
                'Diabetes',
                'High Blood Pressure',
                'Heart Disease',
                'Asthma',
                'Depression',
                'Anxiety',
                'Other'
              ]
            }
          ]
        },
        {
          name: 'consent',
          title: 'Consent and Authorization',
          elements: [
            {
              type: 'html',
              name: 'privacy_notice',
              html: '<h3>HIPAA Privacy Notice</h3><p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information.</p>'
            },
            {
              type: 'consent-checkbox',
              name: 'hipaa_consent',
              title: 'I acknowledge that I have received and understand the HIPAA Privacy Notice'
            },
            {
              type: 'consent-checkbox',
              name: 'treatment_consent',
              title: 'I consent to treatment by this healthcare provider'
            },
            {
              type: 'signaturepad',
              name: 'patient_signature',
              title: 'Patient Signature',
              isRequired: true
            }
          ]
        }
      ]
    }
  }
};

export const applyMultiColumnLayout = (survey: any) => {
  if (!survey._multiColumnLayoutApplied) {
    survey._multiColumnLayoutApplied = true;
    
    survey.onAfterRenderPage.add((sender: any, options: any) => {
      // Apply flexbox to the page content for multi-column layout
      const pageContent = options.htmlElement.querySelector('.sd-page__content, .sv-page__content, .sv_p_container');
      if (pageContent) {
        pageContent.style.display = 'flex';
        pageContent.style.flexWrap = 'wrap';
        pageContent.style.gap = '1rem';
        pageContent.style.alignItems = 'flex-start';
      }
      
      // Apply width to questions based on their width property
      const questions = options.htmlElement.querySelectorAll('.sd-question, .sv_q, .sv_qstn');
      questions.forEach((question: Element) => {
        const questionElement = question as HTMLElement;
        const questionName = questionElement.getAttribute('data-name');
        
        if (questionName) {
          const questionModel = survey.getQuestionByName(questionName);
          if (questionModel && questionModel.width) {
            const width = questionModel.width;
            questionElement.style.flex = `0 0 calc(${width} - 0.5rem)`;
            questionElement.style.maxWidth = `calc(${width} - 0.5rem)`;
            questionElement.style.minWidth = '200px';
            
            // Ensure questions don't break to new line unless specified
            if (!questionModel.startWithNewLine) {
              questionElement.style.marginLeft = '0';
            }
          } else {
            // Default to full width if no width specified
            questionElement.style.flex = '0 0 100%';
            questionElement.style.maxWidth = '100%';
          }
        }
      });
      
      // Special handling for radio groups to display inline
      const radioGroups = options.htmlElement.querySelectorAll('[data-name="gender"] .sd-selectbase__column, [data-name="gender"] .sv_q_radiogroup_column');
      radioGroups.forEach((col: Element) => {
        (col as HTMLElement).style.display = 'inline-block';
        (col as HTMLElement).style.marginRight = '2rem';
      });
      
      // Apply responsive behavior
      const applyResponsive = () => {
        const width = window.innerWidth;
        if (width < 768) {
          // On mobile, stack all fields vertically
          questions.forEach((question: Element) => {
            const questionElement = question as HTMLElement;
            questionElement.style.flex = '0 0 100%';
            questionElement.style.maxWidth = '100%';
          });
        } else {
          // Re-apply desktop widths
          questions.forEach((question: Element) => {
            const questionElement = question as HTMLElement;
            const questionName = questionElement.getAttribute('data-name');
            if (questionName) {
              const questionModel = survey.getQuestionByName(questionName);
              if (questionModel && questionModel.width) {
                const width = questionModel.width;
                questionElement.style.flex = `0 0 calc(${width} - 0.5rem)`;
                questionElement.style.maxWidth = `calc(${width} - 0.5rem)`;
              }
            }
          });
        }
      };
      
      // Apply responsive behavior on load and resize
      applyResponsive();
      window.addEventListener('resize', applyResponsive);
    });
  }
};

const surveyConfig = {
  healthcareThemes,
  healthcareValidators,
  healthcareQuestionTypes,
  healthcareTemplates,
  createSurveyCreator,
  createSurveyModel,
  applyMultiColumnLayout
};

export default surveyConfig;