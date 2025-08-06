
package api

import (
	"context"
	"log"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"

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
func GeneratePDFHandler(client *firestore.Client, vs *services.VertexAIService, gs *services.GotenbergService) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseId := c.Param("responseId")
		if responseId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Response ID is required"})
			return
		}
		
		log.Printf("Starting PDF generation for response ID: %s", responseId)

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


		// At this point, we have surveyJSON and answers.
		// Step 3: Pre-process/flatten data based on conditional logic.
		log.Printf("Processing form data for response %s", responseId)
		visibleQuestions, err := services.ProcessAndFlattenForm(surveyJSON, answers)
		if err != nil {
			log.Printf("ERROR: Failed to process form data: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process form data", "details": err.Error()})
			return
		}
		log.Printf("Successfully processed %d visible questions", len(visibleQuestions))

		// Step 4: Call Vertex AI service with flattened data.
		log.Printf("Calling Vertex AI to generate HTML for response %s", responseId)
		generatedHTML, err := vs.GeneratePDFHTML(ctx, visibleQuestions)
		if err != nil {
			log.Printf("ERROR: Failed to generate HTML from AI service: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate HTML from AI service", "details": err.Error()})
			return
		}
		log.Printf("Successfully generated HTML (%d bytes)", len(generatedHTML))

		// Step 5: Call Gotenberg with AI-generated HTML.
		log.Printf("Calling Gotenberg to convert HTML to PDF for response %s", responseId)
		pdfBytes, err := gs.ConvertHTMLToPDF(generatedHTML)
		if err != nil {
			log.Printf("ERROR: Failed to convert HTML to PDF: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert HTML to PDF", "details": err.Error()})
			return
		}
		log.Printf("Successfully generated PDF (%d bytes)", len(pdfBytes))

		// Step 6: Return PDF to client.
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=response.pdf")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// Helper function to register this route - will be called from main.go
func RegisterPDFRoutes(router *gin.RouterGroup, client *firestore.Client, vs *services.VertexAIService, gs *services.GotenbergService) {
	router.POST("/responses/:responseId/generate-pdf", GeneratePDFHandler(client, vs, gs))
}
