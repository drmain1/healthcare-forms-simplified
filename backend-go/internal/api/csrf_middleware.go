package api

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"log"
)

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "X-CSRF-Token"

// CSRFMiddleware creates a middleware that provides CSRF protection.
func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF protection for static files and non-API routes
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/static/") || 
		   path == "/favicon.ico" || 
		   path == "/logo192.png" || 
		   path == "/logo512.png" || 
		   path == "/manifest.json" || 
		   path == "/robots.txt" {
			c.Next()
			return
		}
		
		// For state-changing methods, validate the token.
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" || c.Request.Method == "DELETE" {
			headerToken := c.GetHeader(CSRF_HEADER_NAME)
			cookieToken, cookieErr := c.Cookie(CSRF_COOKIE_NAME)

			// Debug logging
			log.Printf("CSRF Check - Method: %s, Path: %s, Header Token: %s, Cookie Token: %s, Cookie Error: %v",
				c.Request.Method, c.Request.URL.Path, headerToken, cookieToken, cookieErr)

			// For Firebase Hosting and custom domain, we rely on header token since cookies don't work through proxy
			// For local development, we validate both cookie and header match
			origin := c.Request.Header.Get("Origin")
			isFirebaseOrigin := strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app")
			isCustomDomain := strings.Contains(origin, "form.easydocforms.com")
			
			validToken := false
			if isFirebaseOrigin || isCustomDomain {
				// Firebase Hosting and custom domain: Just check header token exists and is valid format
				if headerToken != "" && len(headerToken) == 36 { // UUID format
					validToken = true
					log.Printf("CSRF validation for same-origin domain - using header token only")
				}
			} else {
				// Local/other: Traditional cookie+header validation
				if cookieErr == nil && headerToken != "" && cookieToken != "" && headerToken == cookieToken {
					validToken = true
					log.Printf("CSRF validation for non-Firebase origin - cookie and header match")
				}
			}

			if !validToken {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Invalid CSRF token",
					"code":  "CSRF_VALIDATION_FAILED",
					"debug": gin.H{
						"hasHeader": headerToken != "",
						"hasCookie": cookieErr == nil && cookieToken != "",
						"match": headerToken == cookieToken,
						"isFirebaseOrigin": isFirebaseOrigin,
						"isCustomDomain": isCustomDomain,
					},
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// GenerateCSRFToken generates a new CSRF token and sets it as a cookie.
// This should be called upon successful user login.
func GenerateCSRFToken(c *gin.Context) {
	token := uuid.New().String()
	
	// Determine if we're in a secure context (HTTPS) - but not for localhost
	origin := c.Request.Header.Get("Origin")
	
	// For Firebase hosting proxy and custom domain, we're actually same-origin, so don't use Secure flag
	isFirebaseOrigin := strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app")
	isCustomDomain := strings.Contains(origin, "form.easydocforms.com")
	isLocalhost := strings.HasPrefix(origin, "http://localhost")
	
	// Only use Secure flag for true cross-origin HTTPS, not for Firebase proxy, custom domain, or localhost
	isSecure := !isLocalhost && !isFirebaseOrigin && !isCustomDomain && 
	           (c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https")
	
	// Set the cookie that the frontend will read.
	// HttpOnly should be false so JS can read it.
	// When behind Firebase Hosting proxy or custom domain, treat as same-origin
	if isFirebaseOrigin || isCustomDomain {
		c.SetSameSite(http.SameSiteLaxMode) // Use Lax for same-origin to ensure cookie is sent
		log.Printf("Setting CSRF cookie with SameSite=Lax for same-origin (no Secure flag): %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			false, // No Secure flag for same-origin
			false, // HttpOnly = false
		)
	} else if isLocalhost {
		c.SetSameSite(http.SameSiteLaxMode)
		log.Printf("Setting CSRF cookie with SameSite=Lax for localhost: %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			false, // No Secure flag for localhost
			false, // HttpOnly = false
		)
	} else {
		c.SetSameSite(http.SameSiteNoneMode)
		log.Printf("Setting CSRF cookie with SameSite=None for cross-origin: %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			true, // Secure flag for cross-origin
			false, // HttpOnly = false
		)
	}

	log.Printf("Generated CSRF token: %s, Secure: %v, Origin: %s", token, isSecure, origin)

	// Also return it in the body for convenience if needed, e.g., for initial fetch.
	c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}

// GenerateCSRFTokenInternal generates a new CSRF token for internal use (doesn't write JSON response)
func GenerateCSRFTokenInternal(c *gin.Context, isSecureParam bool) string {
	token := uuid.New().String()
	
	origin := c.Request.Header.Get("Origin")
	
	// For Firebase hosting proxy and custom domain, we're actually same-origin, so don't use Secure flag
	isFirebaseOrigin := strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app")
	isCustomDomain := strings.Contains(origin, "form.easydocforms.com")
	isLocalhost := strings.HasPrefix(origin, "http://localhost")
	
	// Set the cookie that the frontend will read.
	// HttpOnly should be false so JS can read it.
	// When behind Firebase Hosting proxy or custom domain, treat as same-origin
	if isFirebaseOrigin || isCustomDomain {
		c.SetSameSite(http.SameSiteLaxMode)
		log.Printf("Setting internal CSRF cookie with SameSite=Lax for same-origin (no Secure flag): %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			false, // No Secure flag for same-origin
			false, // HttpOnly = false
		)
	} else if isLocalhost {
		c.SetSameSite(http.SameSiteLaxMode)
		log.Printf("Setting internal CSRF cookie with SameSite=Lax for localhost: %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			false, // No Secure flag for localhost
			false, // HttpOnly = false
		)
	} else {
		c.SetSameSite(http.SameSiteNoneMode)
		log.Printf("Setting internal CSRF cookie with SameSite=None for cross-origin: %s", origin)
		c.SetCookie(
			CSRF_COOKIE_NAME,
			token,
			3600*24, // 24 hours
			"/",
			"", // Empty domain to use current domain
			isSecureParam, // Use passed secure flag for cross-origin
			false, // HttpOnly = false
		)
	}
	
	log.Printf("Generated internal CSRF token: %s, Origin: %s", token, origin)
	
	return token
}