// Clean, organized toolbox items for SurveyJS
export const cleanToolboxItems = [
  // Basic Information
  {
    name: 'text',
    title: 'Text Input',
    iconName: 'icon-text',
    json: { type: 'text' }
  },
  {
    name: 'comment',
    title: 'Long Text',
    iconName: 'icon-comment',
    json: { type: 'comment', rows: 4 }
  },
  {
    name: 'email',
    title: 'Email',
    iconName: 'icon-text',
    json: { 
      type: 'text',
      inputType: 'email',
      validators: [{ type: 'email' }]
    }
  },
  {
    name: 'phone',
    title: 'Phone',
    iconName: 'icon-text',
    json: { 
      type: 'text',
      inputType: 'tel',
      validators: [{ 
        type: 'regex',
        regex: '^[\\(]?([0-9]{3})[\\)]?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$',
        text: 'Please enter a valid phone number'
      }]
    }
  },
  {
    name: 'address',
    title: 'Address',
    iconName: 'icon-multipletext',
    json: {
      type: 'multipletext',
      title: 'Address',
      items: [
        { name: 'street', title: 'Street Address' },
        { name: 'city', title: 'City' },
        { name: 'state', title: 'State/Province' },
        { name: 'zip', title: 'ZIP/Postal Code' }
      ]
    }
  },
  
  // Date & Time
  {
    name: 'date',
    title: 'Date Picker',
    iconName: 'icon-text',
    json: { 
      type: 'text',
      inputType: 'date'
    }
  },
  {
    name: 'datetime',
    title: 'Date & Time',
    iconName: 'icon-text',
    json: { 
      type: 'text',
      inputType: 'datetime-local'
    }
  },
  
  // Selection
  {
    name: 'radiogroup',
    title: 'Single Choice',
    iconName: 'icon-radiogroup',
    json: { 
      type: 'radiogroup',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    name: 'checkbox',
    title: 'Multiple Choice',
    iconName: 'icon-checkbox',
    json: { 
      type: 'checkbox',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    name: 'dropdown',
    title: 'Dropdown List',
    iconName: 'icon-dropdown',
    json: { 
      type: 'dropdown',
      placeholder: 'Select an option',
      choices: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  {
    name: 'boolean',
    title: 'Yes/No',
    iconName: 'icon-boolean',
    json: { type: 'boolean' }
  },
  
  // Rating & Scale
  {
    name: 'rating',
    title: 'Rating Scale',
    iconName: 'icon-rating',
    json: { 
      type: 'rating',
      rateMin: 1,
      rateMax: 5
    }
  },
  {
    name: 'range',
    title: 'Range Slider',
    iconName: 'icon-text',
    json: { 
      type: 'text',
      inputType: 'range',
      min: 0,
      max: 100,
      step: 1
    }
  },
  
  // Files & Signatures
  {
    name: 'file',
    title: 'File/Image Upload',
    iconName: 'icon-file',
    json: { 
      type: 'file',
      acceptedTypes: 'image/*',
      storeDataAsText: false,
      allowMultiple: false,
      maxSize: 10485760
    }
  },
  {
    name: 'signaturepad',
    title: 'Digital Signature',
    iconName: 'icon-signaturepad',
    json: { type: 'signaturepad' }
  },
  
  // Layout
  {
    name: 'html',
    title: 'Heading/Text',
    iconName: 'icon-html',
    json: { 
      type: 'html',
      html: '<h3>Section Title</h3><p>Add your text here</p>'
    }
  },
  {
    name: 'panel',
    title: 'Section',
    iconName: 'icon-panel',
    json: { 
      type: 'panel',
      title: 'Section Title',
      elements: []
    }
  }
];

// Healthcare-specific items to add at the end
export const healthcareToolboxItems = [
  {
    name: 'patient-demographics',
    title: 'Patient Info (FHIR)',
    iconName: 'icon-panel',
    json: {
      type: 'panel',
      title: 'Patient Information',
      elements: [
        {
          type: 'text',
          name: 'first_name',
          title: 'First Name',
          isRequired: true
        },
        {
          type: 'text',
          name: 'last_name',
          title: 'Last Name',
          isRequired: true
        },
        {
          type: 'text',
          name: 'date_of_birth',
          title: 'Date of Birth',
          inputType: 'date',
          isRequired: true
        }
      ]
    }
  },
  {
    name: 'insurance-card-upload',
    title: 'Insurance Card Upload',
    iconName: 'icon-file',
    json: {
      type: 'panel',
      title: 'Insurance Card Upload',
      elements: [
        {
          type: 'file',
          name: 'insurance_card_front',
          title: 'Front of Insurance Card',
          acceptedTypes: 'image/*',
          isRequired: true
        },
        {
          type: 'file',
          name: 'insurance_card_back',
          title: 'Back of Insurance Card',
          acceptedTypes: 'image/*',
          isRequired: true
        }
      ]
    }
  },
  {
    name: 'medication-list',
    title: 'Current Medications',
    iconName: 'icon-matrix',
    json: {
      type: 'matrixdynamic',
      title: 'Current Medications',
      addRowText: 'Add Medication',
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
          cellType: 'text'
        },
        {
          name: 'frequency',
          title: 'Frequency',
          cellType: 'dropdown',
          choices: ['Once daily', 'Twice daily', 'Three times daily', 'As needed']
        }
      ]
    }
  },
  {
    name: 'allergy-list',
    title: 'Allergies',
    iconName: 'icon-matrix',
    json: {
      type: 'matrixdynamic',
      title: 'Allergies',
      addRowText: 'Add Allergy',
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
          cellType: 'text'
        }
      ]
    }
  },
  {
    name: 'medical-history',
    title: 'Medical History',
    iconName: 'icon-checkbox',
    json: {
      type: 'checkbox',
      title: 'Medical History',
      choices: [
        'Diabetes',
        'High Blood Pressure',
        'Heart Disease',
        'Asthma',
        'None of the above'
      ],
      hasOther: true
    }
  },
  {
    name: 'consent-checkbox',
    title: 'Consent Agreement',
    iconName: 'icon-boolean',
    json: {
      type: 'boolean',
      title: 'I agree to the terms and conditions',
      isRequired: true,
      labelTrue: 'I agree',
      labelFalse: 'I do not agree'
    }
  },
  {
    name: 'bodypaindiagram',
    title: 'Body Pain Diagram',
    iconName: 'icon-image',
    json: {
      type: 'bodypaindiagram',
      name: 'pain_areas',
      title: 'Please mark areas where you experience pain'
    }
  }
];