{
  "title": "Patient History",
  "description": "Form",
  "pages": [
    {
      "name": "page1",
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
          "title": "Visual Analog Scale &amp; Pain Assessment",
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
                  "visibleIf": "{has_neck_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;----------&gt;Constant pain",
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
                  "visibleIf": "{has_headaches} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;---------&gt;Constant pain",
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
                  "visibleIf": "{has_low_back_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;----------&gt;Constant pain",
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
                  "visibleIf": "{has_mid_back_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;--------&gt;Constant pain",
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
                  "visibleIf": "{has_upper_back_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;----------&gt;Constant pain",
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
                  "visibleIf": "{has_shoulder_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;-------------------------&gt;Constant pain",
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
                  "visibleIf": "{has_hip_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;-------------------------&gt;Constant pain",
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
                  "visibleIf": "{has_arm_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;-------------------------&gt;Constant pain",
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
                  "visibleIf": "{has_leg_pain} = &#39;Yes&#39;",
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
                      "description": "Occasional pain&lt;-------------------------&gt;Constant pain",
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
                      "description": "Occasional pain&lt;-------------------------&gt;Constant pain",
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
              "visibleIf": "{had_chiropractic_care} = &amp;#39;Yes&amp;#39;",
              "startWithNewLine": false,
              "title": "If yes, how recently?",
              "isRequired": true
            },
            {
              "type": "checkbox",
              "name": "reason_for_visit",
              "title": "2. Reason for today&amp;amp;amp;#39;s visit:",
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
              "visibleIf": "{seen_other_provider} = &amp;#39;Yes&amp;#39;",
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
              "visibleIf": "{seeing_specialist} = &amp;#39;Yes&amp;#39;",
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
              "visibleIf": "{experienced_complaint_before} = &amp;#39;Yes&amp;#39;",
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
              "visibleIf": "{is_pregnant} = &amp;#39;Yes&amp;#39;",
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
              "visibleIf": "{taking_medications} = &amp;#39;Yes&amp;#39;",
              "title": "List:",
              "isRequired": true
            }
          ]
        }
      ]
    },
    {
      "name": "page2",
      "elements": [
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
              "visibleIf": "{history_surgeries} = &amp;amp;amp;#39;Yes&amp;amp;amp;#39;",
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
              "visibleIf": "{history_accidents} = &amp;amp;#39;Yes&amp;amp;#39;",
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
              "visibleIf": "{history_hospitalizations} = &amp;amp;#39;Yes&amp;amp;#39;",
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
    },
    {
      "name": "page3",
      "elements": [
        {
          "type": "panel",
          "name": "panel1",
          "title": "Oswestry Low Back Pain Disability Index",
          "description": "Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.",
          "metadata": {
            "patternType": "oswestry_disability"
          },
          "elements": [
            {
              "type": "panel",
              "name": "panel2",
              "elements": [
                {
                  "type": "text",
                  "name": "question1",
                  "startWithNewLine": false,
                  "title": "Name"
                },
                {
                  "type": "text",
                  "name": "question2",
                  "startWithNewLine": false,
                  "title": "Date",
                  "defaultValue": "2025-08-28",
                  "inputType": "date"
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel3",
              "title": "SECTION 1 - Pain Intensity",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question3",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "The pain comes and goes and is very mild."
                    },
                    {
                      "value": 1,
                      "text": "The pain is mild and does not vary much."
                    },
                    {
                      "value": 2,
                      "text": "The pain comes and goes and is moderate."
                    },
                    {
                      "value": 3,
                      "text": "The pain is moderate and does not vary much."
                    },
                    {
                      "value": 4,
                      "text": "The pain comes and goes and is severe."
                    },
                    {
                      "value": 5,
                      "text": "The pain is severe and does not vary much."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel4",
              "title": "SECTION 2 - Personal Care (Washing, Dressing, etc.)",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question4",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I would not have to change my way of washing or dressing in order to avoid pain."
                    },
                    {
                      "value": 1,
                      "text": "I do not normally change my way of washing or dressing even though it causes some pain."
                    },
                    {
                      "value": 2,
                      "text": "Washing and dressing increases the pain, but I manage not to change my way of doing it."
                    },
                    {
                      "value": 3,
                      "text": "Washing and dressing increases the pain and I find it necessary to change my way of doing it."
                    },
                    {
                      "value": 4,
                      "text": "Because of the pain, I am unable to do some washing and dressing without help."
                    },
                    {
                      "value": 5,
                      "text": "Because of the pain, I am unable to do any washing and dressing without help."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel5",
              "title": "SECTION 3 - Lifting",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question5",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I can lift heavy weights without extra pain."
                    },
                    {
                      "value": 1,
                      "text": "I can lift heavy weights, but it causes extra pain."
                    },
                    {
                      "value": 2,
                      "text": "Pain prevents me from lifting heavy weights off the floor, but I can if they are conveniently positioned."
                    },
                    {
                      "value": 3,
                      "text": "Pain prevents me from lifting heavy weights, but I can manage light to medium weights if conveniently positioned."
                    },
                    {
                      "value": 4,
                      "text": "I can lift only very light weights."
                    },
                    {
                      "value": 5,
                      "text": "I cannot lift or carry anything at all."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel6",
              "title": "SECTION 4 - Walking",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question6",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "Pain does not prevent me walking any distance."
                    },
                    {
                      "value": 1,
                      "text": "Pain prevents me walking more than 1 mile."
                    },
                    {
                      "value": 2,
                      "text": "Pain prevents me walking more than ½ mile."
                    },
                    {
                      "value": 3,
                      "text": "Pain prevents me walking more than ¼ mile."
                    },
                    {
                      "value": 4,
                      "text": "I can only walk using a cane or crutches."
                    },
                    {
                      "value": 5,
                      "text": "I am in bed most of the time and have to crawl to the toilet."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel7",
              "title": "SECTION 5 - Sitting",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question7",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I can sit in any chair as long as I like without pain."
                    },
                    {
                      "value": 1,
                      "text": "I can only sit in my favorite chair as long as I like."
                    },
                    {
                      "value": 2,
                      "text": "Pain prevents me from sitting for more than 1 hour."
                    },
                    {
                      "value": 3,
                      "text": "Pain prevents me from sitting for more than ½ hour."
                    },
                    {
                      "value": 4,
                      "text": "Pain prevents me from sitting for more than 10 minutes."
                    },
                    {
                      "value": 5,
                      "text": "Pain prevents me from sitting at all."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel8",
              "title": "SECTION 6 - Standing",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question8",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I can stand as long as I want without extra pain."
                    },
                    {
                      "value": 1,
                      "text": "I have some pain while standing, but it does not increase with time."
                    },
                    {
                      "value": 2,
                      "text": "I cannot stand for longer than 1 hour without increasing pain."
                    },
                    {
                      "value": 3,
                      "text": "I cannot stand for longer than ½ hour without increasing pain."
                    },
                    {
                      "value": 4,
                      "text": "I cannot stand for longer than 10 minutes without increasing pain."
                    },
                    {
                      "value": 5,
                      "text": "I avoid standing because it increases the pain straight away."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel9",
              "title": "SECTION 7 - Sleeping",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question9",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I get no pain in bed."
                    },
                    {
                      "value": 1,
                      "text": "I get pain in bed, but it does not prevent me from sleeping well."
                    },
                    {
                      "value": 2,
                      "text": "Because of pain, my normal night&#39;s sleep is reduced by less than one quarter."
                    },
                    {
                      "value": 3,
                      "text": "Because of pain, my normal night&#39;s sleep is reduced by less than one half."
                    },
                    {
                      "value": 4,
                      "text": "Because of pain, my normal night&#39;s sleep is reduced by less than three quarters."
                    },
                    {
                      "value": 5,
                      "text": "Pain prevents me from sleeping at all."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel10",
              "title": "SECTION 8 - Social Life",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question10",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "My social life is normal and gives me no pain."
                    },
                    {
                      "value": 1,
                      "text": "My social life is normal, but increases the degree of my pain."
                    },
                    {
                      "value": 2,
                      "text": "Pain has no significant effect on my social life apart from limiting energetic interests (e.g., dancing)."
                    },
                    {
                      "value": 3,
                      "text": "Pain has restricted my social life and I do not go out very often."
                    },
                    {
                      "value": 4,
                      "text": "Pain has restricted my social life to my home."
                    },
                    {
                      "value": 5,
                      "text": "I hardly have any social life because of the pain."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel11",
              "title": "SECTION 9 - Traveling",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question11",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "I get no pain while traveling."
                    },
                    {
                      "value": 1,
                      "text": "I get some pain while traveling, but none of my usual forms of travel make it worse."
                    },
                    {
                      "value": 2,
                      "text": "I get some pain while traveling, but it does not compel me to seek alternative forms of travel."
                    },
                    {
                      "value": 3,
                      "text": "I get extra pain while traveling which compels me to seek alternative forms of travel."
                    },
                    {
                      "value": 4,
                      "text": "Pain restricts all forms of travel."
                    },
                    {
                      "value": 5,
                      "text": "Pain prevents all forms of travel except that done lying down."
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel12",
              "title": "SECTION 10 - Employment/Homemaking",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question12",
                  "titleLocation": "hidden",
                  "choices": [
                    {
                      "value": 0,
                      "text": "My normal work/homemaking activities do not cause pain."
                    },
                    {
                      "value": 1,
                      "text": "My normal work/homemaking activities increase my pain, but I can still perform all that is required."
                    },
                    {
                      "value": 2,
                      "text": "I can perform most of my work/homemaking duties, but pain prevents me from performing more physically stressful activities."
                    },
                    {
                      "value": 3,
                      "text": "Pain prevents me from doing anything but light duties."
                    },
                    {
                      "value": 4,
                      "text": "Pain prevents me from doing even light duties."
                    },
                    {
                      "value": 5,
                      "text": "Pain prevents me from performing any job or homemaking chores."
                    }
                  ]
                }
              ]
            },
            {
              "type": "comment",
              "name": "question13",
              "title": "Additional Comments:"
            },
            {
              "type": "panel",
              "name": "panel13",
              "title": "ODI Score Results",
              "elements": [
                {
                  "type": "expression",
                  "name": "question14",
                  "title": "Total Score:",
                  "expression": "(iif({question3} notempty, {question3}, 0) + iif({question4} notempty, {question4}, 0) + iif({question5} notempty, {question5}, 0) + iif({question6} notempty, {question6}, 0) + iif({question7} notempty, {question7}, 0) + iif({question8} notempty, {question8}, 0) + iif({question9} notempty, {question9}, 0) + iif({question10} notempty, {question10}, 0) + iif({question11} notempty, {question11}, 0) + iif({question12} notempty, {question12}, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question15",
                  "title": "Sections Completed:",
                  "expression": "(iif({question3} notempty, 1, 0) + iif({question4} notempty, 1, 0) + iif({question5} notempty, 1, 0) + iif({question6} notempty, 1, 0) + iif({question7} notempty, 1, 0) + iif({question8} notempty, 1, 0) + iif({question9} notempty, 1, 0) + iif({question10} notempty, 1, 0) + iif({question11} notempty, 1, 0) + iif({question12} notempty, 1, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question16",
                  "title": "Disability Percentage:",
                  "expression": "iif({question15} &gt; 0, round(({question14} / ({question15} * 5)) * 100, 1), 0)",
                  "format": "{0}%",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question17",
                  "title": "Interpretation:",
                  "expression": "iif({question16} &lt;= 20, &#34;Minimal Disability&#34;, iif({question16} &lt;= 40, &#34;Moderate Disability&#34;, iif({question16} &lt;= 60, &#34;Severe Disability&#34;, iif({question16} &lt;= 80, &#34;Crippled&#34;, &#34;Bed-bound or Exaggerating&#34;))))",
                  "displayStyle": "text"
                },
                {
                  "type": "html",
                  "name": "question18",
                  "html": "&lt;div style=&#34;margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;&#34;&gt;&lt;h4&gt;Score Interpretation Guide:&lt;/h4&gt;&lt;ul style=&#34;list-style-type: none; padding-left: 0;&#34;&gt;&lt;li&gt;• &lt;strong&gt;0-20%:&lt;/strong&gt; Minimal disability - Can cope with most activities&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;21-40%:&lt;/strong&gt; Moderate disability - More pain and difficulty with sitting, lifting, and standing&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;41-60%:&lt;/strong&gt; Severe disability - Pain is a primary problem, affecting daily life&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;61-80%:&lt;/strong&gt; Crippled - Back pain impinges on all aspects of life&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;81-100%:&lt;/strong&gt; Bed-bound or exaggerating symptoms&lt;/li&gt;&lt;/ul&gt;&lt;/div&gt;"
                },
                {
                  "type": "signaturepad",
                  "name": "question19",
                  "title": "Patient Signature:"
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "panel14",
          "title": "Neck Disability Index Questionnaire",
          "description": "Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.",
          "metadata": {
            "patternType": "neck_disability_index"
          },
          "elements": [
            {
              "type": "panel",
              "name": "panel15",
              "elements": [
                {
                  "type": "text",
                  "name": "question20",
                  "startWithNewLine": false,
                  "title": "Name"
                },
                {
                  "type": "text",
                  "name": "question21",
                  "startWithNewLine": false,
                  "title": "Date",
                  "defaultValue": "2025-08-28",
                  "inputType": "date"
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question22",
              "title": "SECTION 1 - Pain Intensity",
              "choices": [
                {
                  "value": 0,
                  "text": "I have no pain at the moment."
                },
                {
                  "value": 1,
                  "text": "The pain is very mild at the moment."
                },
                {
                  "value": 2,
                  "text": "The pain is moderate at the moment."
                },
                {
                  "value": 3,
                  "text": "The pain is fairly severe at the moment."
                },
                {
                  "value": 4,
                  "text": "The pain is very severe at the moment."
                },
                {
                  "value": 5,
                  "text": "The pain is the worst imaginable at the moment."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question23",
              "title": "SECTION 2 - Personal Care (Washing, Dressing, etc.)",
              "choices": [
                {
                  "value": 0,
                  "text": "I can look after myself normally without causing extra pain."
                },
                {
                  "value": 1,
                  "text": "I can look after myself normally, but it causes extra pain."
                },
                {
                  "value": 2,
                  "text": "It is painful to look after myself and I am slow and careful."
                },
                {
                  "value": 3,
                  "text": "I need some help, but manage most of my personal care."
                },
                {
                  "value": 4,
                  "text": "I need help every day in most aspects of self-care."
                },
                {
                  "value": 5,
                  "text": "I do not get dressed, I wash with difficulty and stay in bed."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question24",
              "title": "SECTION 3 - Lifting",
              "choices": [
                {
                  "value": 0,
                  "text": "I can lift heavy weights without extra pain."
                },
                {
                  "value": 1,
                  "text": "I can lift heavy weights, but it gives extra pain."
                },
                {
                  "value": 2,
                  "text": "Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently positioned, for example, on a table."
                },
                {
                  "value": 3,
                  "text": "Pain prevents me from lifting heavy weights, but I can manage light to medium weights if they are conveniently positioned."
                },
                {
                  "value": 4,
                  "text": "I can lift very light weights."
                },
                {
                  "value": 5,
                  "text": "I cannot lift or carry anything at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question25",
              "title": "SECTION 4 - Reading",
              "choices": [
                {
                  "value": 0,
                  "text": "I can read as much as I want to with no pain in my neck."
                },
                {
                  "value": 1,
                  "text": "I can read as much as I want to with slight pain in my neck."
                },
                {
                  "value": 2,
                  "text": "I can read as much as I want to with moderate pain in my neck."
                },
                {
                  "value": 3,
                  "text": "I cannot read as much as I want because of moderate pain in my neck."
                },
                {
                  "value": 4,
                  "text": "I cannot read as much as I want because of severe pain in my neck."
                },
                {
                  "value": 5,
                  "text": "I cannot read at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question26",
              "title": "SECTION 5 - Headaches",
              "choices": [
                {
                  "value": 0,
                  "text": "I have no headaches at all."
                },
                {
                  "value": 1,
                  "text": "I have slight headaches which come infrequently."
                },
                {
                  "value": 2,
                  "text": "I have moderate headaches which come infrequently."
                },
                {
                  "value": 3,
                  "text": "I have moderate headaches which come frequently."
                },
                {
                  "value": 4,
                  "text": "I have severe headaches which come frequently."
                },
                {
                  "value": 5,
                  "text": "I have headaches almost all the time."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question27",
              "title": "SECTION 6 - Concentration",
              "choices": [
                {
                  "value": 0,
                  "text": "I can concentrate fully when I want to with no difficulty."
                },
                {
                  "value": 1,
                  "text": "I can concentrate fully when I want to with slight difficulty."
                },
                {
                  "value": 2,
                  "text": "I have a fair degree of difficulty in concentrating when I want to."
                },
                {
                  "value": 3,
                  "text": "I have a lot of difficulty in concentrating when I want to."
                },
                {
                  "value": 4,
                  "text": "I have a great deal of difficulty in concentrating when I want to."
                },
                {
                  "value": 5,
                  "text": "I cannot concentrate at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question28",
              "title": "SECTION 7 - Work",
              "choices": [
                {
                  "value": 0,
                  "text": "I can do as much work as I want to."
                },
                {
                  "value": 1,
                  "text": "I can only do my usual work, but no more."
                },
                {
                  "value": 2,
                  "text": "I can do most of my usual work, but no more."
                },
                {
                  "value": 3,
                  "text": "I cannot do my usual work."
                },
                {
                  "value": 4,
                  "text": "I can hardly do any work at all."
                },
                {
                  "value": 5,
                  "text": "I cannot do any work at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question29",
              "title": "SECTION 8 - Driving",
              "choices": [
                {
                  "value": 0,
                  "text": "I can drive my car without any neck pain."
                },
                {
                  "value": 1,
                  "text": "I can drive my car as long as I want with slight pain in my neck."
                },
                {
                  "value": 2,
                  "text": "I can drive my car as long as I want with moderate pain in my neck."
                },
                {
                  "value": 3,
                  "text": "I cannot drive my car as long as I want because of moderate pain in my neck."
                },
                {
                  "value": 4,
                  "text": "I can hardly drive at all because of severe pain in my neck."
                },
                {
                  "value": 5,
                  "text": "I cannot drive my car at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question30",
              "title": "SECTION 9 - Recreation",
              "choices": [
                {
                  "value": 0,
                  "text": "I am able to engage in all of my recreational activities with no neck pain at all."
                },
                {
                  "value": 1,
                  "text": "I am able to engage in all of my recreational activities with some pain in my neck."
                },
                {
                  "value": 2,
                  "text": "I am able to engage in most, but not all of my recreational activities because of pain in my neck."
                },
                {
                  "value": 3,
                  "text": "I am able to engage in a few of my recreational activities because of pain in my neck."
                },
                {
                  "value": 4,
                  "text": "I can hardly do any recreational activities because of pain in my neck."
                },
                {
                  "value": 5,
                  "text": "I cannot do any recreational activities at all."
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question31",
              "title": "SECTION 10 - Sleeping",
              "choices": [
                {
                  "value": 0,
                  "text": "I have no trouble sleeping."
                },
                {
                  "value": 1,
                  "text": "My sleep is slightly disturbed (less than 1 hour sleepless)."
                },
                {
                  "value": 2,
                  "text": "My sleep is mildly disturbed (1-2 hours sleepless)."
                },
                {
                  "value": 3,
                  "text": "My sleep is moderately disturbed (2-3 hours sleepless)."
                },
                {
                  "value": 4,
                  "text": "My sleep is greatly disturbed (3-5 hours sleepless)."
                },
                {
                  "value": 5,
                  "text": "My sleep is completely disturbed (5-7 hours sleepless)."
                }
              ]
            },
            {
              "type": "comment",
              "name": "question32",
              "title": "Additional Comments:"
            },
            {
              "type": "panel",
              "name": "panel16",
              "title": "NDI Score Results",
              "elements": [
                {
                  "type": "expression",
                  "name": "question33",
                  "title": "Total Score:",
                  "expression": "(iif({question22} notempty, {question22}, 0) + iif({question23} notempty, {question23}, 0) + iif({question24} notempty, {question24}, 0) + iif({question25} notempty, {question25}, 0) + iif({question26} notempty, {question26}, 0) + iif({question27} notempty, {question27}, 0) + iif({question28} notempty, {question28}, 0) + iif({question29} notempty, {question29}, 0) + iif({question30} notempty, {question30}, 0) + iif({question31} notempty, {question31}, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question34",
                  "title": "Sections Completed:",
                  "expression": "(iif({question22} notempty, 1, 0) + iif({question23} notempty, 1, 0) + iif({question24} notempty, 1, 0) + iif({question25} notempty, 1, 0) + iif({question26} notempty, 1, 0) + iif({question27} notempty, 1, 0) + iif({question28} notempty, 1, 0) + iif({question29} notempty, 1, 0) + iif({question30} notempty, 1, 0) + iif({question31} notempty, 1, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question35",
                  "title": "Disability Percentage:",
                  "expression": "iif({question34} &gt; 0, round(({question33} / ({question34} * 5)) * 100, 1), 0)",
                  "format": "{0}%",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question36",
                  "title": "Interpretation:",
                  "expression": "iif({question35} &lt;= 8, &#34;No Disability&#34;, iif({question35} &lt;= 28, &#34;Mild Disability&#34;, iif({question35} &lt;= 48, &#34;Moderate Disability&#34;, iif({question35} &lt;= 68, &#34;Severe Disability&#34;, &#34;Complete Disability&#34;))))",
                  "displayStyle": "text"
                },
                {
                  "type": "html",
                  "name": "question37",
                  "html": "&lt;div style=&#34;margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;&#34;&gt;&lt;h4&gt;NDI Score Interpretation Guide:&lt;/h4&gt;&lt;ul style=&#34;list-style-type: none; padding-left: 0;&#34;&gt;&lt;li&gt;• &lt;strong&gt;0-8%:&lt;/strong&gt; No disability - Patients can cope with most living activities&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;10-28%:&lt;/strong&gt; Mild disability - Pain and difficulty with sitting, lifting, and standing. Travel and social life are more difficult&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;30-48%:&lt;/strong&gt; Moderate disability - Pain is the main problem. Patients experience more problems with sitting, standing, and traveling&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;50-68%:&lt;/strong&gt; Severe disability - Pain impairs all aspects of life. Positive intervention is required&lt;/li&gt;&lt;li&gt;• &lt;strong&gt;70-100%:&lt;/strong&gt; Complete disability - Patients are either bed-bound or exaggerating their symptoms&lt;/li&gt;&lt;/ul&gt;&lt;p style=&#34;margin-top: 10px; font-size: 0.9em; color: #666;&#34;&gt;Reference: Vernon, Mior. JMPT 1991; 14(7): 409-15&lt;/p&gt;&lt;/div&gt;"
                },
                {
                  "type": "signaturepad",
                  "name": "question38",
                  "title": "Patient Signature:"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "showProgressBar": true,
  "progressBarLocation": "bottom",
  "widthMode": "responsive"
}