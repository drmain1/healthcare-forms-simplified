export const patientHistoryFormConfig = {
  name: 'patient-history-form',
  title: 'Patient History Form',
  iconName: 'icon-panel',
  category: 'Patient Info',
  json: {
  "type": "panel",
  "name": "patient_history_form_panel",
  "title": "Patient History",
  "description": "A comprehensive patient history form.",
  "metadata": { "patternType": "patient_history_form" },
  "elements": [
    {
      "type": "panel",
      "name": "patient_info_panel",
      "title": "Patient Information",
      "elements": [
        {
          "type": "panel",
          "name": "patient_measurements_panel",
          "elements": [
            {
              "type": "heightslider",
              "name": "patient_height",
              "startWithNewLine": false,
              "title": "Height"
            },
            {
              "type": "weightslider",
              "name": "patient_weight",
              "startWithNewLine": false,
              "title": "Weight"
            }
          ]
        },
        {
          "type": "text",
          "name": "patient_occupation",
          "title": "Occupation"
        }
      ]
    },
    {
      "type": "panel",
      "name": "pain_assessment_panel",
      "title": "Visual Analog Scale & Pain Assessment",
      "description": "For each area below, please describe your present pain level and frequency.",
      "metadata": {
        "patternType": "pain_assessment"
      },
      "elements": [
        {
          "type": "panel",
          "name": "neck_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_neck_pain",
              "title": "Neck Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "neck_details_panel",
              "visibleIf": "{has_neck_pain} = 'Yes'",
              "elements": [
                {
                  "type": "slider",
                  "name": "neck_pain_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "neck_pain_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<----------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "headaches_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_headaches",
              "title": "Headaches",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "headaches_details_panel",
              "visibleIf": "{has_headaches} = 'Yes'",
              "elements": [
                {
                  "type": "slider",
                  "name": "headaches_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "headaches_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<--------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "low_back_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_low_back_pain",
              "title": "Low Back Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "low_back_details_panel",
              "visibleIf": "{has_low_back_pain} = 'Yes'",
              "elements": [
                {
                  "type": "slider",
                  "name": "low_back_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "low_back_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<----------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "mid_back_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_mid_back_pain",
              "title": "Mid Back Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "mid_back_details_panel",
              "visibleIf": "{has_mid_back_pain} = 'Yes'",
              "elements": [
                {
                  "type": "slider",
                  "name": "mid_back_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "mid_back_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<-------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "upper_back_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_upper_back_pain",
              "title": "Upper Back Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "upper_back_details_panel",
              "visibleIf": "{has_upper_back_pain} = 'Yes'",
              "elements": [
                {
                  "type": "slider",
                  "name": "upper_back_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "upper_back_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<----------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "shoulder_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_shoulder_pain",
              "title": "Shoulder Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "shoulder_details_panel",
              "visibleIf": "{has_shoulder_pain} = 'Yes'",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "shoulder_side",
                  "title": "Which side(s)?",
                  "choices": [
                    "Left",
                    "Right"
                  ]
                },
                {
                  "type": "slider",
                  "name": "shoulder_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "shoulder_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<------------------------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "hip_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_hip_pain",
              "title": "Hip Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "hip_details_panel",
              "visibleIf": "{has_hip_pain} = 'Yes'",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "hip_side",
                  "title": "Which side(s)?",
                  "choices": [
                    "Left",
                    "Right"
                  ]
                },
                {
                  "type": "slider",
                  "name": "hip_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "hip_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<------------------------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "arm_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_arm_pain",
              "title": "Arm Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "arm_details_panel",
              "visibleIf": "{has_arm_pain} = 'Yes'",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "arm_side",
                  "title": "Which side(s)?",
                  "choices": [
                    "Left",
                    "Right"
                  ]
                },
                {
                  "type": "slider",
                  "name": "arm_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "arm_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<------------------------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "leg_panel",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_leg_pain",
              "title": "Leg Pain",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "panel",
              "name": "leg_details_panel",
              "visibleIf": "{has_leg_pain} = 'Yes'",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "leg_side",
                  "title": "Which side(s)?",
                  "choices": [
                    "Left",
                    "Right"
                  ]
                },
                {
                  "type": "slider",
                  "name": "leg_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "leg_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<------------------------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "other_area_panel",
          "elements": [
            {
              "type": "text",
              "name": "other_area_specify",
              "title": "Other Area (if applicable):"
            },
            {
              "type": "panel",
              "name": "other_area_details_panel",
              "visibleIf": "{other_area_specify} notempty",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "other_side",
                  "title": "Side (if applicable):",
                  "choices": [
                    "Left",
                    "Right",
                    "Central"
                  ]
                },
                {
                  "type": "slider",
                  "name": "other_intensity",
                  "title": "Pain Severity (0-10)",
                  "max": 10
                },
                {
                  "type": "slider",
                  "name": "other_frequency",
                  "title": "How often do you experience this pain? (0-100%)",
                  "description": "Occasional pain<------------------------->Constant pain",
                  "step": 5
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "panel",
      "name": "current_complaint_panel",
      "title": "Current Complaint",
      "elements": [
        {
          "type": "radiogroup",
          "name": "had_chiropractic_care",
          "title": "1. Have you had chiropractic care before?",
          "isRequired": true,
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "text",
          "name": "chiropractic_care_recency",
          "visibleIf": "{had_chiropractic_care} = 'Yes'",
          "startWithNewLine": false,
          "title": "If yes, how recently?",
          "isRequired": true
        },
        {
          "type": "checkbox",
          "name": "reason_for_visit",
          "title": "2. Reason for today's visit:",
          "choices": [
            "Aches and Pains",
            "Recent Injury",
            "Previous Injury",
            "Maintenance Care (No Complaints)"
          ],
          "showOtherItem": true,
          "otherText": "Other:",
          "colCount": 2
        },
        {
          "type": "text",
          "name": "complaint_start_date",
          "title": "3. When did your complaint(s) first begin?"
        },
        {
          "type": "radiogroup",
          "name": "condition_status",
          "startWithNewLine": false,
          "title": "Today the condition is:",
          "choices": [
            "Same",
            "Better",
            "Worse"
          ],
          "colCount": 0
        },
        {
          "type": "comment",
          "name": "condition_helpers_worseners",
          "title": "Is there anything that helps or worsens the condition? Please indicate:"
        },
        {
          "type": "radiogroup",
          "name": "seen_other_provider",
          "title": "Have you previously seen another provider for this condition?",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "text",
          "name": "other_provider_name",
          "visibleIf": "{seen_other_provider} = 'Yes'",
          "startWithNewLine": false,
          "title": "Previous Provider:",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "seeing_specialist",
          "title": "Are you currently seeing another provider/specialist for this condition?",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "text",
          "name": "specialist_type",
          "visibleIf": "{seeing_specialist} = 'Yes'",
          "startWithNewLine": false,
          "title": "List Type of Specialist:",
          "isRequired": true
        }
      ]
    },
    {
      "type": "panel",
      "name": "complaint_details_panel",
      "title": "Complaint Details",
      "elements": [
        {
          "type": "bodypaindiagram",
          "name": "pain_location_diagram",
          "title": "5. Use the figures below to place an  on any specific area(s) where you are experiencing pain, discomfort or limited range of motion.",
          "metadata": {
            "patternType": "body_pain_diagram"
          }
        },
        {
          "type": "radiogroup",
          "name": "experienced_complaint_before",
          "title": "6. Have you experienced this/these complaint(s) before?",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "text",
          "name": "complaint_before_when",
          "visibleIf": "{experienced_complaint_before} = 'Yes'",
          "startWithNewLine": false,
          "title": "If yes, when?",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "is_pregnant",
          "title": "7. Are you pregnant?",
          "choices": [
            "Yes",
            "No",
            "N/A"
          ],
          "colCount": 0
        },
        {
          "type": "text",
          "name": "estimated_due_date",
          "visibleIf": "{is_pregnant} = 'Yes'",
          "startWithNewLine": false,
          "title": "If yes, estimated due date:",
          "isRequired": true,
          "inputType": "date"
        },
        {
          "type": "checkbox",
          "name": "current_symptoms",
          "title": "8. Are you currently experiencing any of the following?",
          "choices": [
            "Nausea or vomiting",
            "Fainting or lightheadedness",
            "Headache or neck pain",
            "Rapid eye movement",
            "Dizziness",
            "Difficulty swallowing/speaking",
            "Numbness on one side of the face or body",
            "Difficulty walking",
            "Double vision"
          ],
          "showNoneItem": true,
          "noneText": "N/A",
          "colCount": 3
        },
        {
          "type": "radiogroup",
          "name": "taking_medications",
          "title": "9. Are you currently taking any medications?",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "comment",
          "name": "medication_list",
          "visibleIf": "{taking_medications} = 'Yes'",
          "title": "List:",
          "isRequired": true
        }
      ]
    },
    {
      "type": "panel",
      "name": "past_history_panel",
      "title": "Past History",
      "elements": [
        {
          "type": "checkbox",
          "name": "musculoskeletal_conditions",
          "title": "10. MUSCULOSKELETAL CONDITIONS (please check all that apply)",
          "choices": [
            "Headaches/Migraines",
            "Hip Pain/Discomfort",
            "Arthritis",
            "Neck Pain/Discomfort",
            "Sciatica",
            "Fused/Fixated Joints",
            "Shoulder Pain/Discomfort",
            "Elbow Pain/Discomfort",
            "Herniated Disc",
            "Upper Back Pain/Discomfort",
            "Wrist Pain/Discomfort",
            "Joint Replacement",
            "Middle Back Pain/Discomfort",
            "Knee Pain/Discomfort",
            "Osteoporosis",
            "Low Back Pain/Discomfort",
            "Ankle Pain/Discomfort",
            "Osteopenia"
          ],
          "showNoneItem": true,
          "noneText": "N/A",
          "colCount": 3
        },
        {
          "type": "text",
          "name": "inflammation_swelling_where",
          "title": "Inflammation/swelling: where?"
        },
        {
          "type": "checkbox",
          "name": "other_conditions",
          "title": "OTHER CONDITIONS",
          "choices": [
            "Cancer",
            "Heart Disease",
            "Tumors",
            "AIDS/HIV",
            "Stroke",
            "Diabetes",
            "Seizure Disorders",
            "Hepatitis",
            "High Blood Pressure",
            "Tuberculosis",
            "Pacemaker",
            "Hernia",
            "Allergies"
          ],
          "showOtherItem": true,
          "showNoneItem": true,
          "noneText": "N/A",
          "otherText": "Other:",
          "colCount": 2
        }
      ]
    },
    {
      "type": "panel",
      "name": "event_history_panel",
      "title": "11. Please indicate if you have a history of the following:",
      "elements": [
        {
          "type": "radiogroup",
          "name": "history_surgeries",
          "title": "Surgeries",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "comment",
          "name": "surgeries_details",
          "visibleIf": "{history_surgeries} = 'Yes'",
          "title": "Description (MM/YY - Description)",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "history_accidents",
          "title": "Accidents/Broken bones",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "comment",
          "name": "accidents_details",
          "visibleIf": "{history_accidents} = 'Yes'",
          "title": "Description (MM/YY - Description)",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "history_hospitalizations",
          "title": "Hospitalizations",
          "choices": [
            "Yes",
            "No"
          ],
          "colCount": 0
        },
        {
          "type": "comment",
          "name": "hospitalizations_details",
          "visibleIf": "{history_hospitalizations} = 'Yes'",
          "title": "Reason (MM/YY - Reason)",
          "isRequired": true
        }
      ]
    },
    {
      "type": "panel",
      "name": "family_lifestyle_panel",
      "title": "Family and Lifestyle",
      "elements": [
        {
          "type": "checkbox",
          "name": "family_health_history",
          "title": "12. Family Health History: (check all that apply)",
          "choices": [
            "Cancer",
            "Tumors",
            "Stroke",
            "Seizures",
            "Diabetes",
            "High Blood Pressure",
            "Heart Disease"
          ],
          "showNoneItem": true,
          "noneText": "N/A",
          "colCount": 2
        },
        {
          "type": "checkbox",
          "name": "difficult_activities",
          "title": "13. Is the current condition making any of the following activities difficult to perform?",
          "choices": [
            "Sitting",
            "Standing",
            "Walking",
            "Bending",
            "Lifting",
            "Lying down",
            "Work",
            "Sleep",
            "Sports/hobbies"
          ],
          "colCount": 3
        },
        {
          "type": "checkbox",
          "name": "goals_of_care",
          "title": "14. What is/are your personal goals of care?",
          "choices": [
            "Become more active",
            "Resume activity I previously enjoyed",
            "Improve general health",
            "Better sleep quality",
            "Increase flexibility and movement",
            "Maintain health and well-being"
          ],
          "colCount": 2
        }
      ]
    },
    {
      "type": "panel",
      "name": "signature_panel",
      "title": "Signature",
      "elements": [
        {
          "type": "signaturepad",
          "name": "patient_signature",
          "title": "Patient or Legal Guardian Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature_date",
          "startWithNewLine": false,
          "title": "Date",
          "defaultValueExpression": "today()",
          "isRequired": true,
          "inputType": "date"
        }
      ]
    }
  ]
}}