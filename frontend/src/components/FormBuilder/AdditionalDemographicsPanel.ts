// Additional Demographics panel configuration for SurveyJS
// This uses native SurveyJS elements for extended patient demographic information

export const additionalDemographicsPanel = {
  type: 'panel',
  name: 'page_additional_demographics',
  title: 'Additional Demographics',
  description: 'Please provide additional demographic and contact information.',
  metadata: { patternType: 'additional_demographics' },
  elements: [
    {
      type: 'radiogroup',
      name: 'demographics_additional_communication',
      title: 'Preferred method of communication',
      isRequired: true,
      choices: [
        'Cell Phone',
        'Home Phone',
        'E-mail',
        'Other'
      ],
      colCount: 0
    },
    {
      type: 'radiogroup',
      name: 'demographics_additional_marital_status',
      title: 'Marital Status',
      choices: [
        { value: 'M', text: 'Married' },
        { value: 'S', text: 'Single' },
        { value: 'W', text: 'Widowed' },
        { value: 'D', text: 'Divorced' }
      ],
      colCount: 0
    },
    {
      type: 'text',
      name: 'demographics_additional_spouse_name',
      visibleIf: "{demographics_additional_marital_status} = 'M'",
      startWithNewLine: false,
      title: 'Name of Spouse/Significant Other'
    },
    {
      type: 'panel',
      name: 'emergency_contact_panel',
      title: 'Emergency Contact Information',
      elements: [
        {
          type: 'text',
          name: 'demographics_additional_emergency_name',
          title: 'Emergency Contact Name',
          isRequired: true
        },
        {
          type: 'text',
          name: 'demographics_additional_emergency_relationship',
          startWithNewLine: false,
          title: 'Relationship',
          isRequired: true
        },
        {
          type: 'text',
          name: 'demographics_additional_emergency_phone',
          startWithNewLine: false,
          title: 'Phone',
          isRequired: true,
          inputType: 'tel'
        }
      ]
    },
    {
      type: 'comment',
      name: 'demographics_additional_referral_source',
      title: 'How did you hear about us?',
      description: 'Please let us know how you found our practice'
    }
  ]
};