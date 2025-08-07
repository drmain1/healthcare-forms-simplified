package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/services"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CreateFormResponse creates a new form response.
func CreateFormResponse(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var response data.FormResponse
		if err := c.ShouldBindJSON(&response); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Basic validation: ensure data is not empty
		if len(response.Data) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "form data cannot be empty"})
			return
		}

		userID, _ := c.Get("userID")
		orgID, _ := c.Get("organizationID")

		now := time.Now().UTC()
		response.SubmittedAt = now
		response.SubmittedBy = userID.(string)
		response.OrganizationID = orgID.(string)

		// Add to Firestore
		docRef, _, err := client.Collection("form_responses").Add(c.Request.Context(), response)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create form response"})
			return
		}

		response.ID = docRef.ID

		c.JSON(http.StatusCreated, response)
	}
}

// GetFormResponse retrieves a form response by its ID.
func GetFormResponse(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		doc, err := client.Collection("form_responses").Doc(responseID).Get(c.Request.Context())
		if err != nil {
			if status.Code(err) == codes.NotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "form response not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve form response"})
			return
		}

		var response data.FormResponse
		if err := doc.DataTo(&response); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form response data"})
			return
		}

		if response.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this response"})
			return
		}

		response.ID = doc.Ref.ID

		c.JSON(http.StatusOK, response)
	}
}

// DeleteFormResponse deletes a form response by its ID.
func DeleteFormResponse(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		// First, get the response to verify ownership
		doc, err := client.Collection("form_responses").Doc(responseID).Get(c.Request.Context())
		if err != nil {
			if status.Code(err) == codes.NotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "form response not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve form response"})
			return
		}

		var response data.FormResponse
		if err := doc.DataTo(&response); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form response data"})
			return
		}

		// Check if the user has permission to delete this response
		if response.OrganizationID != orgID.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete this response"})
			return
		}

		// Delete the response
		_, err = client.Collection("form_responses").Doc(responseID).Delete(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete form response"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "form response deleted successfully"})
	}
}

// ListFormResponses lists all form responses for a given form.
func ListFormResponses(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Query("formId")
		orgID, _ := c.Get("organizationID")

		log.Printf("ListFormResponses: Fetching responses for organizationID: %v", orgID)

		var responses []data.FormResponse
		q := client.Collection("form_responses").Where("organizationId", "==", orgID.(string))
		if formID != "" {
			q = q.Where("form", "==", formID)
		}

		iter := q.Documents(c.Request.Context())
		for {
			doc, err := iter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list form responses"})
				return
			}

			var response data.FormResponse
			if err := doc.DataTo(&response); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form response data"})
				return
			}
			response.ID = doc.Ref.ID
			responses = append(responses, response)
		}

		log.Printf("ListFormResponses: Found %d responses for organizationID: %v", len(responses), orgID)

		c.JSON(http.StatusOK, gin.H{
			"count":     len(responses),
			"results":   responses,
		})
	}
}

// CreatePublicFormResponse creates a form response from a public share link
func CreatePublicFormResponse(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var requestBody struct {
			FormID       string                 `json:"form_id" binding:"required"`
			ShareToken   string                 `json:"share_token" binding:"required"`
			ResponseData map[string]interface{} `json:"response_data" binding:"required"`
		}

		if err := c.ShouldBindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		log.Printf("Public form submission received for form %s with token %s", requestBody.FormID, requestBody.ShareToken)

		// Validate share token
		shareLinksRef := client.Collection("share_links")
		query := shareLinksRef.Where("form_id", "==", requestBody.FormID).
			Where("share_token", "==", requestBody.ShareToken).
			Where("is_active", "==", true)

		docs, err := query.Documents(c.Request.Context()).GetAll()
		if err != nil || len(docs) == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Invalid or expired share link for form %s with token %s", requestBody.FormID, requestBody.ShareToken)})
			return
		}

		shareLink := docs[0]
		shareData := shareLink.Data()
		log.Printf("Share link data: %v", shareData)

		// Check if link has expired
		if expiresAt, ok := shareData["expires_at"].(time.Time); ok {
			if time.Now().After(expiresAt) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Share link has expired"})
				return
			}
		}

		// Check max responses if configured
		if maxResponses, ok := shareData["max_responses"].(int64); ok && maxResponses > 0 {
			currentResponses := int64(0)
			if responseCount, ok := shareData["response_count"].(int64); ok {
				currentResponses = responseCount
			}
			if currentResponses >= maxResponses {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Share link has reached maximum responses"})
				return
			}

			// Increment response count
			_, err = shareLink.Ref.Update(c.Request.Context(), []firestore.Update{
				{Path: "response_count", Value: currentResponses + 1},
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update share link"})
				return
			}
		}

		// Get organization ID with fallback logic
		orgID := ""
		if org, ok := shareData["organizationId"].(string); ok && org != "" {
			// Use organization from share link if available
			orgID = org
			log.Printf("Organization ID found in share link: %s", orgID)
		} else {
			log.Printf("Organization ID not found in share link, falling back to form document.")
			// Fallback: Get organization from the form document
			formDoc, err := client.Collection("forms").Doc(requestBody.FormID).Get(c.Request.Context())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form details"})
				return
			}
			formData := formDoc.Data()
			if formOrgID, ok := formData["organizationId"].(string); ok {
				orgID = formOrgID
				log.Printf("Organization ID found in form document: %s", orgID)
			} else {
				log.Printf("Organization ID not found in form document.")
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to determine organization"})
				return
			}
		}

		// Create the form response
		response := data.FormResponse{
			FormID:         requestBody.FormID,
			Data:           requestBody.ResponseData,
			SubmittedAt:    time.Now().UTC(),
			SubmittedBy:    "public",
			OrganizationID: orgID,
		}

		// Add to Firestore
		docRef, _, err := client.Collection("form_responses").Add(c.Request.Context(), response)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create form response"})
			return
		}

		response.ID = docRef.ID

		c.JSON(http.StatusCreated, gin.H{
			"id":      response.ID,
			"message": "Form submitted successfully",
		})
	}
}

// GetClinicalSummary generates an AI-powered clinical summary for a given form response.
func GetClinicalSummary(client *firestore.Client, vs *services.VertexAIService) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseId := c.Param("id")
		if responseId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Response ID is required"})
			return
		}

		ctx := c.Request.Context()

		// 1. Fetch the response document
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

		formID, ok := responseData["form"].(string)
		if !ok || formID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID not found in response document"})
			return
		}

		answers, ok := responseData["data"].(map[string]interface{})
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Answer data not found in response document"})
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

		// 3. Pre-process/flatten data based on conditional logic.
		visibleQuestions, err := services.ProcessAndFlattenForm(surveyJSON, answers)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process form data", "details": err.Error()})
			return
		}

		// 4. Call Vertex AI service with flattened data.
		summary, err := vs.GenerateClinicalSummary(ctx, visibleQuestions)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate clinical summary from AI service", "details": err.Error()})
			return
		}

		// 5. Return summary to client.
		c.JSON(http.StatusOK, gin.H{"summary": summary})
	}
}
