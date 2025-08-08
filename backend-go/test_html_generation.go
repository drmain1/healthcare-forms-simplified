package main

import (
	"fmt"
	"os"

	services "github.com/gemini/forms-api/internal/services"
)

func main() {
	// Sample answers for the form
	answers := map[string]interface{}{
		"first_name":   "John",
		"last_name":    "Doe",
		"date_of_birth": "1990-01-01",
		"sex_at_birth":  "Male",
		"street_address": "123 Main St",
		"city":         "Anytown",
		"state":        "CA",
		"zip_code":     "12345",
		"phone_number": "555-123-4567",
		"email":        "john.doe@example.com",
	}

	// The full, correct JSON, as a string literal
	formJSON := `{
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
	          "layoutColumns": 2,
	          "elements": [
	            {
	              "type": "html",
	              "name": "demographics_header",
	              "html": "<h3 style=\"margin-bottom: 20px; color: #333;\">Patient Information</h3>",
	              "colSpan": 2
	            },
	            {
	              "type": "text",
	              "name": "form_date",
	              "title": "Today's Date",
	              "defaultValue": "2025-08-05",
	              "readOnly": true,
	              "inputType": "date",
	              "colSpan": 2
	            },
	            {
	              "type": "text",
	              "name": "first_name",
	              "title": "First Name",
	              "isRequired": true
	            },
	            {
	              "type": "text",
	              "name": "last_name",
	              "title": "Last Name",
	              "isRequired": true
	            },
	            {
	              "type": "dateofbirth",
	              "name": "date_of_birth",
	              "title": "Date of Birth",
	              "isRequired": true
	            },
	            {
	              "type": "dropdown",
	              "name": "sex_at_birth",
	              "title": "Sex Assigned at Birth",
	              "isRequired": true,
	              "choices": [
	                { "value": "male", "text": "Male" },
	                { "value": "female", "text": "Female" },
	                { "value": "other", "text": "Other" }
	              ]
	            },
	            {
	              "type": "text",
	              "name": "street_address",
	              "title": "Street Address",
	              "isRequired": true,
	              "colSpan": 2
	            },
	            {
	              "type": "panel",
	              "name": "address_line_2",
	              "layoutColumns": 3,
	              "colSpan": 2,
	              "elements": [
	                {
	                  "type": "text",
	                  "name": "city",
	                  "title": "City",
	                  "isRequired": true
	                },
	                {
	                  "type": "dropdown",
	                  "name": "state",
	                  "title": "State",
	                  "isRequired": true,
	                  "choices": [
	                    { "value": "CA", "text": "California" },
	                    { "value": "NY", "text": "New York" }
	                  ]
	                },
	                {
	                  "type": "text",
	                  "name": "zip_code",
	                  "title": "ZIP Code",
	                  "isRequired": true
	                }
	              ]
	            },
	            {
	              "type": "text",
	              "name": "phone_number",
	              "title": "Primary Phone Number",
	              "isRequired": true,
	              "inputType": "tel"
	            },
	            {
	              "type": "text",
	              "name": "secondary_phone",
	              "title": "Secondary Phone Number (Optional)",
	              "inputType": "tel"
	            },
	            {
	              "type": "text",
	              "name": "email",
	              "title": "Email Address",
	              "colSpan": 2,
	              "inputType": "email"
	            }
	          ]
	        },
	        {
	          "type": "panel",
	          "name": "additional_patient_info_panel",
	          "title": "Additional Information",
	          "elements": []
	        }
	      ]
	    },
	    {
	      "name": "page_consent_and_policies",
	      "title": "Consent & Policies",
	      "elements": []
	    }
	  ]
	}`

	// Generate the HTML
	html, err := services.GenerateDynamicHTML(formJSON, answers, nil)
	if err != nil {
		fmt.Printf("Error generating HTML: %v\n", err)
		os.Exit(1)
	}

	// Print the generated HTML
	fmt.Println(html)
}