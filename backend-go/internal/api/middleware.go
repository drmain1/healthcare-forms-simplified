package api

import (
	"log"
	"net/http"
	"strings"
	"time"

	"backend-go/internal/data"
	"backend-go/internal/services"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authClient *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// First, try session cookie authentication (preferred for HIPAA)
		sessionCookie, err := c.Cookie("session")
		if err == nil && sessionCookie != "" {
			// Verify session cookie and get user data from Redis
			redisClient := data.GetRedisClient()
			sessionData, err := services.GetSession(c.Request.Context(), redisClient, sessionCookie)
			if err == nil && sessionData != nil {
				// Session is valid, set user context
				c.Set("userID", sessionData.UserID)
				c.Set("organizationID", sessionData.OrganizationID)
				c.Set("organizationId", sessionData.OrganizationID)
				c.Set("uid", sessionData.UserID)
				log.Printf("AuthMiddleware: Authenticated via session cookie for user %s", sessionData.UserID)
				c.Next()
				return
			}
			log.Printf("AuthMiddleware: Session cookie invalid or expired: %v", err)
		}

		// Fallback to Bearer token authentication (for backward compatibility)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No valid session or authorization header provided"})
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

		log.Printf("AuthMiddleware: Authenticated via Bearer token for user %s", token.UID)
		c.Next()
	}
}
