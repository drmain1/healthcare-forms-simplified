// Review of Systems panel configuration for SurveyJS
// This uses native SurveyJS elements (panels, checkboxes, etc.) instead of a custom component

export const reviewOfSystemsPanel = {
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
        {
          type: 'checkbox',
          name: 'ros_constitutional',
          title: 'Constitutional',
          choices: [
            'Balance issues',
            'Cancer',
            'Changes in appetite',
            'Changes in sleep',
            'Changes in weight',
            'Chills',
            'Dizziness',
            'Fatigue',
            'Fever',
            'Hyperactivity',
            'Tumor',
            'Vertigo'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_gastrointestinal',
          startWithNewLine: false,
          title: 'Gastrointestinal (GI)',
          choices: [
            'Acid reflux',
            'Belching or gas',
            'Celiac Disease',
            'Colon issues',
            'Constipation',
            "Crohn's Disease",
            'Diarrhea',
            'Gall bladder issues',
            'Heartburn',
            'Hemorrhoids',
            'Hiatal hernia',
            'Jaundice',
            'Liver issues',
            'Nausea',
            'Spitting up blood',
            'Stomach aches',
            'Stomach ulcers',
            'Vomiting'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_musculoskeletal',
          title: 'Musculoskeletal',
          choices: [
            'Arm pain',
            'Arthritis',
            'Broken bones',
            'Bursitis',
            'Elbow pain',
            'Foot pain',
            'Hip pain',
            'Knee pain',
            'Leg pain',
            'Low backache',
            'Muscle atrophy',
            'Pain btwn shoulders',
            'Painful tailbone',
            'Plantar Fasciitis',
            'Rib Pain',
            'Scoliosis',
            'Shoulder pain',
            'Spinal curvature',
            'Sprained ankle',
            'Weakness in arms',
            'Weakness in legs',
            'Wrist pain'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_endocrine',
          startWithNewLine: false,
          title: 'Endocrine',
          choices: [
            'Diabetes Type: I',
            'Diabetes Type: II',
            'Enlarged Glands',
            'Frequent urination',
            'Gout',
            'Hypoglycemia',
            'Swollen joints',
            'Thyroid issues'
          ],
          colCount: 0
        }
      ]
    },
    {
      type: 'panel',
      name: 'ros_systems_2',
      title: 'Systems (continued)',
      elements: [
        {
          type: 'checkbox',
          name: 'ros_cardiovascular',
          title: 'Cardiovascular',
          choices: [
            'Angina/Chest pain',
            'Atrial fibrillation (AFib)',
            'DVT or Blood Clot',
            'Embolism',
            'Fainting',
            'Hardening of arteries',
            'Heart attack',
            'Heart disease',
            'High blood pressure',
            'Low blood pressure',
            'Poor circulation',
            'Rapid heart beat',
            'Slow heart beat',
            'Stroke',
            'Swollen ankles',
            'Varicose veins'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_integumentary',
          startWithNewLine: false,
          title: 'Integumentary/Skin',
          choices: [
            'Bruise easily',
            'Eczema/Hives',
            'Hair/Nail Changes',
            'Itching (Pruritis)',
            'Moles (Irregular)',
            'Psoriasis',
            'Rashes',
            'Scaling',
            'Skin cancer'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_hematological',
          title: 'Hematological/Lymphatic',
          choices: [
            'Anemia',
            'Blood disorder',
            'HIV/AIDS'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_allergy',
          startWithNewLine: false,
          title: 'Allergy/Immunologic',
          choices: [
            'Seasonal Allergies',
            'Food Allergy/Intolerance',
            'Rheumatic fever',
            'Tuberculosis'
          ],
          colCount: 0
        }
      ]
    },
    {
      type: 'panel',
      name: 'ros_systems_3',
      title: 'Systems (continued)',
      elements: [
        {
          type: 'checkbox',
          name: 'ros_respiratory',
          title: 'Respiratory',
          choices: [
            'Asthma',
            'Bronchitis',
            'Chronic cough',
            'COPD',
            'Difficulty breathing',
            'Emphysema',
            'Shortness of breath',
            'Sleep apnea'
          ],
          colCount: 0
        },
        {
          type: 'text',
          name: 'ros_cpap',
          visibleIf: "{ros_respiratory} contains 'Sleep apnea'",
          startWithNewLine: false,
          title: 'CPAP details'
        },
        {
          type: 'checkbox',
          name: 'ros_genitourinary',
          startWithNewLine: false,
          title: 'Genitourinary (GU)',
          choices: [
            'Bed-wetting',
            'Bladder infection',
            'Blood in urine',
            'Kidney infection',
            'Kidney stone',
            'Painful urination',
            'Poor urine control',
            'Urinary Tract Infection'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_neurological',
          title: 'Neurological',
          choices: [
            'Burning sensations',
            'Convulsions',
            'Numbness in arm/hand',
            'Numbness in leg/foot',
            'Pins/Needles/Tingling',
            'Restless Leg Synd. (RLS)',
            'Sciatica',
            'Seizures'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_eent',
          startWithNewLine: false,
          title: 'EENT',
          choices: [
            'Dental issues',
            'Difficulty swallowing',
            'Ear infection(s)',
            'Hearing issues',
            'Nasal congestion',
            'Nosebleeds',
            'Ringing in ears',
            'Sinus infection',
            'Sore throat',
            'TMJ pain',
            'Vision issues'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_vision_corrected',
          visibleIf: "{ros_eent} contains 'Vision issues'",
          startWithNewLine: false,
          titleLocation: 'hidden',
          choices: [
            'corrected'
          ],
          colCount: 0
        }
      ]
    },
    {
      type: 'panel',
      name: 'ros_systems_4',
      title: 'Systems (continued)',
      elements: [
        {
          type: 'checkbox',
          name: 'ros_psychiatric',
          title: 'Psychiatric',
          choices: [
            'ADHD/ADD',
            'Anxiety',
            'Dementia',
            'Depression',
            'Nervousness',
            'Paranoia',
            'PTSD',
            'Stress/Tension'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_headneck',
          startWithNewLine: false,
          title: 'Head/Neck',
          choices: [
            'Headaches',
            'Migraines',
            'Painful neck',
            'Stiff neck'
          ],
          colCount: 0
        },
        {
          type: 'checkbox',
          name: 'ros_migraines_aura',
          visibleIf: "{ros_headneck} contains 'Migraines'",
          startWithNewLine: false,
          titleLocation: 'hidden',
          choices: [
            'w/ Aura'
          ],
          colCount: 0
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
          visibleIf: "{patient_demographics_data.sex} = 'Female' or {sex_at_birth} = 'female'",
          title: 'For Women Only',
          elements: [
            {
              type: 'checkbox',
              name: 'ros_women_symptoms',
              title: 'Symptoms',
              choices: [
                'Breast lumps or pain',
                'Irregular cycle',
                'Menopausal symptoms',
                'Menstrual cramps',
                'Painful intercourse',
                'PCOS',
                'Premenstrual tension',
                'Unable to get pregnant'
              ],
              colCount: 0
            },
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
              name: 'ros_women_breast_aug',
              title: 'Breast Augmentation'
            },
            {
              type: 'text',
              name: 'ros_women_breast_reduc',
              title: 'Breast Reduction'
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
            },
            {
              type: 'radiogroup',
              name: 'ros_women_regular_checkups',
              title: 'Regular Checkups?',
              choices: [
                'Yes',
                'No'
              ],
              colCount: 0
            },
            {
              type: 'radiogroup',
              name: 'ros_women_pregnant',
              title: 'Are you Pregnant?',
              choices: [
                'Yes',
                'No'
              ],
              colCount: 0
            }
          ]
        },
        {
          type: 'panel',
          name: 'ros_men_only',
          visibleIf: "{patient_demographics_data.sex} = 'Male' or {sex_at_birth} = 'male'",
          title: 'For Men Only',
          elements: [
            {
              type: 'checkbox',
              name: 'ros_men_symptoms',
              title: 'Symptoms',
              choices: [
                'Breast lumps or pain',
                'Changes in bathroom habits',
                'Erectile dysfunction (ED)',
                'Low T, Testosterone',
                'Painful intercourse',
                'Prostate issues',
                'Testicular issues'
              ],
              colCount: 0
            },
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
            },
            {
              type: 'radiogroup',
              name: 'ros_men_regular_checkups',
              title: 'Regular Checkups?',
              choices: [
                'Yes',
                'No'
              ],
              colCount: 0
            }
          ]
        }
      ]
    },
    {
      type: 'comment',
      name: 'ros_other_conditions',
      title: 'List any other conditions'
    }
  ]
};