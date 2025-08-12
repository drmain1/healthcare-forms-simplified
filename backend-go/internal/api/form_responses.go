package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/services"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Helper function to get map keys
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// extractPatientName extracts the patient's full name from response data
func extractPatientName(responseData map[string]interface{}) string {
	firstName := ""
	lastName := ""
	
	// Try to get first_name and last_name from response data
	if val, ok := responseData["first_name"].(string); ok {
		firstName = val
	}
	
	if val, ok := responseData["last_name"].(string); ok {
		lastName = val
	}
	
	// Combine names
	fullName := ""
	if firstName != "" && lastName != "" {
		fullName = firstName + " " + lastName
	} else if firstName != "" {
		fullName = firstName
	} else if lastName != "" {
		fullName = lastName
	}
	
	return fullName
}

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
		
		// Extract patient name from response data
		response.PatientName = extractPatientName(response.Data)

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
		
		// Extract patient name from data if not already set
		if response.PatientName == "" && response.Data != nil {
			response.PatientName = extractPatientName(response.Data)
		}

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
			
			// Extract patient name from data if not already set
			if response.PatientName == "" && response.Data != nil {
				response.PatientName = extractPatientName(response.Data)
			}
			
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

		// --- DEBUG LOGGING ---
		log.Printf("--- DEBUG: Received Form Submission ---")
		log.Printf("Total fields in ResponseData: %d", len(requestBody.ResponseData))
		
		// Log all field names to see what we're receiving
		log.Printf("Field names received:")
		for key := range requestBody.ResponseData {
			log.Printf("  - %s", key)
		}
		
		// Check specifically for pain_areas
		if painAreas, exists := requestBody.ResponseData["pain_areas"]; exists {
			log.Printf("✅ pain_areas field FOUND in request")
			if arr, ok := painAreas.([]interface{}); ok {
				log.Printf("  pain_areas is array with %d items", len(arr))
				// Log first item as sample
				if len(arr) > 0 {
					log.Printf("  Sample pain area: %+v", arr[0])
				}
			} else {
				log.Printf("  pain_areas type: %T", painAreas)
			}
		} else {
			log.Printf("❌ pain_areas field NOT FOUND in request")
		}
		
		// Safely log signature data by checking for it and printing its length
		for key, value := range requestBody.ResponseData {
			if (strings.Contains(key, "signature")) {
				if sigData, ok := value.(string); ok {
					log.Printf("Signature field '%s' received with data length: %d", key, len(sigData))
				} else {
					log.Printf("Signature field '%s' received with non-string data type: %T", key, value)
				}
			} 
		}
		// --- END DEBUG LOGGING ---


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
			PatientName:    extractPatientName(requestBody.ResponseData),
		}

		// --- NEW DEBUG LOGGING ---
		// Check if pain_areas exists in the data being saved
		if painAreas, exists := response.Data["pain_areas"]; exists {
			log.Printf("✅ pain_areas WILL BE SAVED to Firestore")
			if arr, ok := painAreas.([]interface{}); ok {
				log.Printf("  Saving %d pain areas", len(arr))
			}
		} else {
			log.Printf("❌ pain_areas NOT in data being saved to Firestore")
			log.Printf("  Fields being saved: %v", getMapKeys(response.Data))
		}
		
		jsonData, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error marshalling response for logging: %v", err)
		} else {
			log.Printf("--- DEBUG: Saving to Firestore ---")
			// Truncate if too long
			dataStr := string(jsonData)
			if len(dataStr) > 1000 {
				dataStr = dataStr[:1000] + "... (truncated)"
			}
			log.Printf("Data being saved: %s", dataStr)
		}
		// --- END NEW DEBUG LOGGING ---

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