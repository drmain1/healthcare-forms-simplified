package api

import (
	"log"
	"net/http"
	"strings"
	"time"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authClient *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header not provided"})
			return
		}

		idToken := strings.TrimSpace(strings.Replace(authHeader, "Bearer", "", 1))
		if idToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Bearer token not provided"})
			return
		}

		log.Println("AuthMiddleware: Verifying ID token...")
		startTime := time.Now()

		token, err := authClient.VerifyIDToken(c.Request.Context(), idToken)

		duration := time.Since(startTime)
		log.Printf("AuthMiddleware: ID token verification took %s", duration)

		if err != nil {
			log.Printf("Error verifying ID token: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid ID token"})
			return
		}

		// The UID of the user is their organization ID in our single-tenant model.
		c.Set("userID", token.UID)
		c.Set("organizationID", token.UID)
		c.Set("organizationId", token.UID)  // Also set lowercase version for compatibility
		c.Set("uid", token.UID)
		
		// Extract email from token claims
		if email, ok := token.Claims["email"].(string); ok {
			c.Set("email", email)
		}

		c.Next()
	}
}
