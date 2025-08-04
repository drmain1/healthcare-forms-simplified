package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/iterator"
)

// CreateShareLink creates a new share link for a form.
func CreateShareLink(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		userID, _ := c.Get("userID")
		orgID, _ := c.Get("organizationID")

		// First verify that the form exists and belongs to the organization
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
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to create share links for this form"})
			return
		}

		var shareLinkRequest struct {
			ExpiresInDays   int    `json:"expires_in_days,omitempty"`
			MaxResponses    int    `json:"max_responses,omitempty"`
			RequirePassword bool   `json:"require_password"`
			Password        string `json:"password,omitempty"`
		}
		if err := c.ShouldBindJSON(&shareLinkRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate a secure random token
		tokenBytes := make([]byte, 32)
		if _, err := rand.Read(tokenBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate share token"})
			return
		}
		shareToken := hex.EncodeToString(tokenBytes)

		// Hash the password if provided
		var hashedPassword string
		if shareLinkRequest.RequirePassword && shareLinkRequest.Password != "" {
			bytes, err := bcrypt.GenerateFromPassword([]byte(shareLinkRequest.Password), 14)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
				return
			}
			hashedPassword = string(bytes)
		} else if shareLinkRequest.RequirePassword {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password is required but not provided"})
			return
		}

		shareLink := data.ShareLink{
			FormID:         formID,
			ShareToken:     shareToken,
			IsActive:       true,
			ResponseCount:  0,
			OrganizationID: orgID.(string),
			CreatedBy:      userID.(string),
			CreatedAt:      time.Now().UTC(),
			MaxResponses:   shareLinkRequest.MaxResponses,
			PasswordHash:   hashedPassword, // Store the hashed password
		}

		// Set expiration if specified
		if shareLinkRequest.ExpiresInDays > 0 {
			shareLink.ExpiresAt = time.Now().UTC().AddDate(0, 0, shareLinkRequest.ExpiresInDays)
		}

		docRef, _, err := client.Collection("share_links").Add(c.Request.Context(), shareLink)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create share link"})
			return
		}

		shareLink.ID = docRef.ID
		// Add share path for frontend
		response := gin.H{
			"_id":         shareLink.ID,
			"form_id":     shareLink.FormID,
			"share_token": shareLink.ShareToken,
			"share_path":  "/forms/" + formID + "/fill/" + shareToken,
			"is_active":   shareLink.IsActive,
			"created_at":  shareLink.CreatedAt,
			"created_by":  shareLink.CreatedBy,
		}
		if !shareLink.ExpiresAt.IsZero() {
			response["expires_at"] = shareLink.ExpiresAt
		}
		if shareLink.MaxResponses > 0 {
			response["max_responses"] = shareLink.MaxResponses
		}
		c.JSON(http.StatusCreated, response)
	}
}

// ListShareLinks lists all active share links for a form.
func ListShareLinks(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		orgID, _ := c.Get("organizationID")

		// Verify form exists and user has access
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
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to view share links for this form"})
			return
		}

		var links []map[string]interface{}
		iter := client.Collection("share_links").Where("form_id", "==", formID).Where("is_active", "==", true).Documents(c.Request.Context())
		for {
			doc, err := iter.Next()
			if err == iterator.Done {
				break
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list share links"})
				return
			}

			var link data.ShareLink
			if err := doc.DataTo(&link); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse share link data"})
				return
			}
			link.ID = doc.Ref.ID
			
			// Format response
			linkResponse := map[string]interface{}{
				"_id":           link.ID,
				"form_id":       link.FormID,
				"share_token":   link.ShareToken,
				"share_path":    "/forms/" + formID + "/fill/" + link.ShareToken,
				"is_active":     link.IsActive,
				"response_count": link.ResponseCount,
				"created_at":    link.CreatedAt,
				"created_by":    link.CreatedBy,
			}
			if !link.ExpiresAt.IsZero() {
				linkResponse["expires_at"] = link.ExpiresAt
			}
			if link.MaxResponses > 0 {
				linkResponse["max_responses"] = link.MaxResponses
			}
			links = append(links, linkResponse)
		}

		c.JSON(http.StatusOK, links)
	}
}

// DeleteShareLink deletes a share link.
func DeleteShareLink(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		linkID := c.Param("linkId")
		orgID, _ := c.Get("organizationID")

		// Verify form exists and user has access
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
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete share links for this form"})
			return
		}

		// Get the share link to verify it belongs to this form
		linkDoc, err := client.Collection("share_links").Doc(linkID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "share link not found"})
			return
		}
		
		var shareLink data.ShareLink
		if err := linkDoc.DataTo(&shareLink); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse share link data"})
			return
		}
		
		if shareLink.FormID != formID {
			c.JSON(http.StatusNotFound, gin.H{"error": "share link not found for this form"})
			return
		}

		_, err = client.Collection("share_links").Doc(linkID).Delete(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete share link"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// GetFormByShareToken retrieves a form using a share token (public endpoint).
func GetFormByShareToken(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		shareToken := c.Param("share_token")
		
		// Find share link by token and form ID
		iter := client.Collection("share_links").
			Where("share_token", "==", shareToken).
			Where("form_id", "==", formID).
			Limit(1).
			Documents(c.Request.Context())
		
		doc, err := iter.Next()
		if err == iterator.Done {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid share link"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve share link"})
			return
		}

		var shareLink data.ShareLink
		if err := doc.DataTo(&shareLink); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse share link data"})
			return
		}

		// Check if link is active
		if !shareLink.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "This link is no longer active"})
			return
		}

		// Check expiration
		if !shareLink.ExpiresAt.IsZero() && time.Now().UTC().After(shareLink.ExpiresAt) {
			c.JSON(http.StatusForbidden, gin.H{"error": "This link has expired"})
			return
		}

		// Check response limit
		if shareLink.MaxResponses > 0 && shareLink.ResponseCount >= shareLink.MaxResponses {
			c.JSON(http.StatusForbidden, gin.H{"error": "Response limit reached for this link"})
			return
		}

		// Get the form
		formDoc, err := client.Collection("forms").Doc(formID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}

		var form data.Form
		if err := formDoc.DataTo(&form); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse form data"})
			return
		}
		form.ID = formDoc.Ref.ID
		c.JSON(http.StatusOK, form)
	}
}
