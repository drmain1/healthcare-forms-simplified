import { 
  SurveyModel,
  setLicenseKey,
  ITheme
} from 'survey-core';
import { SurveyCreator } from 'survey-creator-react';
import { ICreatorOptions } from 'survey-creator-core';
import { minimalToolboxItems } from './minimalToolboxConfig';

// Apply SurveyJS license
const licenseKey = process.env.REACT_APP_SURVEYJS_LICENSE_KEY;
if (licenseKey) {
  setLicenseKey(licenseKey);
}

// Create a minimal, stable SurveyJS Creator instance
export const createMinimalSurveyCreator = (): SurveyCreator => {
  // Basic creator options - keep it simple
  const creatorOptions: ICreatorOptions = {
    showLogicTab: true,
    showJSONEditorTab: false,
    showTestSurveyTab: true,
    showSidebar: true,
    showSurveyTitle: true,
    showSurveyDescription: true,
    allowChangeTheme: false, // Disable theme switching for now
    showToolbox: true
  };

  const creator = new SurveyCreator(creatorOptions);
  
  // List of items to remove from toolbox
  const itemsToRemove = [
    'rating',      // Rating scale
    // 'panel',    // Panel - KEEP THIS for insurance card capture
    'paneldynamic', // Dynamic panel (if exists)
    'image',       // Image
    'html',        // HTML
    'multipletext', // Multiple textboxes
    'expression',  // Expression (readonly)
    'imagepicker', // Image picker
    'text-email',   // Single line input subtypes
    'text-number',
    'text-url',
    'text-color',
    'text-date',
    'text-datetime',
    'text-datetime-local',
    'text-month',
    'text-time',
    'text-week'
  ];
  
  // Remove unwanted items
  itemsToRemove.forEach(itemName => {
    creator.toolbox.removeItem(itemName);
  });
  
  // Add our custom insurance card capture
  const insuranceCardCapture = {
    name: 'insurance-card-capture',
    title: 'Insurance Card Capture',
    iconName: 'icon-file',
    json: {
      type: 'panel',
      title: 'Insurance Card Information',
      description: 'Upload or capture photos of your insurance card',
      elements: [
        {
          type: 'file',
          name: 'insurance_card_front',
          title: 'Front of Insurance Card',
          acceptedTypes: 'image/*',
          storeDataAsText: true,
          allowMultiple: false,
          maxSize: 10485760,
          description: 'Take a photo or upload the FRONT of your insurance card',
          sourceType: 'camera,file-picker',
          allowImagesPreview: true,
          isRequired: true,
          needConfirmRemoveFile: false,
          waitForUpload: false
        },
        {
          type: 'file',
          name: 'insurance_card_back',
          title: 'Back of Insurance Card',
          acceptedTypes: 'image/*',
          storeDataAsText: true,
          allowMultiple: false,
          maxSize: 10485760,
          description: 'Take a photo or upload the BACK of your insurance card',
          sourceType: 'camera,file-picker',
          allowImagesPreview: true,
          isRequired: false,
          needConfirmRemoveFile: false,
          waitForUpload: false
        },
        {
          type: 'html',
          name: 'insurance_processing_status',
          html: '<p style="color: #666; font-style: italic;">Information will be automatically extracted from your insurance card</p>'
        },
        {
          type: 'text',
          name: 'insurance_member_id',
          title: 'Member ID',
          description: 'Auto-populated from card',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_member_name',
          title: 'Member Name',
          description: 'Auto-populated from card',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_issuer_name',
          title: 'Insurance Company',
          description: 'Auto-populated from card (e.g., Blue Cross, Aetna)',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_group_number',
          title: 'Group Number',
          description: 'Auto-populated from card',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_plan_type',
          title: 'Plan Type',
          description: 'Auto-populated from card (e.g., PPO, HMO)',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_rx_bin',
          title: 'RX BIN',
          description: 'Prescription benefit ID',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_rx_pcn',
          title: 'RX PCN',
          description: 'Processor control number',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_rx_group',
          title: 'RX Group',
          description: 'Prescription group number',
          readOnly: false
        },
        {
          type: 'html',
          name: 'copay_section',
          html: '<h4 style="margin-top: 20px; margin-bottom: 10px;">Copayment Information</h4>'
        },
        {
          type: 'text',
          name: 'insurance_copay_pcp',
          title: 'Primary Care Copay',
          description: 'Copay for primary care visits',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_copay_specialist',
          title: 'Specialist Copay',
          description: 'Copay for specialist visits',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_copay_emergency',
          title: 'Emergency Room Copay',
          description: 'Copay for emergency visits',
          readOnly: false
        },
        {
          type: 'html',
          name: 'deductible_section',
          html: '<h4 style="margin-top: 20px; margin-bottom: 10px;">Deductibles & Limits</h4>'
        },
        {
          type: 'text',
          name: 'insurance_deductible',
          title: 'Annual Deductible',
          description: 'Annual deductible amount',
          readOnly: false
        },
        {
          type: 'text',
          name: 'insurance_oop_max',
          title: 'Out-of-Pocket Maximum',
          description: 'Annual out-of-pocket maximum',
          readOnly: false
        }
      ]
    }
  };
  
  creator.toolbox.addItem(insuranceCardCapture);
  
  // Add a combined Height/Weight Vitals panel
  const vitalsPanel = {
    name: 'vitals-panel',
    title: 'Patient Vitals',
    iconName: 'icon-panel',
    category: 'Vitals',
    json: {
      type: 'panel',
      name: 'patient_vitals',
      title: 'Patient Vitals',
      elements: [
        {
          type: 'html',
          name: 'vitals_instructions',
          html: '<p style="color: #666; margin-bottom: 20px;">Please enter your height and weight using the sliders below:</p>'
        },
        {
          type: 'heightslider',
          name: 'patient_height',
          title: 'Height',
          defaultValue: 66
        },
        {
          type: 'weightslider',
          name: 'patient_weight',
          title: 'Weight',
          defaultValue: 150
        },
        {
          type: 'html',
          name: 'bmi_calculation',
          html: '<div style="margin-top: 20px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"><strong>BMI will be calculated automatically</strong></div>'
        }
      ]
    }
  };
  
  creator.toolbox.addItem(vitalsPanel);
  
  // Add Body Pain Diagram
  const bodyPainDiagram = {
    name: 'bodypaindiagram',
    title: 'Body Pain Diagram',
    iconName: 'icon-panel',
    category: 'Healthcare',
    json: {
      type: 'bodypaindiagram',
      name: 'pain_areas',
      title: 'Please mark areas where you experience pain',
      description: 'Click on the body diagram to indicate pain locations'
    }
  };
  
  creator.toolbox.addItem(bodyPainDiagram);
  
  // Add Date of Birth with Age Calculator
  const dateOfBirthComponent = {
    name: 'date-of-birth',
    title: 'Date of Birth',
    iconName: 'icon-text',
    category: 'Patient Info',
    json: {
      type: 'dateofbirth',
      name: 'patient_dob',
      title: 'Date of Birth',
      isRequired: true,
      ageFieldName: 'patient_age'
    }
  };
  
  creator.toolbox.addItem(dateOfBirthComponent);
  
  // Add Patient Demographics Component
  const patientDemographicsComponent = {
    name: 'patient-demographics',
    title: 'Patient Demographics',
    iconName: 'icon-panel',
    category: 'Patient Info',
    json: {
      type: 'panel',
      name: 'patient_demographics',
      title: 'Patient Demographics',
      elements: [
        {
          type: 'html',
          name: 'demographics_header',
          html: '<h3 style="margin-bottom: 20px; color: #333;">Patient Information</h3>'
        },
        {
          type: 'text',
          name: 'first_name',
          title: 'First Name',
          isRequired: true,
          cssClasses: 'demographic-field with-icon',
          validators: [{
            type: 'text',
            minLength: 2,
            maxLength: 50
          }]
        },
        {
          type: 'text',
          name: 'last_name',
          title: 'Last Name',
          isRequired: true,
          validators: [{
            type: 'text',
            minLength: 2,
            maxLength: 50
          }]
        },
        {
          type: 'dateofbirth',
          name: 'date_of_birth',
          title: 'Date of Birth',
          isRequired: true,
          ageFieldName: 'calculated_age'
        },
        {
          type: 'dropdown',
          name: 'sex_at_birth',
          title: 'Sex Assigned at Birth',
          isRequired: true,
          choices: [
            { value: 'male', text: 'Male' },
            { value: 'female', text: 'Female' },
            { value: 'other', text: 'Other' },
            { value: 'prefer_not_to_answer', text: 'Prefer not to answer' }
          ],
          placeholder: 'Select sex assigned at birth...'
        },
        {
          type: 'text',
          name: 'street_address',
          title: 'Street Address',
          isRequired: true,
          placeholder: '123 Main Street'
        },
        {
          type: 'text',
          name: 'city',
          title: 'City',
          isRequired: true,
          placeholder: 'New York'
        },
        {
          type: 'dropdown',
          name: 'state',
          title: 'State',
          isRequired: true,
          itemComponent: 'custom-dropdown-item',
          choices: [
            { value: 'AL', text: 'Alabama', iconType: 'state' },
            { value: 'AK', text: 'Alaska', iconType: 'state' },
            { value: 'AZ', text: 'Arizona', iconType: 'state' },
            { value: 'AR', text: 'Arkansas', iconType: 'state' },
            { value: 'CA', text: 'California', iconType: 'state' },
            { value: 'CO', text: 'Colorado', iconType: 'state' },
            { value: 'CT', text: 'Connecticut', iconType: 'state' },
            { value: 'DE', text: 'Delaware', iconType: 'state' },
            { value: 'FL', text: 'Florida', iconType: 'state' },
            { value: 'GA', text: 'Georgia', iconType: 'state' },
            { value: 'HI', text: 'Hawaii', iconType: 'state' },
            { value: 'ID', text: 'Idaho', iconType: 'state' },
            { value: 'IL', text: 'Illinois', iconType: 'state' },
            { value: 'IN', text: 'Indiana', iconType: 'state' },
            { value: 'IA', text: 'Iowa', iconType: 'state' },
            { value: 'KS', text: 'Kansas', iconType: 'state' },
            { value: 'KY', text: 'Kentucky', iconType: 'state' },
            { value: 'LA', text: 'Louisiana', iconType: 'state' },
            { value: 'ME', text: 'Maine', iconType: 'state' },
            { value: 'MD', text: 'Maryland', iconType: 'state' },
            { value: 'MA', text: 'Massachusetts', iconType: 'state' },
            { value: 'MI', text: 'Michigan', iconType: 'state' },
            { value: 'MN', text: 'Minnesota', iconType: 'state' },
            { value: 'MS', text: 'Mississippi', iconType: 'state' },
            { value: 'MO', text: 'Missouri', iconType: 'state' },
            { value: 'MT', text: 'Montana', iconType: 'state' },
            { value: 'NE', text: 'Nebraska', iconType: 'state' },
            { value: 'NV', text: 'Nevada', iconType: 'state' },
            { value: 'NH', text: 'New Hampshire', iconType: 'state' },
            { value: 'NJ', text: 'New Jersey', iconType: 'state' },
            { value: 'NM', text: 'New Mexico', iconType: 'state' },
            { value: 'NY', text: 'New York', iconType: 'state' },
            { value: 'NC', text: 'North Carolina', iconType: 'state' },
            { value: 'ND', text: 'North Dakota', iconType: 'state' },
            { value: 'OH', text: 'Ohio', iconType: 'state' },
            { value: 'OK', text: 'Oklahoma', iconType: 'state' },
            { value: 'OR', text: 'Oregon', iconType: 'state' },
            { value: 'PA', text: 'Pennsylvania', iconType: 'state' },
            { value: 'RI', text: 'Rhode Island', iconType: 'state' },
            { value: 'SC', text: 'South Carolina', iconType: 'state' },
            { value: 'SD', text: 'South Dakota', iconType: 'state' },
            { value: 'TN', text: 'Tennessee', iconType: 'state' },
            { value: 'TX', text: 'Texas', iconType: 'state' },
            { value: 'UT', text: 'Utah', iconType: 'state' },
            { value: 'VT', text: 'Vermont', iconType: 'state' },
            { value: 'VA', text: 'Virginia', iconType: 'state' },
            { value: 'WA', text: 'Washington', iconType: 'state' },
            { value: 'WV', text: 'West Virginia', iconType: 'state' },
            { value: 'WI', text: 'Wisconsin', iconType: 'state' },
            { value: 'WY', text: 'Wyoming', iconType: 'state' }
          ],
          placeholder: 'Select a state...'
        },
        {
          type: 'text',
          name: 'zip_code',
          title: 'ZIP Code',
          isRequired: true,
          inputType: 'text',
          validators: [{
            type: 'regex',
            regex: '^[0-9]{5}(-[0-9]{4})?$',
            text: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
          }],
          placeholder: '12345'
        },
        {
          type: 'text',
          name: 'phone_number',
          title: 'Primary Phone Number',
          isRequired: true,
          inputType: 'tel',
          placeholder: '(555) 123-4567',
          validators: [{
            type: 'regex',
            regex: '^\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$',
            text: 'Please enter a valid 10-digit phone number (e.g., (555) 123-4567)'
          }]
        },
        {
          type: 'text',
          name: 'secondary_phone',
          title: 'Secondary Phone Number (Optional)',
          inputType: 'tel',
          placeholder: '(555) 987-6543',
          validators: [{
            type: 'regex',
            regex: '^$|^\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$',
            text: 'Please enter a valid 10-digit phone number (e.g., (555) 987-6543)'
          }]
        },
        {
          type: 'text',
          name: 'email',
          title: 'Email Address',
          inputType: 'email',
          placeholder: 'patient@example.com',
          validators: [{
            type: 'email'
          }]
        }
      ]
    }
  };
  
  creator.toolbox.addItem(patientDemographicsComponent);
  
  // Add Terms and Conditions component
  const termsAndConditionsComponent = {
    name: 'terms-and-conditions',
    title: 'Terms & Conditions',
    iconName: 'icon-checkbox',
    category: 'Legal',
    json: {
      type: 'panel',
      name: 'terms_and_conditions_panel',
      title: 'Terms and Conditions',
      elements: [
        {
          type: 'html',
          name: 'terms_header',
          html: '<h3 style="margin-bottom: 20px; color: #333;">Terms and Conditions</h3>'
        },
        {
          type: 'html',
          name: 'terms_content',
          html: `<div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 4px;">
            <p><strong>Please read and accept the following terms and conditions:</strong></p>
            <p>By submitting this form, I acknowledge that:</p>
            <ul>
              <li>The information I have provided is accurate and complete to the best of my knowledge</li>
              <li>I understand that providing false information may affect my medical treatment</li>
              <li>I consent to the collection and use of my personal health information for treatment purposes</li>
              <li>I understand that my information will be handled in accordance with HIPAA privacy regulations</li>
              <li>I have the right to request access to my medical records</li>
              <li>I may withdraw my consent at any time by contacting the healthcare provider</li>
            </ul>
            <p>For the full privacy policy and terms of service, please visit our website or request a copy from our office.</p>
          </div>`
        },
        {
          type: 'checkbox',
          name: 'accept_terms',
          title: 'Agreement',
          isRequired: true,
          choices: [
            {
              value: 'accepted',
              text: 'I have read and accept the terms and conditions'
            }
          ],
          validators: [{
            type: 'answercount',
            minCount: 1,
            text: 'You must accept the terms and conditions to proceed'
          }]
        },
        {
          type: 'signaturepad',
          name: 'terms_signature',
          title: 'Electronic Signature',
          description: 'Please sign to confirm your acceptance',
          isRequired: true,
          width: '300px',
          height: '150px'
        },
        {
          type: 'text',
          name: 'terms_signed_date',
          title: 'Date',
          inputType: 'date',
          defaultValue: new Date().toISOString().split('T')[0],
          readOnly: true
        }
      ]
    }
  };
  
  creator.toolbox.addItem(termsAndConditionsComponent);
  
  // Add a simpler Terms Checkbox component
  const simpleTermsCheckbox = {
    name: 'simple-terms-checkbox',
    title: 'Terms Checkbox (Simple)',
    iconName: 'icon-checkbox',
    category: 'Legal',
    json: {
      type: 'checkbox',
      name: 'terms_acceptance',
      title: 'Terms and Conditions',
      isRequired: true,
      choices: [
        {
          value: 'accepted',
          text: 'I have read and accept the terms and conditions, privacy policy, and consent to treatment'
        }
      ],
      validators: [{
        type: 'answercount',
        minCount: 1,
        text: 'You must accept the terms and conditions to submit this form'
      }]
    }
  };
  
  creator.toolbox.addItem(simpleTermsCheckbox);
  
  // Keep toolbox expanded and searchable
  creator.toolbox.isCompact = false;
  creator.toolbox.searchEnabled = true;
  
  return creator;
};

// Alternative approach: Clear defaults but use SurveyJS's expected structure
export const createCleanSurveyCreator = (): SurveyCreator => {
  const creatorOptions: ICreatorOptions = {
    showLogicTab: true,
    showJSONEditorTab: false,
    showTestSurveyTab: true,
    showSidebar: true,
    showToolbox: true
  };

  const creator = new SurveyCreator(creatorOptions);
  
  // Clear existing items and add our minimal set
  creator.toolbox.items.splice(0, creator.toolbox.items.length);
  
  // Add minimal items directly to toolbox
  minimalToolboxItems.forEach(item => {
    creator.toolbox.addItem(item);
  });
  
  // Configure toolbox appearance
  creator.toolbox.isCompact = false;
  creator.toolbox.showCategoryTitles = false;
  
  return creator;
};

// Create Survey Model - keep this simple too
export const createMinimalSurveyModel = (json: any): SurveyModel => {
  const survey = new SurveyModel(json);
  
  // Basic settings only
  survey.showProgressBar = 'top';
  survey.showQuestionNumbers = 'off';
  survey.questionTitleLocation = 'top';
  survey.showCompletedPage = true;
  
  return survey;
};