package api

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/vertexai/genai"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/pdf"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CreateForm creates a new form.
func CreateForm(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var form data.Form
		if err := c.ShouldBindJSON(&form); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userID, _ := c.Get("userID")
		orgID, _ := c.Get("organizationID")

		now := time.Now().UTC()
		form.CreatedAt = now
		form.UpdatedAt = now
		form.CreatedBy = userID.(string)
		form.UpdatedBy = userID.(string)
		form.OrganizationID = orgID.(string)

		docRef, _, err := client.Collection("forms").Add(c.Request.Context(), form)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create form"})
			return
		}

		form.ID = docRef.ID
		c.JSON(http.StatusCreated, form)
	}
}

// GetForm retrieves a form by its ID, ensuring it belongs to the correct organization.
func GetForm(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		doc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			if status.Code(err) == codes.NotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve form"})
			return
		}

		var form data.Form
		if err := doc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}

		if form.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this form"})
			return
		}

		form.ID = doc.Ref.ID
		c.JSON(http.StatusOK, form)
	}
}

// ListForms lists all forms for the authenticated user's organization.
func ListForms(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID, _ := c.Get("organizationID")

		var forms []data.Form
		iter := client.Collection("forms").Where("organizationId", "==", orgID.(string)).Documents(c.Request.Context())
		for {
			doc, err := iter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list forms"})
				return
			}

			var form data.Form
			if err := doc.DataTo(&form); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
				return
			}
			form.ID = doc.Ref.ID
			forms = append(forms, form)
		}

		c.JSON(http.StatusOK, gin.H{"results": forms})
	}
}

// UpdateForm updates an existing form, ensuring it belongs to the correct organization.
func UpdateForm(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		orgID, _ := c.Get("organizationID")
		userID, _ := c.Get("userID")

		// First, verify the form belongs to the organization
		doc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			if status.Code(err) == codes.NotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve form"})
			return
		}
		var form data.Form
		if err := doc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}
		if form.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to update this form"})
			return
		}

		var updates map[string]interface{}
		if err := c.ShouldBindJSON(&updates); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updates["updatedAt"] = time.Now().UTC()
		updates["updatedBy"] = userID.(string)

		_, err = client.Collection("forms").Doc(formID).Set(c.Request.Context(), updates, firestore.MergeAll)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update form"})
			return
		}

		// Retrieve the updated form to return it
		updatedDoc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve updated form"})
			return
		}

		var updatedForm data.Form
		if err := updatedDoc.DataTo(&updatedForm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse updated form data"})
			return
		}
		updatedForm.ID = updatedDoc.Ref.ID

		c.JSON(http.StatusOK, updatedForm)
	}
}

// DeleteForm deletes a form by its ID, ensuring it belongs to the correct organization.
func DeleteForm(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		// First, verify the form belongs to the organization
		doc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			if status.Code(err) == codes.NotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve form"})
			return
		}
		var form data.Form
		if err := doc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}
		if form.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete this form"})
			return
		}

		_, err = client.Collection("forms").Doc(formID).Delete(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete form"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// GeneratePDF generates a PDF for a form response, ensuring it belongs to the correct organization.
func GeneratePDF(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		responseID := c.Param("responseId")
		orgID, _ := c.Get("organizationID")

		// Get form and verify ownership
		formDoc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
			return
		}
		var form data.Form
		if err := formDoc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}
		if form.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this form"})
			return
		}

		// Get response and verify ownership
		responseDoc, err := client.Collection("form_responses").Doc(responseID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "response not found"})
			return
		}
		var response data.FormResponse
		if err := responseDoc.DataTo(&response); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse response data"})
			return
		}
		if response.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this response"})
			return
		}

		// Get organization details for the header
		orgDoc, err := client.Collection("organizations").Doc(orgID.(string)).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve organization details"})
			return
		}
		var organization data.Organization
		if err := orgDoc.DataTo(&organization); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse organization data"})
			return
		}

		// Log the organization data to debug
		log.Printf("Organization data for PDF generation: %+v", organization)
		htmlTemplate, err := template.ParseFiles("templates/form_response_professional.html")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse email template"})
			return
		}

		// Create a buffer to store the executed template
		var tpl bytes.Buffer
		if err := htmlTemplate.Execute(&tpl, gin.H{
			"Title":          form.Title,
			"PatientName":    response.PatientName,
			"SubmissionDate": response.SubmittedAt.Format("January 2, 2006"),
			"Data":           response.Data,
			"CurrentDate":    time.Now().Format("January 2, 2006"),
			"Organization":   organization,
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to execute email template"})
			return
		}

		// Generate the PDF from the HTML
		pdfBytes, err := pdf.GenerateFromHTML(c.Request.Context(), tpl.String())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate PDF"})
			return
		}

		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// GenerateBlankPDF generates a blank PDF for a given form, ensuring it belongs to the correct organization.
func GenerateBlankPDF(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		formDoc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
			return
		}
		var form data.Form
		if err := formDoc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}

		if form.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this form"})
			return
		}

		pdfBytes, err := pdf.GenerateFromTemplate(c.Request.Context(), "templates/blank_form.html", gin.H{
			"Title":       form.Title,
			"CurrentDate": time.Now().Format("January 2, 2006"),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate blank PDF"})
			return
		}

		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// ProcessPDFWithVertex processes a PDF with Vertex AI to extract form fields.
func ProcessPDFWithVertex(genaiClient *genai.GenerativeModel) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("Starting PDF processing")
		var requestBody struct {
			PdfData string `json:"pdf_data"`
		}
		if err := c.ShouldBindJSON(&requestBody); err != nil {
			log.Printf("Error binding JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		log.Println("Decoding PDF data")
		pdfBytes, err := base64.StdEncoding.DecodeString(requestBody.PdfData)
		log.Printf("Decoded PDF data size: %d bytes", len(pdfBytes))
		if err != nil {
			log.Printf("Error decoding base64: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid base64 encoding for PDF"})
			return
		}

		log.Println("Generating content with Vertex AI")
		prompt := genai.Text(getComprehensivePrompt())
		pdfPart := genai.Blob{MIMEType: "application/pdf", Data: pdfBytes}

		// Configure generation with proper settings
		genaiClient.SetTemperature(0.1)
		genaiClient.SetMaxOutputTokens(40000)
		
		resp, err := genaiClient.GenerateContent(c, pdfPart, prompt)
		if err != nil {
			log.Printf("Error from Vertex AI: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process PDF with Vertex AI"})
			return
		}

		log.Println("Successfully received response from Vertex AI")
		if resp == nil || resp.Candidates == nil || len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || resp.Candidates[0].Content.Parts == nil || len(resp.Candidates[0].Content.Parts) == 0 {
			log.Println("Invalid response from Vertex AI: empty or malformed")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response from Vertex AI"})
			return
		}

		log.Printf("Vertex AI response part: %v", resp.Candidates[0].Content.Parts[0])

		// Extract and parse the JSON response
		part := resp.Candidates[0].Content.Parts[0]
		var rawText string
		if txt, ok := part.(genai.Text); ok {
			rawText = string(txt)
		} else {
			log.Printf("Invalid response part type from Vertex AI: %T", part)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response part type from Vertex AI"})
			return
		}

		

		// Clean and extract JSON from response
		jsonString := extractJSONFromResponse(rawText)
		if jsonString == "" {
			log.Printf("No JSON found in response. First 200 chars: %s", rawText[:min(200, len(rawText))])
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No valid JSON found in AI response"})
			return
		}

		log.Printf("Extracted JSON string length: %d", len(jsonString))
		log.Printf("JSON string (first 200 chars): %s", jsonString[:min(200, len(jsonString))])

		// Parse the JSON
		var surveyJSON map[string]interface{}
		if err := json.Unmarshal([]byte(jsonString), &surveyJSON); err != nil {
			log.Printf("JSON parsing error: %v", err)
			// Try to fix common JSON errors
			fixedJSON := fixCommonJSONErrors(jsonString)
			if err := json.Unmarshal([]byte(fixedJSON), &surveyJSON); err != nil {
				log.Printf("Failed to parse even after fixes: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse JSON from Vertex AI"})
				return
			}
			log.Println("Successfully parsed JSON after applying fixes")
		}

		// Optimize form for mobile
		surveyJSON = optimizeFormForMobile(surveyJSON)

		c.JSON(http.StatusOK, surveyJSON)
	}
}

// getComprehensivePrompt returns the full prompt for Vertex AI
func getComprehensivePrompt() string {
	return `You are a hyper-specialized AI system, an expert architect of digital medical forms. Your sole purpose is to meticulously analyze unstructured source material (text, PDF content) and transform it into a single, complete, and perfectly valid SurveyJS JSON object.

## CRITICAL: Your response must be ONLY valid JSON

1. Start your response with { and end with }
2. DO NOT wrap the JSON in markdown code blocks (no ` + "```" + ` or ` + "```json" + `)
3. DO NOT include any text before or after the JSON
4. EVERY property must end with a comma except the last one
5. VERIFY the JSON is valid before responding

## Golden Rule: The Output is ALWAYS a Single JSON Object

Your entire response must be a single, valid JSON object. Do not output any commentary, explanations, apologies, or any text whatsoever outside of the final JSON structure.

---

## I. The Root JSON Schema (Non-Negotiable)

Every JSON object you generate must start with this exact root structure and properties. This is a mandatory requirement.

{
  "title": "Form Title From Source",
  "description": "Optional: A brief description of the form's purpose.",
  "widthMode": "responsive",
  "progressBarLocation": "bottom",
  "showQuestionNumbers": "off",
  "showProgressBar": "bottom",
  "questionsOrder": "initial",
  "pages": [
    // All form content goes here, organized into pages and panels.
  ]
}

---

## II. Core Architectural Principles

1.  **Absolute Completeness:** You must capture every single question, label, checkbox, input field, and choice option from the source. Nothing may be omitted.
2.  **Logical Structure:** Use ` + "`panel`" + ` elements to group related fields into the visual sections seen in the original form (e.g., "Patient Information," "Medical History"). For long forms, distribute these panels across multiple ` + "`pages`" + `.
3.  **Conditional Logic is Paramount (` + "`visibleIf`" + `):** This is your most critical function. You must actively scan the text for relationships between questions to implement ` + "`visibleIf`" + ` expressions.
    *   **Keywords:** Hunt for phrases like "If yes, please explain...", "If checked, provide details...", "If other, specify...".
    *   **Gating Questions:** A "Yes/No" ` + "`radiogroup`" + ` is a primary trigger. The question that follows it should be made visible based on its answer.
    *   **Example:**
        *   Source Text: ` + "`Do you have any known allergies? [ ] Yes [ ] No. If yes, please list them: __________`" + `
        *   Correct JSON:
            ` + "```json" + `
            {
              "type": "radiogroup",
              "name": "has_allergies",
              "title": "Do you have any known allergies?",
              "choices": ["Yes", "No"],
              "isRequired": true
            },
            {
              "type": "comment",
              "name": "allergy_details",
              "title": "Please list your allergies",
              "visibleIf": "{has_allergies} = 'Yes'",
              "isRequired": true
            }
            ` + "```" + `

---

## III. Master Component Blueprint (Exact JSON Structures)

You must use the following precise JSON structures when you identify these field types. Do not improvise.

| If the form mentions... | Use this SurveyJS type... | **Exact JSON Snippet to Use** |
| :--- | :--- | :--- |
| **Date of Birth, DOB, Birth Date** | ` + "`dateofbirth`" + ` | ` + "`{\"type\": \"dateofbirth\", \"name\": \"patient_dob\", \"title\": \"Date of Birth\", \"isRequired\": true, \"ageFieldName\": \"patient_age\"}`" + ` |
| **Patient Height** | ` + "`heightslider`" + ` | ` + "`{\"type\": \"heightslider\", \"name\": \"patient_height\", \"title\": \"Height\", \"defaultValue\": 66}`" + ` |
| **Patient Weight** | ` + "`weightslider`" + ` | ` + "`{\"type\": \"weightslider\", \"name\": \"patient_weight\", \"title\": \"Weight\", \"defaultValue\": 150}`" + ` |
| **Body Pain Diagram/Marking**| ` + "`bodypaindiagram`" + ` | ` + "`{\"type\": \"bodypaindiagram\", \"name\": \"pain_location_diagram\", \"title\": \"Please mark the areas where you experience pain\"}`" + ` |
| **Upload Photo ID** | ` + "`file`" + ` | ` + "`{\"type\": \"file\", \"name\": \"photo_id\", \"title\": \"Upload Photo ID\", \"acceptedTypes\": \"image/*\", \"storeDataAsText\": false, \"allowMultiple\": false, \"maxSize\": 10485760, \"sourceType\": \"camera,file-picker\"}`" + ` |
| **Signature Line** | ` + "`signaturepad`" + ` | ` + "`{\"type\": \"signaturepad\", \"name\": \"terms_signature\", \"title\": \"Electronic Signature\", \"isRequired\": true}`" + ` |
| **Simple Text Entry** | ` + "`text`" + ` | ` + "`{\"type\": \"text\", \"name\": \"field_name\", \"title\": \"Field Title\"}`" + ` (Add ` + "`inputType`" + ` for "email", "tel") |
| **Large Text Area** | ` + "`comment`" + ` | ` + "`{\"type\": \"comment\", \"name\": \"explanation_field\", \"title\": \"Please explain\"}`" + ` |
| **Single Choice (Yes/No)** | ` + "`radiogroup`" + ` | ` + "`{\"type\": \"radiogroup\", \"name\": \"question_name\", \"title\": \"Question Title?\", \"choices\": [\"Yes\", \"No\"], \"colCount\": 0}`" + ` |
| **Multiple Choices** | ` + "`checkbox`" + ` | ` + "`{\"type\": \"checkbox\", \"name\": \"symptoms\", \"title\": \"Check all that apply\", \"choices\": [\"Option 1\", \"Option 2\"], \"colCount\": 0}`" + ` |

---

## IV. Advanced Workflow Directives

These multi-step workflows require precise execution.

### A. The Patient Demographics Workflow (Highest Priority)

**Trigger:** You MUST activate this workflow if you detect **ANY** of the following common patient information fields. This rule supersedes all other rules for these specific fields.
*   **Keywords:** "First Name", "Last Name", "Preferred Name", "Full Name", "DOB", "Date of Birth", "Age", "Email Address", "Phone Number", "Cell Phone", "Home Phone", "Address", "Street", "City", "State", "Zip Code", "Postal Code", "Today's Date".

**Execution:**
1.  **STOP** creating individual fields for the keywords above.
2.  **GENERATE** this single, unified JSON object instead. This object represents the entire patient information section.
3.  **DO NOT** add any other fields like ` + "`title`" + ` or ` + "`description`" + ` to it. Use this exact snippet.

    ` + "```json" + `
    {
      "type": "patient_demographics",
      "name": "patient_demographics_data",
      "title": "Patient Information"
    }
    ` + "```" + `

### B. The Unfailing Insurance Information Workflow

This is a non-negotiable, two-step process that you must follow.

**Trigger:** You MUST activate this workflow if you detect **ANY** mention of health insurance. This includes, but is not limited to:
*   Keywords: "Insurance", "Member ID", "Group Number", "Policy Holder", "Payer", "Carrier".
*   Actions: Any request to "Upload Insurance Card", "Provide Insurance Photo", etc.

**Execution:**

1.  **Step A: The Gating Question.** ALWAYS start with this exact "Yes/No" question. Do not proceed to Step B without it.
    ` + "```json" + `
    {
      "type": "radiogroup",
      "name": "has_insurance",
      "title": "Do you have insurance?",
      "choices": ["Yes", "No"],
      "colCount": 0,
      "isRequired": true
    }
    ` + "```" + `
2.  **Step B: The Conditional Panel.** Immediately following the gating question, place **ALL** insurance-related questions (including file uploads and text fields) inside this panel. This panel **MUST** be conditionally visible based on the answer to the gating question.
    ` + "```json" + `
    {
      "type": "panel",
      "name": "insurance_info_panel",
      "title": "Insurance Information",
      "visibleIf": "{has_insurance} = 'Yes'",
      "elements": [
        {
          "type": "html",
          "name": "insurance_instructions",
          "html": "<p style='color: #1976d2;'>Please use the camera button below to take photos of your insurance card. The information will be automatically extracted.</p>"
        },
        {
          "type": "file",
          "name": "insurance_card_front",
          "title": "Front of Insurance Card",
          "acceptedTypes": "image/*",
          "storeDataAsText": false,
          "allowMultiple": false,
          "maxSize": 10485760,
          "sourceType": "camera,file-picker"
        },
        {
          "type": "file",
          "name": "insurance_card_back",
          "title": "Back of Insurance Card",
          "acceptedTypes": "image/*",
          "storeDataAsText": false,
          "allowMultiple": false,
          "maxSize": 10485760,
          "sourceType": "camera,file-picker"
        },
        // Now, add all the original text fields for insurance info below.
        // Example:
        {
          "type": "text",
          "name": "member_id",
          "title": "Member ID",
          "description": "Will be auto-filled from insurance card"
        }
      ]
    }
    ` + "```" + `

### C. The Terms & Conditions / Consent Workflow

When you encounter legal text, privacy policies, or consent agreements, choose one of these two patterns:

1.  **Pattern 1: Simple Acceptance (Checkbox Only)**
    *   Use this for simple "I agree" statements.
    ` + "```json" + `
    {
      "type": "checkbox",
      "name": "terms_acceptance",
      "title": "Terms and Conditions",
      "isRequired": true,
      "choices": [
        {
          "value": "accepted",
          "text": "I have read and accept the terms and conditions, privacy policy, and consent to treatment."
        }
      ],
      "validators": [{
        "type": "answercount",
        "minCount": 1,
        "text": "You must accept the terms to continue."
      }]
    }
    ` + "```" + `

2.  **Pattern 2: Full Agreement (Panel with Scrollable Text and Signature)**
    *   Use this when there is a block of legal text and a signature is required.
    ` + "```json" + `
    {
      "type": "panel",
      "name": "terms_and_conditions_panel",
      "title": "Terms and Conditions",
      "elements": [
        {
          "type": "html",
          "name": "terms_content",
          "html": "<div style='max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;'>[PASTE FULL TERMS CONTENT HERE]</div>"
        },
        {
          "type": "checkbox",
          "name": "accept_terms_box",
          "title": "Agreement",
          "isRequired": true,
          "choices": [{"value": "accepted", "text": "I have read and accept the terms and conditions."}]
        },
        {
          "type": "signaturepad",
          "name": "terms_signature",
          "title": "Electronic Signature",
          "isRequired": true,
          "visibleIf": "{accept_terms_box} = ['accepted']"
        }
      ]
    }
    ` + "```" + `

---

## V. Mobile-First Design Principles

Every form you generate must be optimized for mobile devices. Apply these rules to ALL form elements:

### A. Radio Button and Checkbox Groups
ALWAYS include these properties for consistent mobile display:
` + "```json" + `
{
  "type": "radiogroup",
  "name": "field_name",
  "title": "Question Title",
  "choices": ["Option 1", "Option 2"],
  "colCount": 0,  // REQUIRED: Forces single column layout, prevents misalignment
  "isRequired": true
}
` + "```" + `

### B. Root Survey Configuration
Your root JSON must include these mobile optimization properties:
` + "```json" + `
{
  "title": "Form Title",
  "description": "Form description",
  "widthMode": "responsive",  // REQUIRED: Enables mobile responsiveness
  "showQuestionNumbers": "off",  // Cleaner mobile UI
  "showProgressBar": "bottom",
  "questionsOrder": "initial",
  "pages": [...]
}
` + "```" + `

### C. Text Input Fields
Include width constraints for better mobile display:
` + "```json" + `
{
  "type": "text",
  "name": "field_name",
  "title": "Field Title",
  "maxWidth": "100%",  // Prevents overflow on mobile
  "inputType": "text"  // or "email", "tel", "number"
}
` + "```" + `

### D. File Upload Fields (Insurance Cards, etc.)
Optimize for mobile camera usage:
` + "```json" + `
{
  "type": "file",
  "name": "insurance_card_front",
  "title": "Front of Insurance Card",
  "acceptedTypes": "image/*",
  "sourceType": "camera,file-picker",  // REQUIRED: Enables camera on mobile
  "storeDataAsText": false,
  "allowMultiple": false,
  "maxSize": 10485760
}
` + "```" + `

### E. CRITICAL Mobile Rules
1. **NEVER use** ` + "`\"renderAs\": \"table\"`" + ` - it breaks mobile layouts
2. **ALWAYS set** ` + "`\"colCount\": 0`" + ` for radio/checkbox groups
3. **AVOID** multi-column layouts (colCount > 1) unless absolutely necessary
4. **USE** ` + "`\"startWithNewLine\": false`" + ` for inline elements on mobile
5. **INCLUDE** ` + "`\"maxWidth\"`" + ` for text inputs to prevent overflow

---

## VI. Modes of Operation

Your final task depends on the user's request. You will be in one of three modes:

*   **Mode 1: GENERATE NEW FORM**
    *   **Input:** Unstructured text or PDF content.
    *   **Action:** Build the entire SurveyJS JSON from scratch, strictly following all principles and blueprints above.

*   **Mode 2: MODIFY EXISTING FORM**
    *   **Input:** An existing SurveyJS JSON and a user prompt describing a change.
    *   **Action:**
        1.  Analyze the provided JSON carefully.
        2.  Apply **only** the requested changes.
        3.  **Crucially, preserve all existing fields, panels, pages, names, and logic that were not part of the user's request.**
        4.  If the modification introduces an opportunity for conditional logic (e.g., adding a follow-up question), **you are authorized to proactively add the ` + "`visibleIf`" + ` expression** to improve the form's usability.
        5.  Ensure all new fields still conform to the Master Component Blueprint (e.g., a new DOB field must be ` + "`dateofbirth`" + `).
        6.  Return the complete, updated JSON object.

*   **Mode 3: TRANSLATE FORM**
    *   **Input:** A SurveyJS JSON and a target language.
    *   **Action:**
        1.  Translate **only** the user-facing text strings: ` + "`title`" + `, ` + "`description`" + `, ` + "`text`" + ` (within choices), ` + "`html`" + `, and ` + "`validators.text`" + `.
        2.  **DO NOT** change any technical keys like ` + "`name`" + `, ` + "`type`" + `, ` + "`visibleIf`" + `, ` + "`inputType`" + `, etc.
        3.  Return the complete, translated JSON object.

## Final Command

Your instructions are complete. Now, analyze the user's request and provided content. Execute your operational mode. Generate **only** the single, valid JSON object as your final answer.`
}

// extractJSONFromResponse extracts JSON from the AI response
func extractJSONFromResponse(rawText string) string {
	// First check if response is wrapped in markdown code blocks
	if strings.Contains(rawText, "```") {
		// Extract content between code blocks
		re := regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)\\s*```")
		matches := re.FindStringSubmatch(rawText)
		if len(matches) > 1 {
			return strings.TrimSpace(matches[1])
		}
	}

	// Check if it's raw JSON
	if strings.HasPrefix(strings.TrimSpace(rawText), "{") {
		return strings.TrimSpace(rawText)
	}

	// Find JSON boundaries
	jsonStart := strings.Index(rawText, "{")
	jsonEnd := strings.LastIndex(rawText, "}") + 1
	if jsonStart != -1 && jsonEnd > 0 {
		return rawText[jsonStart:jsonEnd]
	}

	return ""
}

// fixCommonJSONErrors attempts to fix common JSON formatting issues
func fixCommonJSONErrors(jsonString string) string {
	fixed := jsonString

	// Remove JavaScript-style comments
	fixed = regexp.MustCompile(`//.*$`).ReplaceAllString(fixed, "")
	fixed = regexp.MustCompile(`/\[\s\S]*?\*/`).ReplaceAllString(fixed, "")

	// Remove trailing commas before closing brackets/braces
	fixed = regexp.MustCompile(`,\s*([}\]])`).ReplaceAllString(fixed, "$1")

	// Fix missing commas between properties
	fixed = regexp.MustCompile(`"\s*\n\s*"`).ReplaceAllString(fixed, `",\n"`)
	fixed = regexp.MustCompile(`([}\]])\s*\n\s*"`).ReplaceAllString(fixed, `$1,\n"`)
	fixed = regexp.MustCompile(`"\s*\n\s*([{\[])`).ReplaceAllString(fixed, `",\n$1`)
	fixed = regexp.MustCompile(`(})\s*\n\s*({)`).ReplaceAllString(fixed, `$1,\n$2`)
	fixed = regexp.MustCompile(`(])\s*\n\s*(\[)`).ReplaceAllString(fixed, `$1,\n$2`)
	fixed = regexp.MustCompile(`(true|false|null|\d+)\s*\n\s*(")`).ReplaceAllString(fixed, `$1,\n$2`)

	// Fix double commas
	fixed = regexp.MustCompile(`,\s*,`).ReplaceAllString(fixed, ",")

	return strings.TrimSpace(fixed)
}

// optimizeFormForMobile applies mobile-first optimizations to the form
func optimizeFormForMobile(form map[string]interface{}) map[string]interface{} {
	// Ensure root properties for mobile
	form["widthMode"] = "responsive"
	form["showQuestionNumbers"] = "off"
	form["showProgressBar"] = "bottom"
	form["questionsOrder"] = "initial"

	// Process pages
	if pages, ok := form["pages"].([]interface{}); ok {
		for _, page := range pages {
			if pageMap, ok := page.(map[string]interface{}); ok {
				optimizePageElements(pageMap)
			}
		}
	}

	return form
}

// optimizePageElements recursively optimizes form elements for mobile
func optimizePageElements(element map[string]interface{}) {
	// Set colCount to 0 for radio and checkbox groups
	if elemType, ok := element["type"].(string); ok {
		if elemType == "radiogroup" || elemType == "checkbox" {
			element["colCount"] = 0
		}
		if elemType == "text" {
			element["maxWidth"] = "100%"
		}
		if elemType == "file" {
			element["sourceType"] = "camera,file-picker"
		}
	}

	// Process nested elements
	if elements, ok := element["elements"].([]interface{}); ok {
		for _, elem := range elements {
			if elemMap, ok := elem.(map[string]interface{}); ok {
				optimizePageElements(elemMap)
			}
		}
	}

	// Process panels
	if panels, ok := element["panels"].([]interface{}); ok {
		for _, panel := range panels {
			if panelMap, ok := panel.(map[string]interface{}); ok {
				optimizePageElements(panelMap)
			}
		}
	}
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ExportHTMLToPDF converts HTML content to PDF using Gotenberg
func ExportHTMLToPDF(firestoreClient *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get form ID from URL
		formID := c.Param("id")
		if formID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID is required"})
			return
		}

		// Parse request body
		var req struct {
			HTML     string `json:"html" binding:"required"`
			Filename string `json:"filename"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Create Gotenberg client
		gotenbergClient, err := pdf.NewGotenbergClient(c.Request.Context())
		if err != nil {
			log.Printf("Failed to create Gotenberg client: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "PDF service unavailable"})
			return
		}

		// Convert HTML to PDF
		pdfBytes, err := gotenbergClient.GeneratePDFFromHTML(c.Request.Context(), req.HTML)
		if err != nil {
			log.Printf("Failed to generate PDF: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
			return
		}

		// Set appropriate headers
		filename := req.Filename
		if filename == "" {
			filename = "form-response.pdf"
		}
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
		c.Header("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))

		// Send PDF
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}
