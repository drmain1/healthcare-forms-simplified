{
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