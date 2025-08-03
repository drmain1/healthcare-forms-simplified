package api

import (
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gin-gonic/gin"
)

// CreateOrganization creates a new organization.
func CreateOrganization(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var org data.Organization
		if err := c.ShouldBindJSON(&org); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set timestamps
		now := time.Now().UTC()
		org.CreatedAt = now
		org.UpdatedAt = now

		// Add to Firestore
		docRef, _, err := client.Collection("organizations").Add(c.Request.Context(), org)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create organization"})
			return
		}

		org.ID = docRef.ID

		c.JSON(http.StatusCreated, org)
	}
}

// GetOrganization retrieves an organization by its ID.
func GetOrganization(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Param("id")

		doc, err := client.Collection("organizations").Doc(orgID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "organization not found"})
			return
		}

		var org data.Organization
		if err := doc.DataTo(&org); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse organization data"})
			return
		}

		org.ID = doc.Ref.ID

		c.JSON(http.StatusOK, org)
	}
}