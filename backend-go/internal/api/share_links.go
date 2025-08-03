package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

// CreateShareLink creates a new share link for a form.
func CreateShareLink(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		var shareLink data.ShareLink
		if err := c.ShouldBindJSON(&shareLink); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate a random token
		tokenBytes := make([]byte, 16)
		if _, err := rand.Read(tokenBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate share token"})
			return
		}
		shareLink.ShareToken = hex.EncodeToString(tokenBytes)

		shareLink.FormID = formID
		shareLink.IsActive = true
		shareLink.CreatedAt = time.Now().UTC()
		// In a real app, get user and org from auth token
		shareLink.CreatedBy = "user-placeholder"
		shareLink.OrganizationID = "org-placeholder"

		docRef, _, err := client.Collection("share_links").Add(c.Request.Context(), shareLink)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create share link"})
			return
		}

		shareLink.ID = docRef.ID
		c.JSON(http.StatusCreated, shareLink)
	}
}

// ListShareLinks lists all active share links for a form.
func ListShareLinks(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		formID := c.Param("id")
		var links []data.ShareLink
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
			links = append(links, link)
		}

		c.JSON(http.StatusOK, links)
	}
}

// DeleteShareLink deletes a share link.
func DeleteShareLink(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		linkID := c.Param("linkId")
		_, err := client.Collection("share_links").Doc(linkID).Delete(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete share link"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// GetFormByShareToken retrieves a form using a share token.
func GetFormByShareToken(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		shareToken := c.Param("token")
		iter := client.Collection("share_links").Where("share_token", "==", shareToken).Where("is_active", "==", true).Limit(1).Documents(c.Request.Context())
		doc, err := iter.Next()
		if err == iterator.Done {
			c.JSON(http.StatusNotFound, gin.H{"error": "share link not found or is inactive"})
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

		// Check expiration
		if !shareLink.ExpiresAt.IsZero() && time.Now().UTC().After(shareLink.ExpiresAt) {
			c.JSON(http.StatusForbidden, gin.H{"error": "share link has expired"})
			return
		}

		// Get the form
		formDoc, err := client.Collection("forms").Doc(shareLink.FormID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "form not found"})
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
