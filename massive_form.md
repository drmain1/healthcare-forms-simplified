
  "title": "Jaymac Chiropractic - Adult New Patient Intake Form",
  "description": "Please complete this form to the best of your ability. This information is confidential and essential for providing you with the best possible care.",
  "pages": [
    {
      "name": "page_patient_info",
      "title": "Patient Information",
      "elements": [
        {
          "type": "panel",
          "name": "patient_demographics",
          "title": "Patient Demographics",
          "elements": [
            {
              "type": "html",
              "name": "demographics_header",
              "html": "<h3 style=\"margin-bottom: 20px; color: #333;\">Patient Information</h3>"
            },
            {
              "type": "text",
              "name": "form_date",
              "title": "Today's Date",
              "defaultValue": "2025-08-05",
              "readOnly": true,
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "first_name",
              "title": "First Name",
              "isRequired": true,
              "validators": [
                {
                  "type": "text",
                  "minLength": 2,
                  "maxLength": 50
                }
              ]
            },
            {
              "type": "text",
              "name": "last_name",
              "title": "Last Name",
              "isRequired": true,
              "validators": [
                {
                  "type": "text",
                  "minLength": 2,
                  "maxLength": 50
                }
              ]
            },
            {
              "type": "dateofbirth",
              "name": "date_of_birth",
              "title": "Date of Birth",
              "isRequired": true,
              "ageFieldName": "calculated_age"
            },
            {
              "type": "dropdown",
              "name": "sex_at_birth",
              "title": "Sex Assigned at Birth",
              "isRequired": true,
              "choices": [
                {
                  "value": "male",
                  "text": "Male"
                },
                {
                  "value": "female",
                  "text": "Female"
                },
                {
                  "value": "other",
                  "text": "Other"
                },
                {
                  "value": "prefer_not_to_answer",
                  "text": "Prefer not to answer"
                }
              ],
              "placeholder": "Select sex assigned at birth..."
            },
            {
              "type": "text",
              "name": "street_address",
              "title": "Street Address",
              "isRequired": true,
              "placeholder": "123 Main Street"
            },
            {
              "type": "text",
              "name": "city",
              "title": "City",
              "isRequired": true,
              "placeholder": "New York"
            },
            {
              "type": "dropdown",
              "name": "state",
              "title": "State",
              "isRequired": true,
              "choices": [
                {
                  "value": "AL",
                  "text": "Alabama"
                },
                {
                  "value": "AK",
                  "text": "Alaska"
                },
                {
                  "value": "AZ",
                  "text": "Arizona"
                },
                {
                  "value": "AR",
                  "text": "Arkansas"
                },
                {
                  "value": "CA",
                  "text": "California"
                },
                {
                  "value": "CO",
                  "text": "Colorado"
                },
                {
                  "value": "CT",
                  "text": "Connecticut"
                },
                {
                  "value": "DE",
                  "text": "Delaware"
                },
                {
                  "value": "FL",
                  "text": "Florida"
                },
                {
                  "value": "GA",
                  "text": "Georgia"
                },
                {
                  "value": "HI",
                  "text": "Hawaii"
                },
                {
                  "value": "ID",
                  "text": "Idaho"
                },
                {
                  "value": "IL",
                  "text": "Illinois"
                },
                {
                  "value": "IN",
                  "text": "Indiana"
                },
                {
                  "value": "IA",
                  "text": "Iowa"
                },
                {
                  "value": "KS",
                  "text": "Kansas"
                },
                {
                  "value": "KY",
                  "text": "Kentucky"
                },
                {
                  "value": "LA",
                  "text": "Louisiana"
                },
                {
                  "value": "ME",
                  "text": "Maine"
                },
                {
                  "value": "MD",
                  "text": "Maryland"
                },
                {
                  "value": "MA",
                  "text": "Massachusetts"
                },
                {
                  "value": "MI",
                  "text": "Michigan"
                },
                {
                  "value": "MN",
                  "text": "Minnesota"
                },
                {
                  "value": "MS",
                  "text": "Mississippi"
                },
                {
                  "value": "MO",
                  "text": "Missouri"
                },
                {
                  "value": "MT",
                  "text": "Montana"
                },
                {
                  "value": "NE",
                  "text": "Nebraska"
                },
                {
                  "value": "NV",
                  "text": "Nevada"
                },
                {
                  "value": "NH",
                  "text": "New Hampshire"
                },
                {
                  "value": "NJ",
                  "text": "New Jersey"
                },
                {
                  "value": "NM",
                  "text": "New Mexico"
                },
                {
                  "value": "NY",
                  "text": "New York"
                },
                {
                  "value": "NC",
                  "text": "North Carolina"
                },
                {
                  "value": "ND",
                  "text": "North Dakota"
                },
                {
                  "value": "OH",
                  "text": "Ohio"
                },
                {
                  "value": "OK",
                  "text": "Oklahoma"
                },
                {
                  "value": "OR",
                  "text": "Oregon"
                },
                {
                  "value": "PA",
                  "text": "Pennsylvania"
                },
                {
                  "value": "RI",
                  "text": "Rhode Island"
                },
                {
                  "value": "SC",
                  "text": "South Carolina"
                },
                {
                  "value": "SD",
                  "text": "South Dakota"
                },
                {
                  "value": "TN",
                  "text": "Tennessee"
                },
                {
                  "value": "TX",
                  "text": "Texas"
                },
                {
                  "value": "UT",
                  "text": "Utah"
                },
                {
                  "value": "VT",
                  "text": "Vermont"
                },
                {
                  "value": "VA",
                  "text": "Virginia"
                },
                {
                  "value": "WA",
                  "text": "Washington"
                },
                {
                  "value": "WV",
                  "text": "West Virginia"
                },
                {
                  "value": "WI",
                  "text": "Wisconsin"
                },
                {
                  "value": "WY",
                  "text": "Wyoming"
                }
              ],
              "placeholder": "Select a state...",
              "itemComponent": "custom-dropdown-item"
            },
            {
              "type": "text",
              "name": "zip_code",
              "title": "ZIP Code",
              "isRequired": true,
              "validators": [
                {
                  "type": "regex",
                  "text": "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)",
                  "regex": "^[0-9]{5}(-[0-9]{4})?$"
                }
              ],
              "placeholder": "12345"
            },
            {
              "type": "text",
              "name": "phone_number",
              "title": "Primary Phone Number",
              "isRequired": true,
              "validators": [
                {
                  "type": "regex",
                  "text": "Please enter a valid 10-digit phone number (e.g., (555) 123-4567)",
                  "regex": "^\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$"
                }
              ],
              "inputType": "tel",
              "placeholder": "(555) 123-4567"
            },
            {
              "type": "text",
              "name": "secondary_phone",
              "title": "Secondary Phone Number (Optional)",
              "validators": [
                {
                  "type": "regex",
                  "text": "Please enter a valid 10-digit phone number (e.g., (555) 987-6543)",
                  "regex": "^$|^\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$"
                }
              ],
              "inputType": "tel",
              "placeholder": "(555) 987-6543"
            },
            {
              "type": "text",
              "name": "email",
              "title": "Email Address",
              "validators": [
                {
                  "type": "email"
                }
              ],
              "inputType": "email",
              "placeholder": "patient@example.com"
            }
          ]
        },
        {
          "type": "panel",
          "name": "additional_patient_info_panel",
          "title": "Additional Information",
          "elements": [
            {
              "type": "radiogroup",
              "name": "preferred_communication",
              "title": "Preferred method of communication",
              "isRequired": true,
              "choices": [
                "Cell Phone",
                "Home Phone",
                "E-mail",
                "Other"
              ],
              "colCount": 0
            },
            {
              "type": "radiogroup",
              "name": "marital_status",
              "title": "Marital Status",
              "choices": [
                "M",
                "S",
                "W",
                "D"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "spouse_significant_other",
              "visibleIf": "{marital_status} = 'M'",
              "startWithNewLine": false,
              "title": "Name of Spouse/Significant Other"
            },
            {
              "type": "text",
              "name": "emergency_contact_name",
              "title": "Emergency Contact Name",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "emergency_contact_relationship",
              "startWithNewLine": false,
              "title": "Relationship",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "emergency_contact_phone",
              "startWithNewLine": false,
              "title": "Phone",
              "isRequired": true,
              "inputType": "tel"
            },
            {
              "type": "comment",
              "name": "how_did_you_hear",
              "title": "How did you hear about us?"
            }
          ]
        }
      ]
    },
    {
      "name": "page_consent_and_policies",
      "title": "Consent & Policies",
      "elements": [
        {
          "type": "panel",
          "name": "consent_to_treatment_panel",
          "title": "CONSENT TO CHIROPRACTIC EXAMINATION AND TREATMENT",
          "elements": [
            {
              "type": "html",
              "name": "consent_to_treatment_text",
              "html": "<div style='max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; text-align: left;'><p><strong>To the patient:</strong> Please read this entire document prior to signing it. It is important that you understand the information contained in it. Please ask questions if there is anything that is unclear before you sign.</p><h4>Information about the Chiropractic Adjustment</h4><p>The primary treatment used in the clinic is spinal manipulative therapy or the chiropractic adjustment. It is likely that spinal manipulative therapy will be used as part of your treatment. Spinal manipulative therapy includes placement of the doctor's hands or mechanical instruments upon your body in such a way as to mobilize your joints. This movement may cause an audible \"pop\" or \"click,\" such as experienced when you \"crack\" your knuckles. You may also feel a sense of movement.</p><h4>The Material Risks Inherent in the Chiropractic Adjustment</h4><p>All patient care, including chiropractic treatment, has the potential for negative effects. The risks associated with chiropractic treatments include, but are not limited to, dislocations and sprains, disc injuries, fractures, and strokes. These negative effects are very rare but nevertheless exist. The Doctors at JayMac Chiropractic will develop a treatment plan recommending what they feel is in your best interest based on clinical examination, patient history, and professional experience.</p><h4>The Probability of Those Risks Occurring</h4><p>Fractures are rare occurrences and generally result from some underlying weakness of the bone which your doctor looks for during your initial consultation, examination, and while reviewing your x-rays if indicated or recommended. Stroke has been the subject of tremendous disagreement. The incidence of a stroke is exceedingly rare and is estimated to occur between one in one million and one in five million adjustments of the neck. The other complications are also generally described as rare.</p><h4>The Availability and Nature of Other Treatment Options</h4><p>Other treatment options for your condition may include: Self-administered, over-the-counter analgesics, Rest, Medical care, Prescription medications such as anti-inflammatory, muscle relaxants and pain-killers, Hospitalization, and Surgery. If you choose to use one of the above noted \"other treatment\" options, you should be aware that there are risks and benefits of such options and you may wish to discuss these with your primary care physician.</p><p>Overuse of over-the-counter medications produces undesirable side effects. If complete rest is impractical, premature return to work and household chores may aggravate the condition and extend the recovery time. The probability of such complications arising is dependent upon the patient's overall health, severity of discomfort, their pain tolerance, and their self-discipline in not abusing the medication. Professional literature describes highly undesirable effects from long term use of over-the-counter medications.</p><p>Prescription muscle relaxants and pain killers can produce undesirable side effects and patient dependence. The risk of such complications arising is dependent upon the patient's overall health, severity of discomfort, their pain tolerance, their self-discipline in not abusing the medication, and proper professional supervision. Such medications generally entail very significant risks – some with rather high probabilities.</p><p>Hospitalization in conjunction with other care, bears the additional risk of exposure to communicable diseases, iatrogenic (doctor induced) mishap and expense. The probability of iatrogenic mishap is remote, expense is certain; exposure to communicable disease is likely with adverse results from such exposure being dependent upon many variables.</p><p>The risks inherent with surgery include adverse reaction to anesthesia, iatrogenic (doctor induced) mishap, all risks associated with hospitalization, and an extended convalescent period. The probability of those risks occurring varies to many factors.</p><h4>The Risks and Dangers Attendant to Remaining Untreated</h4><p>Remaining untreated may allow the formation of adhesions and reduce mobility of your joints which may set up a pain reaction further reducing mobility and overall range of motion. Over time this process may compromise your recovery making treatment more difficult and less effective the longer it is postponed. The probability that non-treatment will complicate a later rehabilitation is very high.</p><h4>The Chiropractic Examination</h4><p>Prior to establishing a treatment plan, the doctor must perform a Chiropractic Examination in order to determine the probable cause of your complaint. During the examination the doctor will perform some procedures or maneuvers intended to reproduce your symptoms which will allow for a better understanding of the nature of your condition and for the development of an appropriate treatment regimen. There is a slight possibility that these maneuvers may temporarily aggravate your symptoms.</p><h4>Documented Patient Noncompliance</h4><p>Every effort will be made to help you achieve maximum health. It is important to keep your appointments and follow through with the prescribed treatment plan. We understand busy schedules and anticipate these as a part of life, however, please be courteous and inform us of any conflicts in scheduling immediately so that we may accommodate you accordingly and schedule other patients in need. If the noncompliance reaches the point of jeopardizing \"good quality care,” we may formally discharge you as a patient with an appropriate letter of withdrawal. Your patient records will note such problems of noncompliance and you will be provided an alternative source of recovery.</p></div>"
            },
            {
              "type": "checkbox",
              "name": "consent_to_treatment_acknowledgement",
              "title": "Acknowledgement",
              "isRequired": true,
              "validators": [
                {
                  "type": "answercount",
                  "text": "You must accept the terms to continue.",
                  "minCount": 1
                }
              ],
              "choices": [
                {
                  "value": "accepted",
                  "text": "I have read or have had read to me the above explanations regarding the chiropractic examination, adjustment, and related treatment and have discussed it with the Doctors at JayMac Chiropractic and have had my questions answered to my satisfaction. By signing below I state that I understand the benefits, risks, and alternatives involved in undergoing treatment and have decided that it is in my best interest or my child's best interest to undergo the treatment recommended by the Doctors at JayMac Chiropractic. Having been informed of the benefits, risks, and alternatives, I hereby give my consent to the prescribed and recommended treatment. I intend this consent to cover any examinations and treatments for my present condition and for any future conditions for which I seek treatment from JayMac Chiropractic."
                }
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "parent_guardian_printed_name",
              "title": "Printed Name of Parent/Guardian",
              "isRequired": true
            },
            {
              "type": "signaturepad",
              "name": "patient_guardian_signature",
              "title": "Signature of Patient or Parent/Guardian (if a minor)",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "patient_signature_date",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "signaturepad",
              "name": "doctor_signature_consent",
              "title": "Signature of Doctor"
            },
            {
              "type": "text",
              "name": "doctor_signature_date_consent",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
            }
          ]
        },
        {
          "type": "panel",
          "name": "financial_responsibility_panel",
          "title": "ACKNOWLEDGMENT OF FINANCIAL RESPONSIBILITY",
          "elements": [
            {
              "type": "html",
              "name": "financial_responsibility_text",
              "html": "<div style='max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; text-align: left;'><p>I acknowledge and accept the following:</p><p>Health and accident insurance policies are an arrangement between an insurance carrier and me. JayMac Chiropractic will help prepare and submit claim forms and necessary medical records to assist me in making collection from the insurance company.</p><p>JayMac Chiropractic CAN NOT guarantee that my insurance company will pay. Prior to or immediately after my first visit, JayMac Chiropractic will make every attempt to receive and verify benefits and coverage. I understand that if I seek treatment outside of JayMac Chiropractic, my remaining benefits may not be accurate and claims may be denied due to exhausted benefits. I understand that insurance claims may be denied if I see multiple providers for the same injury or complaint.</p><p>I hereby assign all medical and chiropractic benefits to which I am entitled to JayMac Chiropractic. I hereby authorize and direct my insurance carrier(s), including Medicare, private insurance and any other medical plan or representative to issue payment check(s) or direct deposits directly to JayMac Chiropractic for medical or chiropractic services rendered to myself and/or my dependents.</p><p>All services rendered to me are charged directly to me and that I am personally responsible for payment. I understand that I am responsible for any amount not covered by insurance. I also understand that if I suspend or terminate my care and treatment or insurance policy, any fees for professional services rendered to me will be immediately due and payable.</p><p>*Effective October 1, 2022, all patients will be required to have a credit card on file (CCOF) regardless of insurance or visit type. Personal injury and worker's compensation patients will not be required to provide a CCOF until after discharge and continuation of care. See CCOF Policy online at <a href='http://www.JayMacChiropractic.com/CCOF.html' target='_blank'>http://www.JayMacChiropractic.com/CCOF.html</a> for additional details.</p><p>*A <strong>Medical Lien</strong> will be filed in Maricopa County, Arizona on behalf of JayMac Chiropractic for all ongoing medical expenses accrued in the office and with all involved 3rd party payers and legal representatives, regardless of fault, for all Personal Injury cases to ensure that all my treatments and visits are covered by the appropriate entity. A copy of the lien will be provided when filed. I acknowledge that any changes to this process must be discussed and agreed upon within 30 days. Please seek legal counsel relative to this financial policy.</p></div>"
            },
            {
              "type": "checkbox",
              "name": "financial_responsibility_acknowledgement",
              "title": "Acknowledgement",
              "isRequired": true,
              "choices": [
                {
                  "value": "accepted",
                  "text": "I have read and accept the financial responsibility policy."
                }
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "financial_printed_name",
              "title": "Printed Name of Patient or Parent/Guardian (if a minor)"
            },
            {
              "type": "signaturepad",
              "name": "financial_signature",
              "startWithNewLine": false,
              "title": "Signature of Patient or Parent/Guardian (if a minor)"
            },
            {
              "type": "text",
              "name": "financial_date",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
            }
          ]
        },
        {
          "type": "panel",
          "name": "privacy_practices_panel",
          "title": "ACKNOWLEDGEMENT OF REVIEW OF PRIVACY PRACTICES",
          "elements": [
            {
              "type": "html",
              "name": "privacy_practices_text",
              "html": "<div style='text-align: left;'><p>I have reviewed JayMac Chiropractic's Notice of Privacy Practices, located at <a href='http://www.JayMacChiropractic.com/privacy.html' target='_blank'>http://www.JayMacChiropractic.com/privacy.html</a>.</p><p>This policy explains how my Protected Health Information (PHI) will be used and disclosed. I have had my questions satisfactorily answered considering this policy. I understand that I may request a physical or digital copy of this document upon request at any time.</p></div>"
            },
            {
              "type": "checkbox",
              "name": "privacy_practices_acknowledgement",
              "title": "Acknowledgement",
              "isRequired": true,
              "choices": [
                {
                  "value": "accepted",
                  "text": "I acknowledge review of the Notice of Privacy Practices."
                }
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "privacy_printed_name",
              "title": "Printed Name of Patient or Parent/Guardian (if a minor)"
            },
            {
              "type": "signaturepad",
              "name": "privacy_signature",
              "startWithNewLine": false,
              "title": "Signature of Patient or Parent/Guardian (if a minor)"
            },
            {
              "type": "text",
              "name": "privacy_date",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "panel",
              "name": "office_use_privacy_panel",
              "title": "FOR OFFICE USE ONLY",
              "elements": [
                {
                  "type": "comment",
                  "name": "office_use_privacy_notes",
                  "title": "JayMac Chiropractic attempted to obtain written acknowledgment of receipt or review of our Notice of Privacy Practices, but acknowledgment could not be obtained because (please specify):"
                },
                {
                  "type": "text",
                  "name": "office_use_staff_signature",
                  "title": "Staff Signature"
                },
                {
                  "type": "text",
                  "name": "office_use_staff_date",
                  "startWithNewLine": false,
                  "title": "Date",
                  "inputType": "date"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "page_health_complaints",
      "title": "Health Complaints",
      "elements": [
        {
          "type": "panel",
          "name": "major_complaints_panel",
          "title": "Major Complaints"
        },
        {
          "type": "panel",
          "name": "panel1",
          "title": "Visual Analog Scale & Pain Assessment",
          "description": "Comprehensive pain assessment with intensity and frequency measurements",
          "elements": [
            {
              "type": "panel",
              "name": "panel2",
              "title": "Section 1 - Pain Intensity",
              "description": "For each area below, please describe your present pain level (0 = no pain, 10 = worst pain imaginable) and indicate pain frequency.",
              "elements": [
                {
                  "type": "html",
                  "name": "question1",
                  "html": "<div style=\"display: grid; grid-template-columns: 1fr 1fr; font-weight: bold; text-align: center; margin-bottom: 10px;\"><div>Pain Intensity</div><div>Pain Frequency</div></div>"
                },
                {
                  "type": "panel",
                  "name": "panel3",
                  "title": "Neck",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question2",
                      "title": "Do you have neck pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel4",
                      "visibleIf": "{question2} = \"Yes\"",
                      "elements": [
                        {
                          "type": "rating",
                          "name": "question3",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question4",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel5",
                  "title": "Headaches",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question5",
                      "title": "Do you have headaches?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel6",
                      "visibleIf": "{question5} = \"Yes\"",
                      "elements": [
                        {
                          "type": "rating",
                          "name": "question6",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question7",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel7",
                  "title": "Low Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question8",
                      "title": "Do you have low back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel8",
                      "visibleIf": "{question8} = \"Yes\"",
                      "elements": [
                        {
                          "type": "rating",
                          "name": "question9",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question10",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel9",
                  "title": "Mid Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question11",
                      "title": "Do you have mid back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel10",
                      "visibleIf": "{question11} = \"Yes\"",
                      "elements": [
                        {
                          "type": "rating",
                          "name": "question12",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question13",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel11",
                  "title": "Upper Back",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question14",
                      "title": "Do you have upper back pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel12",
                      "visibleIf": "{question14} = \"Yes\"",
                      "elements": [
                        {
                          "type": "rating",
                          "name": "question15",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question16",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel13",
                  "title": "Shoulder(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question17",
                      "title": "Do you have shoulder pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel14",
                      "visibleIf": "{question17} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question18",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "rating",
                          "name": "question19",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question20",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel15",
                  "title": "Hip(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question21",
                      "title": "Do you have hip pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel16",
                      "visibleIf": "{question21} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question22",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "rating",
                          "name": "question23",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question24",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel17",
                  "title": "Arm(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question25",
                      "title": "Do you have arm pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel18",
                      "visibleIf": "{question25} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question26",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "rating",
                          "name": "question27",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question28",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel19",
                  "title": "Leg(s)",
                  "elements": [
                    {
                      "type": "radiogroup",
                      "name": "question29",
                      "title": "Do you have leg pain?",
                      "choices": [
                        "Yes",
                        "No"
                      ],
                      "colCount": 0
                    },
                    {
                      "type": "panel",
                      "name": "panel20",
                      "visibleIf": "{question29} = \"Yes\"",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question30",
                          "title": "Which side(s)?",
                          "choices": [
                            "Left",
                            "Right"
                          ]
                        },
                        {
                          "type": "rating",
                          "name": "question31",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question32",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "panel",
                  "name": "panel21",
                  "title": "Other Area",
                  "elements": [
                    {
                      "type": "text",
                      "name": "question33",
                      "title": "Please specify other pain area (if applicable):"
                    },
                    {
                      "type": "panel",
                      "name": "panel22",
                      "visibleIf": "{question33} notempty",
                      "elements": [
                        {
                          "type": "checkbox",
                          "name": "question34",
                          "title": "Side (if applicable):",
                          "choices": [
                            "Left",
                            "Right",
                            "Central"
                          ]
                        },
                        {
                          "type": "rating",
                          "name": "question35",
                          "title": "Pain Severity (0-10)",
                          "rateCount": 11,
                          "rateMin": 0,
                          "rateMax": 10,
                          "minRateDescription": "No Pain",
                          "maxRateDescription": "Worst Pain"
                        },
                        {
                          "type": "radiogroup",
                          "name": "question36",
                          "title": "Frequency",
                          "choices": [
                            "Occasional (0-25%)",
                            "Intermittent (25-50%)",
                            "Frequent (50-75%)",
                            "Constant (75-100%)"
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel23",
              "title": "Section 2 - Pain Location & Type",
              "description": "Please mark the location of your pain on the body diagram below.",
              "elements": [
                {
                  "type": "bodypaindiagram",
                  "name": "question37",
                  "title": "Click or tap on the body areas where you experience pain"
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "panel27",
          "visibleIf": "{question8} = 'Yes'",
          "title": "Oswestry Low Back Pain Disability Index",
          "description": "Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.",
          "elements": [
            {
              "type": "panel",
              "name": "panel28",
              "elements": [
                {
                  "type": "text",
                  "name": "question58",
                  "title": "Date",
                  "defaultValue": "2025-08-05",
                  "inputType": "date"
                }
              ]
            },
            {
              "type": "panel",
              "name": "panel29",
              "title": "SECTION 1 - Pain Intensity",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question59",
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
              "name": "panel30",
              "title": "SECTION 2 - Personal Care (Washing, Dressing, etc.)",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question60",
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
              "name": "panel31",
              "title": "SECTION 3 - Lifting",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question61",
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
              "name": "panel32",
              "title": "SECTION 4 - Walking",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question62",
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
              "name": "panel33",
              "title": "SECTION 5 - Sitting",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question63",
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
              "name": "panel34",
              "title": "SECTION 6 - Standing",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question64",
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
              "name": "panel35",
              "title": "SECTION 7 - Sleeping",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question65",
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
                      "text": "Because of pain, my normal night's sleep is reduced by less than one quarter."
                    },
                    {
                      "value": 3,
                      "text": "Because of pain, my normal night's sleep is reduced by less than one half."
                    },
                    {
                      "value": 4,
                      "text": "Because of pain, my normal night's sleep is reduced by less than three quarters."
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
              "name": "panel36",
              "title": "SECTION 8 - Social Life",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question66",
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
              "name": "panel37",
              "title": "SECTION 9 - Traveling",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question67",
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
              "name": "panel38",
              "title": "SECTION 10 - Employment/Homemaking",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "question68",
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
              "name": "question69",
              "title": "Additional Comments:"
            },
            {
              "type": "panel",
              "name": "panel39",
              "title": "ODI Score Results",
              "elements": [
                {
                  "type": "expression",
                  "name": "question70",
                  "title": "Total Score:",
                  "expression": "(iif({question59} notempty, {question59}, 0) + iif({question60} notempty, {question60}, 0) + iif({question61} notempty, {question61}, 0) + iif({question62} notempty, {question62}, 0) + iif({question63} notempty, {question63}, 0) + iif({question64} notempty, {question64}, 0) + iif({question65} notempty, {question65}, 0) + iif({question66} notempty, {question66}, 0) + iif({question67} notempty, {question67}, 0) + iif({question68} notempty, {question68}, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question71",
                  "title": "Sections Completed:",
                  "expression": "(iif({question59} notempty, 1, 0) + iif({question60} notempty, 1, 0) + iif({question61} notempty, 1, 0) + iif({question62} notempty, 1, 0) + iif({question63} notempty, 1, 0) + iif({question64} notempty, 1, 0) + iif({question65} notempty, 1, 0) + iif({question66} notempty, 1, 0) + iif({question67} notempty, 1, 0) + iif({question68} notempty, 1, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question72",
                  "title": "Disability Percentage:",
                  "expression": "iif({question71} > 0, round(({question70} / ({question71} * 5)) * 100, 1), 0)",
                  "format": "{0}%",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question73",
                  "title": "Interpretation:",
                  "expression": "iif({question72} <= 20, \"Minimal Disability\", iif({question72} <= 40, \"Moderate Disability\", iif({question72} <= 60, \"Severe Disability\", iif({question72} <= 80, \"Crippled\", \"Bed-bound or Exaggerating\"))))",
                  "displayStyle": "text"
                },
                {
                  "type": "html",
                  "name": "question74",
                  "html": "<div style=\"margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;\"><h4>Score Interpretation Guide:</h4><ul style=\"list-style-type: none; padding-left: 0;\"><li>• <strong>0-20%:</strong> Minimal disability - Can cope with most activities</li><li>• <strong>21-40%:</strong> Moderate disability - More pain and difficulty with sitting, lifting, and standing</li><li>• <strong>41-60%:</strong> Severe disability - Pain is a primary problem, affecting daily life</li><li>• <strong>61-80%:</strong> Crippled - Back pain impinges on all aspects of life</li><li>• <strong>81-100%:</strong> Bed-bound or exaggerating symptoms</li></ul></div>"
                },
                {
                  "type": "signaturepad",
                  "name": "question75",
                  "title": "Patient Signature:"
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "panel24",
          "visibleIf": "{question2} = 'Yes'",
          "title": "Neck Disability Index Questionnaire",
          "description": "Please answer each section by selecting ONLY the ONE CHOICE that most applies to you RIGHT NOW.",
          "elements": [
            {
              "type": "panel",
              "name": "panel25",
              "elements": [
                {
                  "type": "text",
                  "name": "question38",
                  "startWithNewLine": false,
                  "title": "Name"
                },
                {
                  "type": "text",
                  "name": "question39",
                  "startWithNewLine": false,
                  "title": "Date",
                  "defaultValue": "2025-08-05",
                  "inputType": "date"
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "question40",
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
              "name": "question41",
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
              "name": "question42",
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
              "name": "question43",
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
              "name": "question44",
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
              "name": "question45",
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
              "name": "question46",
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
              "name": "question47",
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
              "name": "question48",
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
              "name": "question49",
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
              "name": "question50",
              "title": "Additional Comments:"
            },
            {
              "type": "panel",
              "name": "panel26",
              "title": "NDI Score Results",
              "elements": [
                {
                  "type": "expression",
                  "name": "question51",
                  "title": "Total Score:",
                  "expression": "(iif({question40} notempty, {question40}, 0) + iif({question41} notempty, {question41}, 0) + iif({question42} notempty, {question42}, 0) + iif({question43} notempty, {question43}, 0) + iif({question44} notempty, {question44}, 0) + iif({question45} notempty, {question45}, 0) + iif({question46} notempty, {question46}, 0) + iif({question47} notempty, {question47}, 0) + iif({question48} notempty, {question48}, 0) + iif({question49} notempty, {question49}, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question52",
                  "title": "Sections Completed:",
                  "expression": "(iif({question40} notempty, 1, 0) + iif({question41} notempty, 1, 0) + iif({question42} notempty, 1, 0) + iif({question43} notempty, 1, 0) + iif({question44} notempty, 1, 0) + iif({question45} notempty, 1, 0) + iif({question46} notempty, 1, 0) + iif({question47} notempty, 1, 0) + iif({question48} notempty, 1, 0) + iif({question49} notempty, 1, 0))",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question53",
                  "title": "Disability Percentage:",
                  "expression": "iif({question52} > 0, round(({question51} / ({question52} * 5)) * 100, 1), 0)",
                  "format": "{0}%",
                  "displayStyle": "decimal"
                },
                {
                  "type": "expression",
                  "name": "question54",
                  "title": "Interpretation:",
                  "expression": "iif({question53} <= 8, \"No Disability\", iif({question53} <= 28, \"Mild Disability\", iif({question53} <= 48, \"Moderate Disability\", iif({question53} <= 68, \"Severe Disability\", \"Complete Disability\"))))",
                  "displayStyle": "text"
                },
                {
                  "type": "html",
                  "name": "question55",
                  "html": "<div style=\"margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;\"><h4>NDI Score Interpretation Guide:</h4><ul style=\"list-style-type: none; padding-left: 0;\"><li>• <strong>0-8%:</strong> No disability - Patients can cope with most living activities</li><li>• <strong>10-28%:</strong> Mild disability - Pain and difficulty with sitting, lifting, and standing. Travel and social life are more difficult</li><li>• <strong>30-48%:</strong> Moderate disability - Pain is the main problem. Patients experience more problems with sitting, standing, and traveling</li><li>• <strong>50-68%:</strong> Severe disability - Pain impairs all aspects of life. Positive intervention is required</li><li>• <strong>70-100%:</strong> Complete disability - Patients are either bed-bound or exaggerating their symptoms</li></ul><p style=\"margin-top: 10px; font-size: 0.9em; color: #666;\">Reference: Vernon, Mior. JMPT 1991; 14(7): 409-15</p></div>"
                },
                {
                  "type": "signaturepad",
                  "name": "question56",
                  "title": "Patient Signature:"
                }
              ]
            }
          ]
        },
        {
          "type": "panel",
          "name": "condition_details_panel",
          "title": "Condition Details",
          "elements": [
            {
              "type": "comment",
              "name": "previous_treatments",
              "title": "What Treatments have you had for this condition?"
            },
            {
              "type": "comment",
              "name": "condition_better",
              "title": "What makes your condition BETTER?"
            },
            {
              "type": "comment",
              "name": "condition_worse",
              "title": "What makes your condition WORSE?"
            },
            {
              "type": "radiogroup",
              "name": "pain_radiates",
              "title": "Does the pain/numbness RADIATE?",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "pain_radiates_explain",
              "visibleIf": "{pain_radiates} = 'Yes'",
              "startWithNewLine": false,
              "title": "Explain:"
            },
            {
              "type": "text",
              "name": "when_better",
              "title": "When is your condition BETTER?"
            },
            {
              "type": "text",
              "name": "when_worse",
              "startWithNewLine": false,
              "title": "When is your condition WORSE?"
            },
            {
              "type": "checkbox",
              "name": "when_worse_allday",
              "startWithNewLine": false,
              "choices": [
                "Same all day"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "condition_interferes_with",
              "title": "Does your condition interfere with any of the following:",
              "choices": [
                "Work",
                "Sleep",
                "Recreation",
                "Social life",
                "Family life",
                "Sex life"
              ],
              "colCount": 0
            },
            {
              "type": "radiogroup",
              "name": "had_condition_before",
              "title": "Have you had this condition before?",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "had_condition_before_explain",
              "visibleIf": "{had_condition_before} = 'Yes'",
              "startWithNewLine": false,
              "title": "Explain:"
            },
            {
              "type": "text",
              "name": "last_chiro_treatment_date",
              "title": "Date of last Chiropractic treatment?",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "previous_chiropractor_name",
              "startWithNewLine": false,
              "title": "Name of previous chiropractor?"
            }
          ]
        }
      ]
    },
    {
      "name": "page_history",
      "title": "Medical, Family & Social History",
      "elements": [
        {
          "type": "panel",
          "name": "medical_history_panel",
          "title": "MEDICAL HISTORY",
          "description": "Describe any of the following. Provide approximate dates.",
          "elements": [
            {
              "type": "comment",
              "name": "med_history_infections",
              "title": "Infections:"
            },
            {
              "type": "comment",
              "name": "med_history_major_trauma",
              "startWithNewLine": false,
              "title": "Major Trauma:"
            },
            {
              "type": "comment",
              "name": "med_history_hospitalizations",
              "title": "Hospitalizations:"
            },
            {
              "type": "comment",
              "name": "med_history_spinal_neck_injuries",
              "startWithNewLine": false,
              "title": "Spinal or neck injuries:"
            },
            {
              "type": "comment",
              "name": "med_history_auto_accidents",
              "title": "Automobile/Motorcycle accidents:"
            },
            {
              "type": "comment",
              "name": "med_history_falls",
              "startWithNewLine": false,
              "title": "Falls or other injuries:"
            },
            {
              "type": "comment",
              "name": "med_history_other_injuries",
              "title": "Other injuries:"
            },
            {
              "type": "comment",
              "name": "med_history_surgeries",
              "title": "Surgeries:"
            },
            {
              "type": "radiogroup",
              "name": "med_history_allergies",
              "title": "Allergies?",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "comment",
              "name": "med_history_allergies_explain",
              "visibleIf": "{med_history_allergies} = 'Yes'",
              "startWithNewLine": false,
              "title": "Explain:"
            }
          ]
        },
        {
          "type": "panel",
          "name": "family_history_panel",
          "title": "FAMILY MEDICAL HISTORY",
          "description": "Describe any medical issues in your family. Provide approximate dates.",
          "elements": [
            {
              "type": "checkbox",
              "name": "family_history_adopted",
              "titleLocation": "hidden",
              "choices": [
                "Adopted/Unknown"
              ],
              "colCount": 0
            },
            {
              "type": "comment",
              "name": "family_history_mother",
              "title": "Mother:"
            },
            {
              "type": "comment",
              "name": "family_history_father",
              "startWithNewLine": false,
              "title": "Father:"
            },
            {
              "type": "comment",
              "name": "family_history_sisters",
              "title": "Sister(s):"
            },
            {
              "type": "comment",
              "name": "family_history_brothers",
              "startWithNewLine": false,
              "title": "Brother(s):"
            },
            {
              "type": "comment",
              "name": "family_history_maternal_grandmother",
              "title": "Maternal Grandmother:"
            },
            {
              "type": "comment",
              "name": "family_history_paternal_grandmother",
              "startWithNewLine": false,
              "title": "Paternal Grandmother:"
            },
            {
              "type": "comment",
              "name": "family_history_maternal_grandfather",
              "title": "Maternal Grandfather:"
            },
            {
              "type": "comment",
              "name": "family_history_paternal_grandfather",
              "startWithNewLine": false,
              "title": "Paternal Grandfather:"
            }
          ]
        },
        {
          "type": "panel",
          "name": "social_history_panel",
          "title": "SOCIAL HISTORY",
          "elements": [
            {
              "type": "radiogroup",
              "name": "social_history_tobacco",
              "title": "Tobacco Use:",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "social_history_tobacco_type",
              "visibleIf": "{social_history_tobacco} = 'Yes'",
              "startWithNewLine": false,
              "title": "Type:",
              "choices": [
                "Cigarettes/Cigars",
                "Chewing Tobacco"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "social_history_tobacco_amount",
              "visibleIf": "{social_history_tobacco} = 'Yes'",
              "startWithNewLine": false,
              "title": "Pack(s)/day:"
            },
            {
              "type": "text",
              "name": "social_history_tobacco_start",
              "visibleIf": "{social_history_tobacco} = 'Yes'",
              "startWithNewLine": false,
              "title": "Start Date:",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "social_history_tobacco_end",
              "visibleIf": "{social_history_tobacco} = 'Yes'",
              "startWithNewLine": false,
              "title": "End Date:",
              "inputType": "date"
            },
            {
              "type": "radiogroup",
              "name": "social_history_alcohol",
              "title": "Alcohol Use:",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "social_history_alcohol_amount",
              "visibleIf": "{social_history_alcohol} = 'Yes'",
              "startWithNewLine": false,
              "title": "Drinks/week:",
              "inputType": "number"
            },
            {
              "type": "radiogroup",
              "name": "social_history_recreational_drugs",
              "title": "Recreational Drug Use:",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "comment",
              "name": "social_history_recreational_drugs_explain",
              "visibleIf": "{social_history_recreational_drugs} = 'Yes'",
              "startWithNewLine": false,
              "title": "Explain:"
            },
            {
              "type": "text",
              "name": "social_history_water_intake",
              "title": "Daily Water Intake:"
            }
          ]
        },
        {
          "type": "panel",
          "name": "medications_panel",
          "title": "Medications & Supplements",
          "elements": [
            {
              "type": "paneldynamic",
              "name": "medications_list",
              "title": "LIST ALL MEDICATIONS and NUTRITIONAL SUPPLEMENTS",
              "templateElements": [
                {
                  "type": "text",
                  "name": "medication_name",
                  "title": "Medication/Supplement Name"
                },
                {
                  "type": "text",
                  "name": "medication_reason",
                  "startWithNewLine": false,
                  "title": "Reason for Taking"
                }
              ],
              "panelCount": 1,
              "addPanelText": "Add another medication/supplement"
            },
            {
              "type": "radiogroup",
              "name": "drug_allergies",
              "title": "Drug Allergies/Interactions?",
              "choices": [
                "Yes",
                "No"
              ],
              "colCount": 0
            },
            {
              "type": "comment",
              "name": "drug_allergies_explain",
              "visibleIf": "{drug_allergies} = 'Yes'",
              "startWithNewLine": false,
              "title": "Explain:"
            }
          ]
        }
      ]
    },
    {
      "name": "page_review_of_systems",
      "title": "Review of Systems",
      "description": "Select the following conditions that apply to you. Please circle any current conditions.",
      "elements": [
        {
          "type": "panel",
          "name": "ros_general",
          "title": "General",
          "elements": [
            {
              "type": "checkbox",
              "name": "ros_constitutional",
              "title": "Constitutional",
              "choices": [
                "Balance issues",
                "Cancer",
                "Changes in appetite",
                "Changes in sleep",
                "Changes in weight",
                "Chills",
                "Dizziness",
                "Fatigue",
                "Fever",
                "Hyperactivity",
                "Tumor",
                "Vertigo"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_gastrointestinal",
              "startWithNewLine": false,
              "title": "Gastrointestinal (GI)",
              "choices": [
                "Acid reflux",
                "Belching or gas",
                "Celiac Disease",
                "Colon issues",
                "Constipation",
                "Crohn's Disease",
                "Diarrhea",
                "Gall bladder issues",
                "Heartburn",
                "Hemorrhoids",
                "Hiatal hernia",
                "Jaundice",
                "Liver issues",
                "Nausea",
                "Spitting up blood",
                "Stomach aches",
                "Stomach ulcers",
                "Vomiting"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_musculoskeletal",
              "title": "Musculoskeletal",
              "choices": [
                "Arm pain",
                "Arthritis",
                "Broken bones",
                "Bursitis",
                "Elbow pain",
                "Foot pain",
                "Hip pain",
                "Knee pain",
                "Leg pain",
                "Low backache",
                "Muscle atrophy",
                "Pain btwn shoulders",
                "Painful tailbone",
                "Plantar Fasciitis",
                "Rib Pain",
                "Scoliosis",
                "Shoulder pain",
                "Spinal curvature",
                "Sprained ankle",
                "Weakness in arms",
                "Weakness in legs",
                "Wrist pain"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_endocrine",
              "startWithNewLine": false,
              "title": "Endocrine",
              "choices": [
                "Diabetes Type: I",
                "Diabetes Type: II",
                "Enlarged Glands",
                "Frequent urination",
                "Gout",
                "Hypoglycemia",
                "Swollen joints",
                "Thyroid issues"
              ],
              "colCount": 0
            }
          ]
        },
        {
          "type": "panel",
          "name": "ros_systems_2",
          "title": "Systems (continued)",
          "elements": [
            {
              "type": "checkbox",
              "name": "ros_cardiovascular",
              "title": "Cardiovascular",
              "choices": [
                "Angina/Chest pain",
                "Atrial fibrillation (AFib)",
                "DVT or Blood Clot",
                "Embolism",
                "Fainting",
                "Hardening of arteries",
                "Heart attack",
                "Heart disease",
                "High blood pressure",
                "Low blood pressure",
                "Poor circulation",
                "Rapid heart beat",
                "Slow heart beat",
                "Stroke",
                "Swollen ankles",
                "Varicose veins"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_integumentary",
              "startWithNewLine": false,
              "title": "Integumentary/Skin",
              "choices": [
                "Bruise easily",
                "Eczema/Hives",
                "Hair/Nail Changes",
                "Itching (Pruritis)",
                "Moles (Irregular)",
                "Psoriasis",
                "Rashes",
                "Scaling",
                "Skin cancer"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_hematological",
              "title": "Hematological/Lymphatic",
              "choices": [
                "Anemia",
                "Blood disorder",
                "HIV/AIDS"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_allergy",
              "startWithNewLine": false,
              "title": "Allergy/Immunologic",
              "choices": [
                "Seasonal Allergies",
                "Food Allergy/Intolerance",
                "Rheumatic fever",
                "Tuberculosis"
              ],
              "colCount": 0
            }
          ]
        },
        {
          "type": "panel",
          "name": "ros_systems_3",
          "title": "Systems (continued)",
          "elements": [
            {
              "type": "checkbox",
              "name": "ros_respiratory",
              "title": "Respiratory",
              "choices": [
                "Asthma",
                "Bronchitis",
                "Chronic cough",
                "COPD",
                "Difficulty breathing",
                "Emphysema",
                "Shortness of breath",
                "Sleep apnea"
              ],
              "colCount": 0
            },
            {
              "type": "text",
              "name": "ros_cpap",
              "visibleIf": "{ros_respiratory} contains 'Sleep apnea'",
              "startWithNewLine": false,
              "title": "CPAP details"
            },
            {
              "type": "checkbox",
              "name": "ros_genitourinary",
              "startWithNewLine": false,
              "title": "Genitourinary (GU)",
              "choices": [
                "Bed-wetting",
                "Bladder infection",
                "Blood in urine",
                "Kidney infection",
                "Kidney stone",
                "Painful urination",
                "Poor urine control",
                "Urinary Tract Infection"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_neurological",
              "title": "Neurological",
              "choices": [
                "Burning sensations",
                "Convulsions",
                "Numbness in arm/hand",
                "Numbness in leg/foot",
                "Pins/Needles/Tingling",
                "Restless Leg Synd. (RLS)",
                "Sciatica",
                "Seizures"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_eent",
              "startWithNewLine": false,
              "title": "EEMNT",
              "choices": [
                "Dental issues",
                "Difficulty swallowing",
                "Ear infection(s)",
                "Hearing issues",
                "Nasal congestion",
                "Nosebleeds",
                "Ringing in ears",
                "Sinus infection",
                "Sore throat",
                "TMJ pain",
                "Vision issues"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_vision_corrected",
              "visibleIf": "{ros_eent} contains 'Vision issues'",
              "startWithNewLine": false,
              "titleLocation": "hidden",
              "choices": [
                "corrected"
              ],
              "colCount": 0
            }
          ]
        },
        {
          "type": "panel",
          "name": "ros_systems_4",
          "title": "Systems (continued)",
          "elements": [
            {
              "type": "checkbox",
              "name": "ros_psychiatric",
              "title": "Psychiatric",
              "choices": [
                "ADHD/ADD",
                "Anxiety",
                "Dementia",
                "Depression",
                "Nervousness",
                "Paranoia",
                "PTSD",
                "Stress/Tension"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_headneck",
              "startWithNewLine": false,
              "title": "Head/Neck",
              "choices": [
                "Headaches",
                "Migraines",
                "Painful neck",
                "Stiff neck"
              ],
              "colCount": 0
            },
            {
              "type": "checkbox",
              "name": "ros_migraines_aura",
              "visibleIf": "{ros_headneck} contains 'Migraines'",
              "startWithNewLine": false,
              "titleLocation": "hidden",
              "choices": [
                "w/ Aura"
              ],
              "colCount": 0
            }
          ]
        },
        {
          "type": "panel",
          "name": "ros_gender_specific",
          "title": "Gender Specific",
          "elements": [
            {
              "type": "panel",
              "name": "ros_women_only",
              "visibleIf": "{patient_demographics_data.sex} = 'Female'",
              "title": "For Women Only",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "ros_women_symptoms",
                  "title": "Symptoms",
                  "choices": [
                    "Breast lumps or pain",
                    "Irregular cycle",
                    "Menopausal symptoms",
                    "Menstrual cramps",
                    "Painful intercourse",
                    "PCOS",
                    "Premenstrual tension",
                    "Unable to get pregnant"
                  ],
                  "colCount": 0
                },
                {
                  "type": "text",
                  "name": "ros_women_hysterectomy_date",
                  "title": "Hysterectomy Date:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_women_tubal_ligation_date",
                  "title": "Tubal ligation Date:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_women_breast_aug",
                  "title": "Breast Augmentation"
                },
                {
                  "type": "text",
                  "name": "ros_women_breast_reduc",
                  "title": "Breast Reduction"
                },
                {
                  "type": "text",
                  "name": "ros_women_last_breast_exam",
                  "title": "Last Breast Exam:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_women_last_pap_smear",
                  "title": "Last Pap Smear:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_women_last_menstrual",
                  "title": "Last Menstrual Period:",
                  "inputType": "date"
                },
                {
                  "type": "radiogroup",
                  "name": "ros_women_regular_checkups",
                  "title": "Regular Checkups?",
                  "choices": [
                    "Yes",
                    "No"
                  ],
                  "colCount": 0
                },
                {
                  "type": "radiogroup",
                  "name": "ros_women_pregnant",
                  "title": "Are you Pregnant?",
                  "choices": [
                    "Yes",
                    "No"
                  ],
                  "colCount": 0
                }
              ]
            },
            {
              "type": "panel",
              "name": "ros_men_only",
              "visibleIf": "{patient_demographics_data.sex} = 'Male'",
              "title": "For Men Only",
              "elements": [
                {
                  "type": "checkbox",
                  "name": "ros_men_symptoms",
                  "title": "Symptoms",
                  "choices": [
                    "Breast lumps or pain",
                    "Changes in bathroom habits",
                    "Erectile dysfunction (ED)",
                    "Low T, Testosterone",
                    "Painful intercourse",
                    "Prostate issues",
                    "Testicular issues"
                  ],
                  "colCount": 0
                },
                {
                  "type": "text",
                  "name": "ros_men_vasectomy_date",
                  "title": "Vasectomy Date:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_men_last_prostate_exam",
                  "title": "Last Prostate Exam:",
                  "inputType": "date"
                },
                {
                  "type": "text",
                  "name": "ros_men_last_testicular_exam",
                  "title": "Last Testicular Exam:",
                  "inputType": "date"
                },
                {
                  "type": "radiogroup",
                  "name": "ros_men_regular_checkups",
                  "title": "Regular Checkups?",
                  "choices": [
                    "Yes",
                    "No"
                  ],
                  "colCount": 0
                }
              ]
            }
          ]
        },
        {
          "type": "comment",
          "name": "ros_other_conditions",
          "title": "List any other conditions"
        }
      ]
    },
    {
      "name": "page_final_acknowledgement",
      "title": "Final Acknowledgement",
      "elements": [
        {
          "type": "panel",
          "name": "phi_acknowledgement_panel",
          "title": "CONFIDENTIAL PROTECTED HEALTH INFORMATION (PHI)",
          "elements": [
            {
              "type": "checkbox",
              "name": "phi_acknowledgement_box",
              "title": "Acknowledgement",
              "isRequired": true,
              "choices": [
                {
                  "value": "accepted",
                  "text": "I acknowledge that the health history and demographics above are complete and accurate, and that if any changes in my health or demographics occur, I will discuss these changes with the Doctors at JayMac Chiropractic."
                }
              ],
              "colCount": 0
            },
            {
              "type": "signaturepad",
              "name": "phi_patient_signature",
              "title": "Patient Signature or Parent/Guardian (if a minor)",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "phi_patient_date",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "signaturepad",
              "name": "phi_doctor_signature",
              "title": "Signature of Doctor"
            },
            {
              "type": "text",
              "name": "phi_doctor_date",
              "startWithNewLine": false,
              "title": "Date",
              "inputType": "date"
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