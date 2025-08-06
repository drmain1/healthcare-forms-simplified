
package api

import (
	"context"
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

		ctx := context.Background()

		// 1. Fetch the response document
		responseDoc, err := client.Collection("responses").Doc(responseId).Get(ctx)
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
		formID, ok := responseData["form_id"].(string)
		if !ok || formID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID not found in response document"})
			return
		}
		
		answers, ok := responseData["response_data"].(map[string]interface{})
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Answer data (response_data) not found in response document"})
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
		visibleQuestions, err := services.ProcessAndFlattenForm(surveyJSON, answers)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process form data", "details": err.Error()})
			return
		}

		// Step 4: Call Vertex AI service with flattened data.
		generatedHTML, err := vs.GeneratePDFHTML(ctx, visibleQuestions)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate HTML from AI service", "details": err.Error()})
			return
		}

		// Step 5: Call Gotenberg with AI-generated HTML.
		pdfBytes, err := gs.ConvertHTMLToPDF(generatedHTML)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert HTML to PDF", "details": err.Error()})
			return
		}

		// Step 6: Return PDF to client.
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=response.pdf")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// Helper function to register this route - will be called from main.go
func RegisterPDFRoutes(router *gin.Engine, client *firestore.Client, vs *services.VertexAIService, gs *services.GotenbergService) {
	router.POST("/responses/:responseId/generate-pdf", GeneratePDFHandler(client, vs, gs))
}
