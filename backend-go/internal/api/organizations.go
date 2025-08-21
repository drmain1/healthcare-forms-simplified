package api

import (
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"backend-go/internal/data"
	"github.com/gin-gonic/gin"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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

// UpdateOrganizationClinicInfo updates the clinic info for an organization
func UpdateOrganizationClinicInfo(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Param("id")
		userUID := c.GetString("uid")
		
		log.Printf("UpdateOrganizationClinicInfo: orgID=%s, userUID=%s", orgID, userUID)
		
		// Build expected organization ID for this user
		expectedOrgID := "org-" + userUID
		
		// Ensure user can only update their own organization
		if orgID != expectedOrgID && orgID != userUID {
			log.Printf("Authorization failed: orgID=%s, expectedOrgID=%s, userUID=%s", orgID, expectedOrgID, userUID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update another organization's settings"})
			return
		}
		
		var clinicInfo data.ClinicInfo
		if err := c.ShouldBindJSON(&clinicInfo); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		// Handle both org-{uid} and {uid} formats
		docID := orgID
		if orgID == expectedOrgID {
			// If it's org-{uid}, use just the uid for the document
			docID = userUID
		}
		
		log.Printf("Updating organization document ID: %s with clinic_info", docID)
		
		// Use Set with MergeAll to ensure the field is created if it doesn't exist
		_, err := client.Collection("organizations").Doc(docID).Set(c.Request.Context(), map[string]interface{}{
			"clinic_info": clinicInfo,
			"updated_at":  time.Now().UTC(),
		}, firestore.MergeAll)
		
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update clinic information"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Clinic information updated successfully", "clinic_info": clinicInfo})
	}
}

// GetOrganizationClinicInfo retrieves the clinic info for an organization
func GetOrganizationClinicInfo(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Param("id")
		userUID := c.GetString("uid")
		
		// Build expected organization ID for this user
		expectedOrgID := "org-" + userUID
		
		// Ensure user can only get their own organization's clinic info
		if orgID != expectedOrgID && orgID != userUID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot access another organization's settings"})
			return
		}
		
		// Handle both org-{uid} and {uid} formats
		docID := orgID
		if orgID == expectedOrgID {
			// If it's org-{uid}, use just the uid for the document
			docID = userUID
		}
		
		log.Printf("GetOrganizationClinicInfo: fetching document ID: %s", docID)
		
		doc, err := client.Collection("organizations").Doc(docID).Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		
		var org data.Organization
		if err := doc.DataTo(&org); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse organization data"})
			return
		}
		
		c.JSON(http.StatusOK, org.ClinicInfo)
	}
}

// GetOrCreateUserOrganization gets the user's organization or creates one if it doesn't exist
func GetOrCreateUserOrganization(client *firestore.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Get user info from context (set by auth middleware)
		userUID := c.GetString("uid")
		userEmail := c.GetString("email")
		
		if userUID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		
		// Organization ID based on user UID
		orgID := "org-" + userUID
		
		log.Printf("GetOrCreateUserOrganization: Fetching organization %s", orgID)
		startTime := time.Now()

		// Try to get existing organization
		doc, err := client.Collection("organizations").Doc(orgID).Get(ctx)

		duration := time.Since(startTime)
		log.Printf("GetOrCreateUserOrganization: Firestore query took %s", duration)
		
		if err != nil {
			if status.Code(err) == codes.NotFound {
				// Organization doesn't exist, create it
				emailDomain := ""
				if userEmail != "" {
					parts := splitEmail(userEmail)
					if len(parts) > 1 {
						emailDomain = parts[1]
					}
				}
				
				orgName := "Personal Clinic"
				if emailDomain != "" {
					// Use domain name as org name
					domainParts := splitDomain(emailDomain)
					if len(domainParts) > 0 {
						orgName = capitalize(domainParts[0]) + " Clinic"
					}
				}
				
				newOrg := data.Organization{
					ID:        orgID,
					UID:       userUID,
					Name:      orgName,
					Email:     userEmail,
					Settings: data.OrganizationSettings{
						HIPAACompliant:    true,
						DataRetentionDays: 2555, // 7 years
						Timezone:          "America/New_York",
					},
					ClinicInfo: data.ClinicInfo{
						ClinicName:   orgName,
						Email:        userEmail,
						PrimaryColor: "#2c3e50",
					},
					CreatedAt: time.Now().UTC(),
					UpdatedAt: time.Now().UTC(),
				}
				
				// Create the organization document
				_, err = client.Collection("organizations").Doc(orgID).Set(ctx, newOrg)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
					return
				}
				
				c.JSON(http.StatusCreated, newOrg)
				return
			}
			
			// Other error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
			return
		}
		
		// Organization exists, return it
		var org data.Organization
		if err := doc.DataTo(&org); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse organization data"})
			return
		}
		
		org.ID = doc.Ref.ID
		c.JSON(http.StatusOK, org)
	}
}

// Helper functions
func splitEmail(email string) []string {
	result := []string{}
	current := ""
	for _, ch := range email {
		if ch == '@' {
			result = append(result, current)
			current = ""
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func splitDomain(domain string) []string {
	result := []string{}
	current := ""
	for _, ch := range domain {
		if ch == '.' {
			result = append(result, current)
			current = ""
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return string(s[0]-32) + s[1:]
}