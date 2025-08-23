package api

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

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
		
		// Also generate and set CSRF token upon successful login
		// Pass false for Firebase/custom domain/localhost, true for real cross-origin
		shouldBeSecure := !isFirebaseOrigin && !isCustomDomain && !isLocalhost && 
		                  (c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https")
		GenerateCSRFTokenInternal(c, shouldBeSecure)
		
		c.JSON(http.StatusOK, gin.H{"status": "success", "sessionToken": sessionCookie})
	}
}
