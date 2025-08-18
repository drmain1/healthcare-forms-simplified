// Review of Systems configuration using SurveyJS built-in hasNone feature

export const createReviewOfSystemsPanel = () => {
  // Helper function to create checkbox groups with built-in "None of the above"
  const createCheckboxWithNone = (name: string, title: string, choices: string[], colCount = 2) => {
    return {
      type: 'checkbox',
      name,
      title,
      choices,
      colCount,
      // Use SurveyJS built-in hasNone feature
      hasNone: true,
      noneText: '✓ None of the above',
      // Optional: Disable other choices when None is selected for better UX
      choicesEnableIf: `{item} == 'none' or {${name}} notcontains 'none'`,
      // Add custom CSS class for styling
      cssClasses: 'ros-checkbox-group'
    };
  };

  const rosPanel = {
    type: 'panel',
    name: 'page_review_of_systems',
    title: 'Review of Systems',
    description: 'Select the following conditions that apply to you. Please circle any current conditions.',
    elements: [
      {
        type: 'panel',
        name: 'ros_general',
        title: 'General',
        elements: [
          createCheckboxWithNone('ros_constitutional', 'Constitutional', [
            'Balance issues', 'Cancer', 'Changes in appetite', 'Changes in sleep',
            'Changes in weight', 'Chills', 'Dizziness', 'Fatigue',
            'Fever', 'Hyperactivity', 'Tumor', 'Vertigo'
          ]),
          createCheckboxWithNone('ros_gastrointestinal', 'Gastrointestinal (GI)', [
            'Acid reflux', 'Belching or gas', 'Celiac Disease', 'Colon issues',
            'Constipation', "Crohn's Disease", 'Diarrhea', 'Gall bladder issues',
            'Heartburn', 'Hemorrhoids', 'Hiatal hernia', 'Jaundice',
            'Liver issues', 'Nausea', 'Spitting up blood', 'Stomach aches',
            'Stomach ulcers', 'Vomiting'
          ]),
          createCheckboxWithNone('ros_musculoskeletal', 'Musculoskeletal', [
            'Arm pain', 'Arthritis', 'Broken bones', 'Bursitis', 'Elbow pain',
            'Foot pain', 'Hip pain', 'Knee pain', 'Leg pain', 'Low backache',
            'Muscle atrophy', 'Pain btwn shoulders', 'Painful tailbone',
            'Plantar Fasciitis', 'Rib Pain', 'Scoliosis', 'Shoulder pain',
            'Spinal curvature', 'Sprained ankle', 'Weakness in arms',
            'Weakness in legs', 'Wrist pain'
          ]),
          createCheckboxWithNone('ros_endocrine', 'Endocrine', [
            'Diabetes Type: I', 'Diabetes Type: II', 'Enlarged Glands',
            'Frequent urination', 'Gout', 'Hypoglycemia', 
            'Swollen joints', 'Thyroid issues'
          ])
        ]
      },
      {
        type: 'panel',
        name: 'ros_systems_2',
        title: 'Systems (continued)',
        elements: [
          createCheckboxWithNone('ros_cardiovascular', 'Cardiovascular', [
            'Angina/Chest pain', 'Atrial fibrillation (AFib)', 'DVT or Blood Clot',
            'Embolism', 'Fainting', 'Hardening of arteries', 'Heart attack',
            'Heart disease', 'High blood pressure', 'Low blood pressure',
            'Poor circulation', 'Rapid heart beat', 'Slow heart beat',
            'Stroke', 'Swollen ankles', 'Varicose veins'
          ]),
          createCheckboxWithNone('ros_integumentary', 'Integumentary/Skin', [
            'Bruise easily', 'Eczema/Hives', 'Hair/Nail Changes',
            'Itching (Pruritis)', 'Moles (Irregular)', 'Psoriasis',
            'Rashes', 'Scaling', 'Skin cancer'
          ]),
          createCheckboxWithNone('ros_hematological', 'Hematological/Lymphatic', [
            'Anemia', 'Blood disorder', 'HIV/AIDS'
          ], 1),
          createCheckboxWithNone('ros_allergy', 'Allergy/Immunologic', [
            'Seasonal Allergies', 'Food Allergy/Intolerance',
            'Rheumatic fever', 'Tuberculosis'
          ], 1)
        ]
      },
      {
        type: 'panel',
        name: 'ros_systems_3',
        title: 'Systems (continued)',
        elements: [
          createCheckboxWithNone('ros_respiratory', 'Respiratory', [
            'Asthma', 'Bronchitis', 'Chronic cough', 'COPD',
            'Difficulty breathing', 'Emphysema', 'Shortness of breath', 'Sleep apnea'
          ]),
          {
            type: 'text',
            name: 'ros_cpap',
            visibleIf: "{ros_respiratory} contains 'Sleep apnea'",
            title: 'CPAP details'
          },
          createCheckboxWithNone('ros_genitourinary', 'Genitourinary (GU)', [
            'Bed-wetting', 'Bladder infection', 'Blood in urine',
            'Kidney infection', 'Kidney stone', 'Painful urination',
            'Poor urine control', 'Urinary Tract Infection'
          ]),
          createCheckboxWithNone('ros_neurological', 'Neurological', [
            'Burning sensations', 'Convulsions', 'Numbness in arm/hand',
            'Numbness in leg/foot', 'Pins/Needles/Tingling',
            'Restless Leg Synd. (RLS)', 'Sciatica', 'Seizures'
          ]),
          createCheckboxWithNone('ros_eent', 'EENT', [
            'Dental issues', 'Difficulty swallowing', 'Ear infection(s)',
            'Hearing issues', 'Nasal congestion', 'Nosebleeds',
            'Ringing in ears', 'Sinus infection', 'Sore throat',
            'TMJ pain', 'Vision issues'
          ]),
          {
            type: 'checkbox',
            name: 'ros_vision_corrected',
            visibleIf: "{ros_eent} contains 'Vision issues'",
            titleLocation: 'hidden',
            choices: ['corrected'],
            colCount: 1
          }
        ]
      },
      {
        type: 'panel',
        name: 'ros_systems_4',
        title: 'Systems (continued)',
        elements: [
          createCheckboxWithNone('ros_psychiatric', 'Psychiatric', [
            'ADHD/ADD', 'Anxiety', 'Dementia', 'Depression',
            'Nervousness', 'Paranoia', 'PTSD', 'Stress/Tension'
          ]),
          createCheckboxWithNone('ros_headneck', 'Head/Neck', [
            'Headaches', 'Migraines', 'Painful neck', 'Stiff neck'
          ]),
          {
            type: 'checkbox',
            name: 'ros_migraines_aura',
            visibleIf: "{ros_headneck} contains 'Migraines'",
            titleLocation: 'hidden',
            choices: ['w/ Aura'],
            colCount: 1
          }
        ]
      },
      {
        type: 'panel',
        name: 'ros_gender_specific',
        title: 'Gender Specific',
        elements: [
          {
            type: 'panel',
            name: 'ros_women_only',
            visibleIf: "{sex_at_birth} = 'female'",
            title: 'For Women Only',
            elements: [
              createCheckboxWithNone('ros_women_symptoms', 'Symptoms', [
                'Breast lumps or pain', 'Irregular cycle', 'Menopausal symptoms',
                'Menstrual cramps', 'Painful intercourse', 'PCOS',
                'Premenstrual tension', 'Unable to get pregnant'
              ]),
              {
                type: 'panel',
                name: 'ros_women_dates',
                elements: [
                  {
                    type: 'text',
                    name: 'ros_women_hysterectomy_date',
                    title: 'Hysterectomy Date:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_women_tubal_ligation_date',
                    title: 'Tubal ligation Date:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_women_last_breast_exam',
                    title: 'Last Breast Exam:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_women_last_pap_smear',
                    title: 'Last Pap Smear:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_women_last_menstrual',
                    title: 'Last Menstrual Period:',
                    inputType: 'date'
                  }
                ]
              },
              {
                type: 'radiogroup',
                name: 'ros_women_regular_checkups',
                title: 'Regular Checkups?',
                choices: ['Yes', 'No'],
                colCount: 0
              },
              {
                type: 'radiogroup',
                name: 'ros_women_pregnant',
                title: 'Are you Pregnant?',
                choices: ['Yes', 'No'],
                colCount: 0
              }
            ]
          },
          {
            type: 'panel',
            name: 'ros_men_only',
            visibleIf: "{sex_at_birth} = 'male'",
            title: 'For Men Only',
            elements: [
              createCheckboxWithNone('ros_men_symptoms', 'Symptoms', [
                'Breast lumps or pain', 'Changes in bathroom habits',
                'Erectile dysfunction (ED)', 'Low T, Testosterone',
                'Painful intercourse', 'Prostate issues', 'Testicular issues'
              ]),
              {
                type: 'panel',
                name: 'ros_men_dates',
                elements: [
                  {
                    type: 'text',
                    name: 'ros_men_vasectomy_date',
                    title: 'Vasectomy Date:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_men_last_prostate_exam',
                    title: 'Last Prostate Exam:',
                    inputType: 'date'
                  },
                  {
                    type: 'text',
                    name: 'ros_men_last_testicular_exam',
                    title: 'Last Testicular Exam:',
                    inputType: 'date'
                  }
                ]
              },
              {
                type: 'radiogroup',
                name: 'ros_men_regular_checkups',
                title: 'Regular Checkups?',
                choices: ['Yes', 'No'],
                colCount: 0
              }
            ]
          }
        ]
      },
      {
        type: 'comment',
        name: 'ros_other_conditions',
        title: 'List any other conditions',
        rows: 4
      }
    ]
  };

  return rosPanel;
};

// Export a ready-to-use configuration
export const reviewOfSystemsToolboxItem = {
  name: 'review-of-systems',
  title: 'Review of Systems (ROS)',
  iconName: 'icon-panel',
  category: 'Healthcare',
  json: createReviewOfSystemsPanel()
};