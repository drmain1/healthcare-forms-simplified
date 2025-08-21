package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "X-CSRF-Token"

// CSRFMiddleware creates a middleware that provides CSRF protection.
func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// For state-changing methods, validate the token.
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" || c.Request.Method == "DELETE" {
			headerToken := c.GetHeader(CSRF_HEADER_NAME)
			cookieToken, err := c.Cookie(CSRF_COOKIE_NAME)

			if err != nil || headerToken == "" || cookieToken == "" || headerToken != cookieToken {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Invalid CSRF token",
					"code":  "CSRF_VALIDATION_FAILED",
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
	
	// Set the cookie that the frontend will read.
	// HttpOnly should be false so JS can read it. Secure should be true in prod.
	c.SetCookie(
		CSRF_COOKIE_NAME,
		token,
		3600*24, // 24 hours
		"/",
		c.Request.URL.Host, // Set domain dynamically
		true, // Secure flag
		false, // HttpOnly = false
	)

	// Also return it in the body for convenience if needed, e.g., for initial fetch.
	c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}