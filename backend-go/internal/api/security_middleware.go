package api

import (
	"github.com/gin-gonic/gin"
	"backend-go/internal/services"
	"net/http"
	"io/ioutil"
	"encoding/json"
	"bytes"
	"sync"
	"time"
)

// Global rate limiter instance
var (
	rateLimiter     *services.RateLimiter
	rateLimiterOnce sync.Once
)

func initRateLimiter() {
	rateLimiterOnce.Do(func() {
		// 60 requests per minute per user
		rateLimiter = services.NewRateLimiter(60, time.Minute)
	})
}

func SecurityMiddleware(validator *services.SecurityValidator) gin.HandlerFunc {
	initRateLimiter()
	
	return func(c *gin.Context) {
		// Skip for health checks
		if c.Request.URL.Path == "/health" {
			c.Next()
			return
		}
		
		// Apply rate limiting for authenticated users
		if userID, exists := c.Get("userID"); exists {
			if !rateLimiter.Allow(userID.(string)) {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error": "Rate limit exceeded. Please try again later.",
					"code": "RATE_LIMIT_EXCEEDED",
				})
				c.Abort()
				return
			}
		}
		
		// Validate request body for POST/PUT/PATCH
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			if c.ContentType() == "application/json" {
				// Read body
				bodyBytes, err := ioutil.ReadAll(c.Request.Body)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Invalid request body",
						"code": "INVALID_BODY",
					})
					c.Abort()
					return
				}
				
				// Check request size (max 10MB)
				if len(bodyBytes) > 10*1024*1024 {
					c.JSON(http.StatusRequestEntityTooLarge, gin.H{
						"error": "Request body too large",
						"code": "PAYLOAD_TOO_LARGE",
					})
					c.Abort()
					return
				}
				
				// Restore body for downstream
				c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
				
				// Parse JSON
				var requestData map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &requestData); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Invalid JSON format",
						"code": "INVALID_JSON",
					})
					c.Abort()
					return
				}
				
				// Validate and sanitize
				userID, _ := c.Get("userID")
				result, err := validator.ValidateAndSanitize(toStringValue(userID), requestData)
				if err != nil || !result.IsValid {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Input validation failed",
						"code": "VALIDATION_FAILED",
						"details": result.Errors,
					})
					c.Abort()
					return
				}
				
				// Store sanitized data
				c.Set("sanitizedData", result.SanitizedData)
				
				// Replace body with sanitized version
				sanitizedBytes, _ := json.Marshal(result.SanitizedData)
				c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(sanitizedBytes))
			}
		}
		
		c.Next()
	}
}

func toStringValue(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}