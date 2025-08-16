import { 
  SurveyModel,
  setLicenseKey
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
    showJSONEditorTab: true,
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
  
  // Add Body Diagram 2
  const bodyDiagram2 = {
    name: 'bodydiagram2',
    title: 'Body Diagram 2',
    iconName: 'icon-panel',
    category: 'Healthcare',
    json: {
      type: 'bodydiagram2',
      name: 'sensation_areas',
      title: 'Please mark areas where you experience different sensations',
      description: 'Click on the body diagram to indicate sensation locations and types'
    }
  };
  
  creator.toolbox.addItem(bodyDiagram2);
  
  // Add Visual Analog Scale & Pain Assessment
    const visualAnalogPainAssessment = {
    name: 'visual-analog-pain-assessment',
    title: 'Complete Pain Assessment (VAS)',
    iconName: 'icon-panel',
    category: 'Healthcare',
    json: {
      type: 'panel',
      name: 'pain_assessment_panel', // Name for backend detection
      title: 'Visual Analog Scale & Pain Assessment',
      description: 'For each area below, please describe your present pain level and frequency.',
      elements: [
        // Neck
        {
          type: 'panel',
          name: 'neck_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_neck_pain',
              title: 'Neck Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'neck_details_panel',
              visibleIf: "{has_neck_pain} = 'Yes'",
              elements: [
                {
                  type: 'slider',
                  name: 'neck_pain_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'neck_pain_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Headaches
        {
          type: 'panel',
          name: 'headaches_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_headaches',
              title: 'Headaches',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'headaches_details_panel',
              visibleIf: "{has_headaches} = 'Yes'",
              elements: [
                {
                  type: 'slider',
                  name: 'headaches_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'headaches_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Low Back
        {
          type: 'panel',
          name: 'low_back_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_low_back_pain',
              title: 'Low Back Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'low_back_details_panel',
              visibleIf: "{has_low_back_pain} = 'Yes'",
              elements: [
                {
                  type: 'slider',
                  name: 'low_back_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'low_back_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Mid Back
        {
          type: 'panel',
          name: 'mid_back_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_mid_back_pain',
              title: 'Mid Back Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'mid_back_details_panel',
              visibleIf: "{has_mid_back_pain} = 'Yes'",
              elements: [
                {
                  type: 'slider',
                  name: 'mid_back_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'mid_back_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Upper Back
        {
          type: 'panel',
          name: 'upper_back_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_upper_back_pain',
              title: 'Upper Back Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'upper_back_details_panel',
              visibleIf: "{has_upper_back_pain} = 'Yes'",
              elements: [
                {
                  type: 'slider',
                  name: 'upper_back_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'upper_back_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Shoulder(s)
        {
          type: 'panel',
          name: 'shoulder_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_shoulder_pain',
              title: 'Shoulder Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'shoulder_details_panel',
              visibleIf: "{has_shoulder_pain} = 'Yes'",
              elements: [
                {
                  type: 'checkbox',
                  name: 'shoulder_side',
                  title: 'Which side(s)?',
                  choices: ['Left', 'Right']
                },
                {
                  type: 'slider',
                  name: 'shoulder_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'shoulder_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Hip(s)
        {
          type: 'panel',
          name: 'hip_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_hip_pain',
              title: 'Hip Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'hip_details_panel',
              visibleIf: "{has_hip_pain} = 'Yes'",
              elements: [
                {
                  type: 'checkbox',
                  name: 'hip_side',
                  title: 'Which side(s)?',
                  choices: ['Left', 'Right']
                },
                {
                  type: 'slider',
                  name: 'hip_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'hip_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Arm(s)
        {
          type: 'panel',
          name: 'arm_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_arm_pain',
              title: 'Arm Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'arm_details_panel',
              visibleIf: "{has_arm_pain} = 'Yes'",
              elements: [
                {
                  type: 'checkbox',
                  name: 'arm_side',
                  title: 'Which side(s)?',
                  choices: ['Left', 'Right']
                },
                {
                  type: 'slider',
                  name: 'arm_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'arm_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Leg(s)
        {
          type: 'panel',
          name: 'leg_panel',
          elements: [
            {
              type: 'radiogroup',
              name: 'has_leg_pain',
              title: 'Leg Pain',
              choices: ['Yes', 'No'],
              colCount: 0
            },
            {
              type: 'panel',
              name: 'leg_details_panel',
              visibleIf: "{has_leg_pain} = 'Yes'",
              elements: [
                {
                  type: 'checkbox',
                  name: 'leg_side',
                  title: 'Which side(s)?',
                  choices: ['Left', 'Right']
                },
                {
                  type: 'slider',
                  name: 'leg_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'leg_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        },
        // Other Area
        {
          type: 'panel',
          name: 'other_area_panel',
          elements: [
            {
              type: 'text',
              name: 'other_area_specify',
              title: 'Other Area (if applicable):'
            },
            {
              type: 'panel',
              name: 'other_area_details_panel',
              visibleIf: "{other_area_specify} notempty",
              elements: [
                {
                  type: 'checkbox',
                  name: 'other_side',
                  title: 'Side (if applicable):',
                  choices: ['Left', 'Right', 'Central']
                },
                {
                  type: 'slider',
                  name: 'other_intensity',
                  title: 'Pain Severity (0-10)',
                  min: 0,
                  max: 10,
                  step: 1
                },
                {
                  type: 'slider',
                  name: 'other_frequency',
                  title: 'How often do you experience this pain? (0-100%)',
                  description: 'Occasional pain<------------------------->Constant pain',
                  min: 0,
                  max: 100,
                  step: 5
                }
              ]
            }
          ]
        }
      ]
    }
  };
  
  creator.toolbox.addItem(visualAnalogPainAssessment);
  
  // Add Oswestry Disability Index with Automated Scoring
  const oswestryDisabilityIndex = {
    name: 'oswestry-disability-index',
    title: 'Oswestry Disability Index (ODI)',
    iconName: 'icon-panel',
    category: 'Healthcare',
    json: {
      type: 'panel',
      title: 'Oswestry Low Back Pain Disability Index',
      description: 'Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.',
      elements: [
        // Patient Information
        {
          type: 'panel',
          name: 'patient_info_panel',
          elements: [
            {
              type: 'text',
              name: 'patient_name',
              title: 'Name',
              startWithNewLine: false
            },
            {
              type: 'text',
              name: 'assessment_date',
              title: 'Date',
              inputType: 'date',
              startWithNewLine: false,
              defaultValue: new Date().toISOString().split('T')[0]
            }
          ]
        },
        // Section 1 - Pain Intensity
        {
          type: 'panel',
          name: 'section1_panel',
          title: 'SECTION 1 - Pain Intensity',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_pain_intensity',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'The pain comes and goes and is very mild.' },
                { value: 1, text: 'The pain is mild and does not vary much.' },
                { value: 2, text: 'The pain comes and goes and is moderate.' },
                { value: 3, text: 'The pain is moderate and does not vary much.' },
                { value: 4, text: 'The pain comes and goes and is severe.' },
                { value: 5, text: 'The pain is severe and does not vary much.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 2 - Personal Care
        {
          type: 'panel',
          name: 'section2_panel',
          title: 'SECTION 2 - Personal Care (Washing, Dressing, etc.)',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_personal_care',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I would not have to change my way of washing or dressing in order to avoid pain.' },
                { value: 1, text: 'I do not normally change my way of washing or dressing even though it causes some pain.' },
                { value: 2, text: 'Washing and dressing increases the pain, but I manage not to change my way of doing it.' },
                { value: 3, text: 'Washing and dressing increases the pain and I find it necessary to change my way of doing it.' },
                { value: 4, text: 'Because of the pain, I am unable to do some washing and dressing without help.' },
                { value: 5, text: 'Because of the pain, I am unable to do any washing and dressing without help.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 3 - Lifting
        {
          type: 'panel',
          name: 'section3_panel',
          title: 'SECTION 3 - Lifting',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_lifting',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I can lift heavy weights without extra pain.' },
                { value: 1, text: 'I can lift heavy weights, but it causes extra pain.' },
                { value: 2, text: 'Pain prevents me from lifting heavy weights off the floor, but I can if they are conveniently positioned.' },
                { value: 3, text: 'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if conveniently positioned.' },
                { value: 4, text: 'I can lift only very light weights.' },
                { value: 5, text: 'I cannot lift or carry anything at all.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 4 - Walking
        {
          type: 'panel',
          name: 'section4_panel',
          title: 'SECTION 4 - Walking',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_walking',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'Pain does not prevent me walking any distance.' },
                { value: 1, text: 'Pain prevents me walking more than 1 mile.' },
                { value: 2, text: 'Pain prevents me walking more than ½ mile.' },
                { value: 3, text: 'Pain prevents me walking more than ¼ mile.' },
                { value: 4, text: 'I can only walk using a cane or crutches.' },
                { value: 5, text: 'I am in bed most of the time and have to crawl to the toilet.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 5 - Sitting
        {
          type: 'panel',
          name: 'section5_panel',
          title: 'SECTION 5 - Sitting',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_sitting',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I can sit in any chair as long as I like without pain.' },
                { value: 1, text: 'I can only sit in my favorite chair as long as I like.' },
                { value: 2, text: 'Pain prevents me from sitting for more than 1 hour.' },
                { value: 3, text: 'Pain prevents me from sitting for more than ½ hour.' },
                { value: 4, text: 'Pain prevents me from sitting for more than 10 minutes.' },
                { value: 5, text: 'Pain prevents me from sitting at all.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 6 - Standing
        {
          type: 'panel',
          name: 'section6_panel',
          title: 'SECTION 6 - Standing',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_standing',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I can stand as long as I want without extra pain.' },
                { value: 1, text: 'I have some pain while standing, but it does not increase with time.' },
                { value: 2, text: 'I cannot stand for longer than 1 hour without increasing pain.' },
                { value: 3, text: 'I cannot stand for longer than ½ hour without increasing pain.' },
                { value: 4, text: 'I cannot stand for longer than 10 minutes without increasing pain.' },
                { value: 5, text: 'I avoid standing because it increases the pain straight away.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 7 - Sleeping
        {
          type: 'panel',
          name: 'section7_panel',
          title: 'SECTION 7 - Sleeping',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_sleeping',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I get no pain in bed.' },
                { value: 1, text: 'I get pain in bed, but it does not prevent me from sleeping well.' },
                { value: 2, text: 'Because of pain, my normal night\'s sleep is reduced by less than one quarter.' },
                { value: 3, text: 'Because of pain, my normal night\'s sleep is reduced by less than one half.' },
                { value: 4, text: 'Because of pain, my normal night\'s sleep is reduced by less than three quarters.' },
                { value: 5, text: 'Pain prevents me from sleeping at all.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 8 - Social Life
        {
          type: 'panel',
          name: 'section8_panel',
          title: 'SECTION 8 - Social Life',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_social_life',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'My social life is normal and gives me no pain.' },
                { value: 1, text: 'My social life is normal, but increases the degree of my pain.' },
                { value: 2, text: 'Pain has no significant effect on my social life apart from limiting energetic interests (e.g., dancing).' },
                { value: 3, text: 'Pain has restricted my social life and I do not go out very often.' },
                { value: 4, text: 'Pain has restricted my social life to my home.' },
                { value: 5, text: 'I hardly have any social life because of the pain.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 9 - Traveling
        {
          type: 'panel',
          name: 'section9_panel',
          title: 'SECTION 9 - Traveling',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_traveling',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'I get no pain while traveling.' },
                { value: 1, text: 'I get some pain while traveling, but none of my usual forms of travel make it worse.' },
                { value: 2, text: 'I get some pain while traveling, but it does not compel me to seek alternative forms of travel.' },
                { value: 3, text: 'I get extra pain while traveling which compels me to seek alternative forms of travel.' },
                { value: 4, text: 'Pain restricts all forms of travel.' },
                { value: 5, text: 'Pain prevents all forms of travel except that done lying down.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Section 10 - Employment/Homemaking
        {
          type: 'panel',
          name: 'section10_panel',
          title: 'SECTION 10 - Employment/Homemaking',
          elements: [
            {
              type: 'radiogroup',
              name: 'odi_employment',
              titleLocation: 'hidden',
              choices: [
                { value: 0, text: 'My normal work/homemaking activities do not cause pain.' },
                { value: 1, text: 'My normal work/homemaking activities increase my pain, but I can still perform all that is required.' },
                { value: 2, text: 'I can perform most of my work/homemaking duties, but pain prevents me from performing more physically stressful activities.' },
                { value: 3, text: 'Pain prevents me from doing anything but light duties.' },
                { value: 4, text: 'Pain prevents me from doing even light duties.' },
                { value: 5, text: 'Pain prevents me from performing any job or homemaking chores.' }
              ],
              colCount: 1,
              isRequired: false
            }
          ]
        },
        // Comments Section
        {
          type: 'comment',
          name: 'odi_comments',
          title: 'Additional Comments:',
          rows: 4
        },
        // Scoring Section with Auto-calculation
        {
          type: 'panel',
          name: 'odi_scoring_panel',
          title: 'ODI Score Results',
          elements: [
            {
              type: 'expression',
              name: 'odi_total_score',
              title: 'Total Score:',
              expression: '(iif({odi_pain_intensity} notempty, {odi_pain_intensity}, 0) + iif({odi_personal_care} notempty, {odi_personal_care}, 0) + iif({odi_lifting} notempty, {odi_lifting}, 0) + iif({odi_walking} notempty, {odi_walking}, 0) + iif({odi_sitting} notempty, {odi_sitting}, 0) + iif({odi_standing} notempty, {odi_standing}, 0) + iif({odi_sleeping} notempty, {odi_sleeping}, 0) + iif({odi_social_life} notempty, {odi_social_life}, 0) + iif({odi_traveling} notempty, {odi_traveling}, 0) + iif({odi_employment} notempty, {odi_employment}, 0))',
              displayStyle: 'decimal',
              currency: 'none'
            },
            {
              type: 'expression',
              name: 'odi_sections_completed',
              title: 'Sections Completed:',
              expression: '(iif({odi_pain_intensity} notempty, 1, 0) + iif({odi_personal_care} notempty, 1, 0) + iif({odi_lifting} notempty, 1, 0) + iif({odi_walking} notempty, 1, 0) + iif({odi_sitting} notempty, 1, 0) + iif({odi_standing} notempty, 1, 0) + iif({odi_sleeping} notempty, 1, 0) + iif({odi_social_life} notempty, 1, 0) + iif({odi_traveling} notempty, 1, 0) + iif({odi_employment} notempty, 1, 0))',
              displayStyle: 'decimal'
            },
            {
              type: 'expression',
              name: 'odi_disability_percentage',
              title: 'Disability Percentage:',
              expression: 'iif({odi_sections_completed} > 0, round(({odi_total_score} / ({odi_sections_completed} * 5)) * 100, 1), 0)',
              displayStyle: 'decimal',
              format: '{0}%'
            },
            {
              type: 'expression',
              name: 'odi_interpretation',
              title: 'Interpretation:',
              expression: 'iif({odi_disability_percentage} <= 20, "Minimal Disability", iif({odi_disability_percentage} <= 40, "Moderate Disability", iif({odi_disability_percentage} <= 60, "Severe Disability", iif({odi_disability_percentage} <= 80, "Crippled", "Bed-bound or Exaggerating"))))',
              displayStyle: 'text'
            },
            {
              type: 'html',
              name: 'odi_interpretation_guide',
              html: '<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;"><h4>Score Interpretation Guide:</h4><ul style="list-style-type: none; padding-left: 0;"><li>• <strong>0-20%:</strong> Minimal disability - Can cope with most activities</li><li>• <strong>21-40%:</strong> Moderate disability - More pain and difficulty with sitting, lifting, and standing</li><li>• <strong>41-60%:</strong> Severe disability - Pain is a primary problem, affecting daily life</li><li>• <strong>61-80%:</strong> Crippled - Back pain impinges on all aspects of life</li><li>• <strong>81-100%:</strong> Bed-bound or exaggerating symptoms</li></ul></div>'
            },
            {
              type: 'signaturepad',
              name: 'odi_patient_signature',
              title: 'Patient Signature:'
            }
          ]
        }
      ],
      triggers: [
        {
          type: 'runexpression',
          expression: '{odi_pain_intensity} notempty or {odi_personal_care} notempty or {odi_lifting} notempty or {odi_walking} notempty or {odi_sitting} notempty or {odi_standing} notempty or {odi_sleeping} notempty or {odi_social_life} notempty or {odi_traveling} notempty or {odi_employment} notempty',
          runExpression: 'true'
        }
      ]
    }
  };
  
  creator.toolbox.addItem(oswestryDisabilityIndex);
  
  // Add Neck Disability Index with Automated Scoring
  const neckDisabilityIndex = {
    name: 'neck-disability-index',
    title: 'Neck Disability Index (NDI)',
    iconName: 'icon-panel',
    category: 'Healthcare',
    json: {
      type: 'panel',
      title: 'Neck Disability Index Questionnaire',
      description: 'Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.',
      elements: [
        // Patient Information
        {
          type: 'panel',
          name: 'ndi_header_info',
          elements: [
            {
              type: 'text',
              name: 'ndi_patient_name',
              title: 'Name',
              startWithNewLine: false,
              isRequired: false
            },
            {
              type: 'text',
              name: 'ndi_form_date',
              title: 'Date',
              inputType: 'date',
              startWithNewLine: false,
              defaultValue: new Date().toISOString().split('T')[0],
              isRequired: false
            }
          ]
        },
        // Section 1 - Pain Intensity
        {
          type: 'radiogroup',
          name: 'ndi_pain_intensity',
          title: 'SECTION 1 - Pain Intensity',
          choices: [
            { value: 0, text: 'I have no pain at the moment.' },
            { value: 1, text: 'The pain is very mild at the moment.' },
            { value: 2, text: 'The pain is moderate at the moment.' },
            { value: 3, text: 'The pain is fairly severe at the moment.' },
            { value: 4, text: 'The pain is very severe at the moment.' },
            { value: 5, text: 'The pain is the worst imaginable at the moment.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 2 - Personal Care
        {
          type: 'radiogroup',
          name: 'ndi_personal_care',
          title: 'SECTION 2 - Personal Care (Washing, Dressing, etc.)',
          choices: [
            { value: 0, text: 'I can look after myself normally without causing extra pain.' },
            { value: 1, text: 'I can look after myself normally, but it causes extra pain.' },
            { value: 2, text: 'It is painful to look after myself and I am slow and careful.' },
            { value: 3, text: 'I need some help, but manage most of my personal care.' },
            { value: 4, text: 'I need help every day in most aspects of self-care.' },
            { value: 5, text: 'I do not get dressed, I wash with difficulty and stay in bed.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 3 - Lifting
        {
          type: 'radiogroup',
          name: 'ndi_lifting',
          title: 'SECTION 3 - Lifting',
          choices: [
            { value: 0, text: 'I can lift heavy weights without extra pain.' },
            { value: 1, text: 'I can lift heavy weights, but it gives extra pain.' },
            { value: 2, text: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently positioned, for example, on a table.' },
            { value: 3, text: 'Pain prevents me from lifting heavy weights, but I can manage light to medium weights if they are conveniently positioned.' },
            { value: 4, text: 'I can lift very light weights.' },
            { value: 5, text: 'I cannot lift or carry anything at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 4 - Reading
        {
          type: 'radiogroup',
          name: 'ndi_reading',
          title: 'SECTION 4 - Reading',
          choices: [
            { value: 0, text: 'I can read as much as I want to with no pain in my neck.' },
            { value: 1, text: 'I can read as much as I want to with slight pain in my neck.' },
            { value: 2, text: 'I can read as much as I want to with moderate pain in my neck.' },
            { value: 3, text: 'I cannot read as much as I want because of moderate pain in my neck.' },
            { value: 4, text: 'I cannot read as much as I want because of severe pain in my neck.' },
            { value: 5, text: 'I cannot read at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 5 - Headaches
        {
          type: 'radiogroup',
          name: 'ndi_headaches',
          title: 'SECTION 5 - Headaches',
          choices: [
            { value: 0, text: 'I have no headaches at all.' },
            { value: 1, text: 'I have slight headaches which come infrequently.' },
            { value: 2, text: 'I have moderate headaches which come infrequently.' },
            { value: 3, text: 'I have moderate headaches which come frequently.' },
            { value: 4, text: 'I have severe headaches which come frequently.' },
            { value: 5, text: 'I have headaches almost all the time.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 6 - Concentration
        {
          type: 'radiogroup',
          name: 'ndi_concentration',
          title: 'SECTION 6 - Concentration',
          choices: [
            { value: 0, text: 'I can concentrate fully when I want to with no difficulty.' },
            { value: 1, text: 'I can concentrate fully when I want to with slight difficulty.' },
            { value: 2, text: 'I have a fair degree of difficulty in concentrating when I want to.' },
            { value: 3, text: 'I have a lot of difficulty in concentrating when I want to.' },
            { value: 4, text: 'I have a great deal of difficulty in concentrating when I want to.' },
            { value: 5, text: 'I cannot concentrate at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 7 - Work
        {
          type: 'radiogroup',
          name: 'ndi_work',
          title: 'SECTION 7 - Work',
          choices: [
            { value: 0, text: 'I can do as much work as I want to.' },
            { value: 1, text: 'I can only do my usual work, but no more.' },
            { value: 2, text: 'I can do most of my usual work, but no more.' },
            { value: 3, text: 'I cannot do my usual work.' },
            { value: 4, text: 'I can hardly do any work at all.' },
            { value: 5, text: 'I cannot do any work at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 8 - Driving
        {
          type: 'radiogroup',
          name: 'ndi_driving',
          title: 'SECTION 8 - Driving',
          choices: [
            { value: 0, text: 'I can drive my car without any neck pain.' },
            { value: 1, text: 'I can drive my car as long as I want with slight pain in my neck.' },
            { value: 2, text: 'I can drive my car as long as I want with moderate pain in my neck.' },
            { value: 3, text: 'I cannot drive my car as long as I want because of moderate pain in my neck.' },
            { value: 4, text: 'I can hardly drive at all because of severe pain in my neck.' },
            { value: 5, text: 'I cannot drive my car at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 9 - Recreation
        {
          type: 'radiogroup',
          name: 'ndi_recreation',
          title: 'SECTION 9 - Recreation',
          choices: [
            { value: 0, text: 'I am able to engage in all of my recreational activities with no neck pain at all.' },
            { value: 1, text: 'I am able to engage in all of my recreational activities with some pain in my neck.' },
            { value: 2, text: 'I am able to engage in most, but not all of my recreational activities because of pain in my neck.' },
            { value: 3, text: 'I am able to engage in a few of my recreational activities because of pain in my neck.' },
            { value: 4, text: 'I can hardly do any recreational activities because of pain in my neck.' },
            { value: 5, text: 'I cannot do any recreational activities at all.' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Section 10 - Sleeping
        {
          type: 'radiogroup',
          name: 'ndi_sleeping',
          title: 'SECTION 10 - Sleeping',
          choices: [
            { value: 0, text: 'I have no trouble sleeping.' },
            { value: 1, text: 'My sleep is slightly disturbed (less than 1 hour sleepless).' },
            { value: 2, text: 'My sleep is mildly disturbed (1-2 hours sleepless).' },
            { value: 3, text: 'My sleep is moderately disturbed (2-3 hours sleepless).' },
            { value: 4, text: 'My sleep is greatly disturbed (3-5 hours sleepless).' },
            { value: 5, text: 'My sleep is completely disturbed (5-7 hours sleepless).' }
          ],
          colCount: 1,
          isRequired: false
        },
        // Comments Section
        {
          type: 'comment',
          name: 'ndi_comments',
          title: 'Additional Comments:',
          rows: 4
        },
        // Scoring Section with Auto-calculation
        {
          type: 'panel',
          name: 'ndi_scoring_panel',
          title: 'NDI Score Results',
          elements: [
            {
              type: 'expression',
              name: 'ndi_total_score',
              title: 'Total Score:',
              expression: '(iif({ndi_pain_intensity} notempty, {ndi_pain_intensity}, 0) + iif({ndi_personal_care} notempty, {ndi_personal_care}, 0) + iif({ndi_lifting} notempty, {ndi_lifting}, 0) + iif({ndi_reading} notempty, {ndi_reading}, 0) + iif({ndi_headaches} notempty, {ndi_headaches}, 0) + iif({ndi_concentration} notempty, {ndi_concentration}, 0) + iif({ndi_work} notempty, {ndi_work}, 0) + iif({ndi_driving} notempty, {ndi_driving}, 0) + iif({ndi_recreation} notempty, {ndi_recreation}, 0) + iif({ndi_sleeping} notempty, {ndi_sleeping}, 0))',
              displayStyle: 'decimal',
              currency: 'none'
            },
            {
              type: 'expression',
              name: 'ndi_sections_completed',
              title: 'Sections Completed:',
              expression: '(iif({ndi_pain_intensity} notempty, 1, 0) + iif({ndi_personal_care} notempty, 1, 0) + iif({ndi_lifting} notempty, 1, 0) + iif({ndi_reading} notempty, 1, 0) + iif({ndi_headaches} notempty, 1, 0) + iif({ndi_concentration} notempty, 1, 0) + iif({ndi_work} notempty, 1, 0) + iif({ndi_driving} notempty, 1, 0) + iif({ndi_recreation} notempty, 1, 0) + iif({ndi_sleeping} notempty, 1, 0))',
              displayStyle: 'decimal'
            },
            {
              type: 'expression',
              name: 'ndi_disability_percentage',
              title: 'Disability Percentage:',
              expression: 'iif({ndi_sections_completed} > 0, round(({ndi_total_score} / ({ndi_sections_completed} * 5)) * 100, 1), 0)',
              displayStyle: 'decimal',
              format: '{0}%'
            },
            {
              type: 'expression',
              name: 'ndi_interpretation',
              title: 'Interpretation:',
              expression: 'iif({ndi_disability_percentage} <= 8, "No Disability", iif({ndi_disability_percentage} <= 28, "Mild Disability", iif({ndi_disability_percentage} <= 48, "Moderate Disability", iif({ndi_disability_percentage} <= 68, "Severe Disability", "Complete Disability"))))',
              displayStyle: 'text'
            },
            {
              type: 'html',
              name: 'ndi_interpretation_guide',
              html: '<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;"><h4>NDI Score Interpretation Guide:</h4><ul style="list-style-type: none; padding-left: 0;"><li>• <strong>0-8%:</strong> No disability - Patients can cope with most living activities</li><li>• <strong>10-28%:</strong> Mild disability - Pain and difficulty with sitting, lifting, and standing. Travel and social life are more difficult</li><li>• <strong>30-48%:</strong> Moderate disability - Pain is the main problem. Patients experience more problems with sitting, standing, and traveling</li><li>• <strong>50-68%:</strong> Severe disability - Pain impairs all aspects of life. Positive intervention is required</li><li>• <strong>70-100%:</strong> Complete disability - Patients are either bed-bound or exaggerating their symptoms</li></ul><p style="margin-top: 10px; font-size: 0.9em; color: #666;">Reference: Vernon, Mior. JMPT 1991; 14(7): 409-15</p></div>'
            },
            {
              type: 'signaturepad',
              name: 'ndi_patient_signature',
              title: 'Patient Signature:'
            }
          ]
        }
      ],
      triggers: [
        {
          type: 'runexpression',
          expression: '{ndi_pain_intensity} notempty or {ndi_personal_care} notempty or {ndi_lifting} notempty or {ndi_reading} notempty or {ndi_headaches} notempty or {ndi_concentration} notempty or {ndi_work} notempty or {ndi_driving} notempty or {ndi_recreation} notempty or {ndi_sleeping} notempty',
          runExpression: 'true'
        }
      ]
    }
  };
  
  creator.toolbox.addItem(neckDisabilityIndex);
  
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
  
  // Add Today's Date Component
  const todaysDateComponent = {
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
  };
  
  creator.toolbox.addItem(todaysDateComponent);
  
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
          name: 'form_date',
          title: "Today's Date",
          inputType: 'date',
          defaultValue: new Date().toISOString().split('T')[0],
          readOnly: true
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
    showJSONEditorTab: true,
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