// Minimal, stable toolbox configuration for SurveyJS
// Start with only the most basic, essential items

export const minimalToolboxItems = [
  // Core Text Input (without sub-types)
  {
    name: 'text',
    title: 'Text Input',
    iconName: 'icon-text',
    json: { type: 'text' }
  },
  
  // Basic Selection
  {
    name: 'radiogroup',
    title: 'Radio Buttons',
    iconName: 'icon-radiogroup',
    json: { 
      type: 'radiogroup',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    name: 'dropdown',
    title: 'Dropdown',
    iconName: 'icon-dropdown',
    json: { 
      type: 'dropdown',
      placeholder: 'Select an option',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  
  // Boolean
  {
    name: 'boolean',
    title: 'Yes/No',
    iconName: 'icon-boolean',
    json: { type: 'boolean' }
  },
  
  // Comment
  {
    name: 'comment',
    title: 'Long Text',
    iconName: 'icon-comment',
    json: { type: 'comment', rows: 4 }
  },
  
  // Date of Birth with Age Calculator
  {
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
  },
  
  // Today's Date (auto-populates)
  {
    name: 'todays-date',
    title: "Today's Date",
    iconName: 'icon-text',
    category: 'Patient Info',
    json: {
      type: 'todaysdate',
      name: 'form_date',
      title: "Today's Date",
      autoPopulate: true,
      readOnly: false,
      isRequired: false
    }
  },
  
  // Insurance Card Capture
  {
    name: 'insurance-card-capture',
    title: 'Insurance Card Capture',
    iconName: 'icon-file',
    json: {
      type: 'panel',
      title: 'Insurance Card Information',
      description: 'Upload or capture photos of your insurance card',
      metadata: { patternType: 'insurance_card' },
      elements: [
        {
          type: 'file',
          name: 'insurance_card_front',
          title: 'Front of Insurance Card',
          acceptedTypes: 'image/*',
          storeDataAsText: false,
          allowMultiple: false,
          maxSize: 10485760,
          description: 'Take a photo or upload the FRONT of your insurance card',
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
          description: 'Take a photo or upload the BACK of your insurance card',
          sourceType: 'camera,file-picker',
          allowImagesPreview: true,
          isRequired: false
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
          name: 'insurance_company',
          title: 'Insurance Company',
          description: 'Auto-populated from card',
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
          description: 'Auto-populated from card',
          readOnly: false
        }
      ]
    }
  }
];

// Phase 2: Add these once minimal is stable
export const phase2ToolboxItems = [
  {
    name: 'checkbox',
    title: 'Checkboxes',
    iconName: 'icon-checkbox',
    json: { 
      type: 'checkbox',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    name: 'rating',
    title: 'Rating',
    iconName: 'icon-rating',
    json: { 
      type: 'rating',
      rateMin: 1,
      rateMax: 5
    }
  }
];

// Phase 3: Healthcare-specific (add one at a time)
export const phase3HealthcareItems = [
  {
    name: 'signaturepad',
    title: 'Signature',
    iconName: 'icon-signaturepad',
    json: { type: 'signaturepad' }
  },
  // Patient Vitals Panel
  {
    name: 'vitals-panel',
    title: 'Patient Vitals',
    iconName: 'icon-panel',
    category: 'Vitals',
    json: {
      type: 'panel',
      name: 'patient_vitals',
      title: 'Patient Vitals',
      metadata: { patternType: 'patient_vitals' },
      elements: [
        {
          type: 'html',
          name: 'vitals_instructions',
          html: '<p style="color: #666; margin-bottom: 20px;">Please enter your height and weight:</p>'
        },
        {
          type: 'text',
          name: 'height_feet',
          title: 'Height - Feet',
          inputType: 'number',
          min: 4,
          max: 6,
          defaultValue: 5,
          width: '50%',
          startWithNewLine: false
        },
        {
          type: 'text',
          name: 'height_inches',
          title: 'Height - Inches',
          inputType: 'number',
          min: 0,
          max: 11,
          defaultValue: 6,
          width: '50%',
          startWithNewLine: false
        },
        {
          type: 'text',
          name: 'weight',
          title: 'Weight (pounds)',
          inputType: 'number',
          min: 50,
          max: 500,
          defaultValue: 150
        },
        {
          type: 'html',
          name: 'bmi_calculation',
          html: '<div style="margin-top: 20px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"><strong>BMI will be calculated automatically</strong></div>'
        }
      ]
    }
  }
];