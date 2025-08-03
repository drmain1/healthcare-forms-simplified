package api

import (
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
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

// ListFormResponses lists all form responses for a given form.
func ListFormResponses(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Query("formId")
		orgID, _ := c.Get("organizationID")

		var responses []data.FormResponse
		q := client.Collection("form_responses").Where("organizationId", "==", orgID.(string))
		if formID != "" {
			q = q.Where("formId", "==", formID)
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

		c.JSON(http.StatusOK, responses)
	}
}