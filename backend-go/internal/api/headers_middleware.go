package api

import (
	"github.com/gin-gonic/gin"
	"os"
)

func SecurityHeadersMiddleware() gin.HandlerFunc {
	isProd := os.Getenv("ENVIRONMENT") == "production"
	
	return func(c *gin.Context) {
		// Essential security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		
		// HSTS only in production
		if isProd {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}
		
		// Content Security Policy
		// Adjusted for same-origin architecture, Firebase Auth, and custom domain
		csp := "default-src 'self' https://form.easydocforms.com; " +
			   "script-src 'self' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseapp.com https://form.easydocforms.com; " +
			   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://form.easydocforms.com; " +
			   "font-src 'self' https://fonts.gstatic.com data:; " +
			   "img-src 'self' data: https: blob:; " +
			   "connect-src 'self' https://*.firebaseapp.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://form.easydocforms.com; " +
			   "frame-src https://healthcare-forms-v2.firebaseapp.com https://*.firebaseapp.com https://accounts.google.com; " +
			   "frame-ancestors 'none';"
		
		c.Header("Content-Security-Policy", csp)
		
		c.Next()
	}
}