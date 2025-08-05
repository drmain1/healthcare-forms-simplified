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

		// Read the HTML template from the embedded filesystem
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
	return ``
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
