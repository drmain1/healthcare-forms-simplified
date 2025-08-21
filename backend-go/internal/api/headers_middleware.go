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
		// Adjust based on your frontend requirements
		csp := "default-src 'self'; " +
			   "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; " +
			   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
			   "font-src 'self' https://fonts.gstatic.com data:; " +
			   "img-src 'self' data: https: blob:; " +
			   "connect-src 'self' https://firebaseapp.com https://firebaseio.com https://googleapis.com; " +
			   "frame-ancestors 'none';"
		
		c.Header("Content-Security-Policy", csp)
		
		c.Next()
	}
}