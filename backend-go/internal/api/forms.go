package api

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"net/http"
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

		c.JSON(http.StatusOK, forms)
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

		c.JSON(http.StatusOK, gin.H{"status": "form updated"})
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

// ... (ProcessPDFWithVertex remains the same as it's not tied to a specific form)

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

		// ... (rest of the function remains the same)
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

		// ... (rest of the function remains the same)
	}
}
