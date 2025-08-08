
package api

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"

	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/services"
)

// PDFGenerationRequest holds the data needed for generating a PDF.
// It is populated by fetching data from Firestore within the handler.
type PDFGenerationRequest struct {
	SurveyJSON   map[string]interface{} `json:"surveyJson"`
	ResponseData map[string]interface{} `json:"responseData"`
}

// GeneratePDFHandler is the main orchestrator for the PDF generation process.
// It fetches form and response data, sends it to an AI for HTML generation,
// then sends that HTML to Gotenberg for PDF conversion.
func GeneratePDFHandler(client *firestore.Client, gs *services.GotenbergService) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseId := c.Param("responseId")
		if responseId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Response ID is required"})
			return
		}
		
		log.Printf("Starting PDF generation for response ID: %s", responseId)
		startTime := time.Now()

		ctx := context.Background()

		// 1. Fetch the response document
		log.Printf("Fetching response document from form_responses collection")
		responseDoc, err := client.Collection("form_responses").Doc(responseId).Get(ctx)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Response not found"})
			return
		}
		var responseData map[string]interface{}
		if err := responseDoc.DataTo(&responseData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse response data"})
			return
		}

		// Extract form_id and response_data from the response document
		// Note: The Firestore field is "form", not "form_id"
		formID, ok := responseData["form"].(string)
		if !ok || formID == "" {
			// Log the actual structure for debugging
			log.Printf("Response document structure: %+v", responseData)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID not found in response document (looking for 'form' field)", "debug": responseData})
			return
		}
		
		// Note: The Firestore field is "data", not "response_data"
		answers, ok := responseData["data"].(map[string]interface{})
		if !ok {
			// Log the actual structure for debugging
			log.Printf("Response data type: %T, value: %+v", responseData["data"], responseData["data"])
			c.JSON(http.StatusBadRequest, gin.H{"error": "Answer data not found in response document (looking for 'data' field)", "debug": responseData})
			return
		}
		
		// Extract organization ID from response
		orgID, _ := responseData["organizationId"].(string)

		// 2. Fetch the corresponding form document
		formDoc, err := client.Collection("forms").Doc(formID).Get(ctx)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		var form map[string]interface{}
		if err := formDoc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse form data"})
			return
		}
		
		surveyJSON, ok := form["surveyJson"].(map[string]interface{})
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "surveyJson not found or is not the correct type in form document"})
			return
		}
		
		// 3. Fetch organization clinic info if available
		var clinicInfo *data.ClinicInfo
		if orgID != "" {
			orgDoc, err := client.Collection("organizations").Doc(orgID).Get(ctx)
			if err == nil {
				// Debug: log raw organization data
				orgData := orgDoc.Data()
				log.Printf("DEBUG: Raw organization data: %+v", orgData)
				
				// Check if clinic_info field exists
				if clinicData, exists := orgData["clinic_info"]; exists {
					log.Printf("DEBUG: clinic_info field exists in Firestore: %+v", clinicData)
				} else {
					log.Printf("DEBUG: clinic_info field DOES NOT exist in Firestore document")
				}
				
				var org data.Organization
				if err := orgDoc.DataTo(&org); err == nil {
					clinicInfo = &org.ClinicInfo
					log.Printf("Successfully fetched clinic info for organization: %s", orgID)
					log.Printf("DEBUG: Organization struct after parsing: %+v", org)
					log.Printf("DEBUG: ClinicInfo specifically: %+v", org.ClinicInfo)
				} else {
					log.Printf("ERROR: Failed to parse organization data: %v", err)
				}
			} else {
				log.Printf("Could not fetch organization info for ID %s: %v", orgID, err)
			}
		}

		// At this point, we have surveyJSON and answers.

		// --- DEBUG LOGGING ---
		log.Printf("--- DEBUG: Data Pulled from Firestore for PDF Generation ---")
		for key, value := range answers {
			if (strings.Contains(key, "signature")) {
				if sigData, ok := value.(string); ok {
					log.Printf("Signature field '%s' from Firestore has data length: %d", key, len(sigData))
				} else {
					log.Printf("Signature field '%s' from Firestore has non-string data type: %T", key, value)
				}
			}
		}
		// --- END DEBUG LOGGING ---


		// Step 3: Pre-process/flatten data based on conditional logic.
		log.Printf("Processing form data for response %s", responseId)
		visibleQuestions, err := services.ProcessAndFlattenForm(surveyJSON, answers)
		if err != nil {
			log.Printf("ERROR: Failed to process form data: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process form data", "details": err.Error()})
			return
		}
		log.Printf("Successfully processed %d visible questions (elapsed: %v)", len(visibleQuestions), time.Since(startTime))

		log.Printf("Generating HTML from template for response %s (elapsed: %v)", responseId, time.Since(startTime))
		generatedHTML, err := services.GenerateHTMLFromTemplate(visibleQuestions, clinicInfo)
		if err != nil {
			log.Printf("ERROR: Failed to generate HTML from template: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate HTML from template", "details": err.Error()})
			return
		}

		// Step 5: Call Gotenberg with AI-generated HTML.
		gotenbergStart := time.Now()
		log.Printf("Calling Gotenberg to convert HTML to PDF for response %s (elapsed: %v)", responseId, time.Since(startTime))
		pdfBytes, err := gs.ConvertHTMLToPDF(generatedHTML)
		if err != nil {
			log.Printf("ERROR: Failed to convert HTML to PDF: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert HTML to PDF", "details": err.Error()})
			return
		}
		log.Printf("Successfully generated PDF (%d bytes) - Gotenberg took: %v, Total time: %v", len(pdfBytes), time.Since(gotenbergStart), time.Since(startTime))

		// Step 6: Return PDF to client.
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=response.pdf")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// Helper function to register this route - will be called from main.go
func RegisterPDFRoutes(router *gin.RouterGroup, client *firestore.Client, gs *services.GotenbergService) {
	router.POST("/responses/:responseId/generate-pdf", GeneratePDFHandler(client, gs))
}
