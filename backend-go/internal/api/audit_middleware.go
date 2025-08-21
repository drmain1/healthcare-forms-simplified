package api

import (
	"github.com/gin-gonic/gin"
	"backend-go/internal/services"
	"time"
	"strings"
)

func AuditMiddleware(auditLogger *services.CloudAuditLogger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip health checks
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}
		
		startTime := time.Now()
		
		// Capture request details
		userID, _ := c.Get("userID")
		userEmail, _ := c.Get("email")
		
		// Process request
		c.Next()
		
		// Determine resource info from path
		resourceType, resourceID := parseResourceInfo(c.Request.URL.Path)
		
		// Create audit entry
		entry := services.AuditEntry{
			Timestamp:    startTime,
			UserID:       toString(userID),
			UserEmail:    toString(userEmail),
			Action:       c.Request.Method + " " + c.Request.URL.Path,
			ResourceType: resourceType,
			ResourceID:   resourceID,
			IPAddress:    c.ClientIP(),
			UserAgent:    c.Request.UserAgent(),
			Success:      c.Writer.Status() < 400,
			Metadata: map[string]interface{}{
				"status_code": c.Writer.Status(),
				"duration_ms": time.Since(startTime).Milliseconds(),
				"method":      c.Request.Method,
			},
		}
		
		// Log asynchronously to not block response
		go auditLogger.LogAccess(c.Request.Context(), entry)
	}
}

func parseResourceInfo(path string) (string, string) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 && parts[0] == "api" {
		switch parts[1] {
		case "forms":
			if len(parts) > 2 {
				return "form", parts[2]
			}
			return "forms", "list"
		case "responses":
			if len(parts) > 2 {
				return "response", parts[2]
			}
			return "responses", "list"
		case "organizations":
			if len(parts) > 2 {
				return "organization", parts[2]
			}
			return "organizations", "list"
		}
	}
	return "api", path
}

func toString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}