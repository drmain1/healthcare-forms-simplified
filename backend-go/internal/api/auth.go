package api

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"backend-go/internal/data"
	"backend-go/internal/services"
	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
)

// SessionLogin handles the session login process.
func SessionLogin(firebaseApp *firebase.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		authClient, err := firebaseApp.Auth(ctx)
		if err != nil {
			log.Printf("Error getting Auth client: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

		var req struct {
			IDToken string `json:"idToken"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID token not provided or invalid JSON"})
			return
		}

		if req.IDToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID token is empty"})
			return
		}

		// Set session expiration to 5 days.
		expiresIn := time.Hour * 24 * 5
		sessionCookie, err := authClient.SessionCookie(ctx, req.IDToken, expiresIn)
		if err != nil {
			log.Printf("Error creating session cookie: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to create session cookie"})
			return
		}

		// Get cookie domain from environment variable, default to empty for current domain
		cookieDomain := os.Getenv("COOKIE_DOMAIN")
		
		origin := c.Request.Header.Get("Origin")
		
		// For Firebase hosting proxy and custom domain, we're actually same-origin
		isFirebaseOrigin := strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app")
		isCustomDomain := strings.Contains(origin, "form.easydocforms.com")
		isLocalhost := strings.HasPrefix(origin, "http://localhost")

		// Set the session cookie in the response
		// When behind Firebase Hosting proxy or custom domain, treat as same-origin
		if isFirebaseOrigin || isCustomDomain {
			c.SetSameSite(http.SameSiteLaxMode)
			log.Printf("Setting session cookie with SameSite=Lax for same-origin (no Secure flag): %s", origin)
			// Don't use Secure flag for Firebase proxy or custom domain - it's effectively same-origin
			c.SetCookie("session", sessionCookie, int(expiresIn.Seconds()), "/", cookieDomain, false, true)
		} else if isLocalhost {
			c.SetSameSite(http.SameSiteLaxMode)
			log.Printf("Setting session cookie with SameSite=Lax for localhost: %s", origin)
			c.SetCookie("session", sessionCookie, int(expiresIn.Seconds()), "/", cookieDomain, false, true)
		} else {
			c.SetSameSite(http.SameSiteNoneMode)
			log.Printf("Setting session cookie with SameSite=None for cross-origin: %s", origin)
			// Use Secure flag for true cross-origin requests
			isSecure := c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https"
			c.SetCookie("session", sessionCookie, int(expiresIn.Seconds()), "/", cookieDomain, isSecure, true)
		}
		
		// Store session metadata in Redis for distributed access and generate CSRF token
		token, err := authClient.VerifyIDToken(ctx, req.IDToken)
		if err != nil {
			log.Printf("Error verifying token for session storage: %v", err)
			// Continue with login - Redis failure shouldn't block auth
			c.JSON(http.StatusOK, gin.H{"status": "success", "sessionToken": sessionCookie})
			return
		}

		redisClient := data.GetRedisClient()
		userRecord, err := authClient.GetUser(ctx, token.UID)
		if err != nil {
			log.Printf("Error getting user record for session storage: %v", err)
			// Continue with login - Redis failure shouldn't block auth
			c.JSON(http.StatusOK, gin.H{"status": "success", "sessionToken": sessionCookie})
			return
		}

		// Extract organization ID from custom claims or Firestore
		orgID := "" // Extract from userRecord.CustomClaims or query Firestore
		if customClaims := userRecord.CustomClaims; customClaims != nil {
			if orgIDClaim, ok := customClaims["organization_id"].(string); ok {
				orgID = orgIDClaim
			}
		}
		
		// HIPAA audit data
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		
		sessionData := &data.UserSession{
			UserID:         token.UID,
			OrganizationID: orgID,
			Permissions:    []string{"read:forms", "write:responses"}, // Based on role
			CreatedAt:      time.Now(),
			IPAddress:      clientIP,
			UserAgent:      userAgent,
			SessionType:    "web",
		}

		if err := services.CreateSession(ctx, redisClient, sessionCookie, sessionData); err != nil {
			log.Printf("Failed to store session in Redis: %v", err)
			// Log but don't fail login - graceful degradation
		} else {
			log.Printf("Successfully stored session for user %s in Redis", token.UID)
		}

		// Generate CSRF token for this session
		csrfToken := GenerateCSRFTokenInternal(c, token.UID)
		if csrfToken == "" {
			log.Printf("ERROR: Failed to generate CSRF token for user %s", token.UID)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token"})
			return
		}

		// Return success response with CSRF token
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"message": "Login successful",
			"csrfToken": csrfToken,
			"expiresIn": int(expiresIn.Seconds()),
		})
	}
}

// LogoutHandler handles user logout with session and CSRF cleanup
func LogoutHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Get cookie domain from environment variable
	cookieDomain := os.Getenv("COOKIE_DOMAIN")
	
	// Clear session cookie
	origin := c.Request.Header.Get("Origin")
	isFirebaseOrigin := strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app")
	isCustomDomain := strings.Contains(origin, "form.easydocforms.com")
	isLocalhost := strings.HasPrefix(origin, "http://localhost")
	
	// Clear cookie with appropriate settings
	if isFirebaseOrigin || isCustomDomain || isLocalhost {
		c.SetCookie("session", "", -1, "/", cookieDomain, false, true)
	} else {
		isSecure := c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https"
		c.SetCookie("session", "", -1, "/", cookieDomain, isSecure, true)
	}

	// Remove session from Redis
	redisClient := data.GetRedisClient()
	sessionCookie, _ := c.Cookie("session")
	if sessionCookie != "" {
		services.DeleteSession(c.Request.Context(), redisClient, sessionCookie)
	}

	// Invalidate all CSRF tokens for user
	if err := InvalidateUserCSRFTokens(c, userID.(string)); err != nil {
		log.Printf("ERROR: Failed to invalidate CSRF tokens: %v", err)
	}

	log.Printf("AUDIT: User %s logged out from IP %s", userID, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Logged out successfully"})
}
