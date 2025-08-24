package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"backend-go/internal/data"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	CSRF_HEADER_NAME = "X-CSRF-Token"
	CSRF_TTL = 4 * time.Hour // HIPAA compliant TTL
)

// CSRFMiddleware validates CSRF tokens stored in Redis
func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF for non-state-changing methods
		if c.Request.Method != "POST" && c.Request.Method != "PUT" && 
		   c.Request.Method != "PATCH" && c.Request.Method != "DELETE" {
			c.Next()
			return
		}

		headerToken := c.GetHeader(CSRF_HEADER_NAME)
		if headerToken == "" {
			// MIGRATION: Check if user is authenticated but missing CSRF token
			// This handles existing sessions that were created before CSRF implementation
			if userID, exists := c.Get("userID"); exists {
				log.Printf("MIGRATION: Generating CSRF token for existing authenticated user %s from IP %s", 
					userID, c.ClientIP())
				newToken := GenerateCSRFTokenInternal(c, userID.(string))
				if newToken != "" {
					c.Header("X-CSRF-Token-Generated", newToken)
					log.Printf("AUDIT: Generated CSRF token for existing session user %s", userID)
					c.Next()
					return
				}
			}
			
			log.Printf("SECURITY: CSRF token missing for %s %s from IP %s", 
				c.Request.Method, c.Request.URL.Path, c.ClientIP())
			c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token not provided in header"})
			c.Abort()
			return
		}

		// Get user ID from auth middleware context
		userID, exists := c.Get("userID")
		if !exists {
			log.Printf("SECURITY: CSRF check failed - user not authenticated for %s %s", 
				c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated for CSRF check"})
			c.Abort()
			return
		}

		redisClient := data.GetRedisClient()
		key := fmt.Sprintf("csrf:%s:%s", userID.(string), headerToken)

		// Validate token exists in Redis
		err := redisClient.Get(c.Request.Context(), key).Err()
		if err == redis.Nil {
			log.Printf("SECURITY: CSRF validation failed for user %s from IP %s - token not found", 
				userID, c.ClientIP())
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired CSRF token"})
			c.Abort()
			return
		} else if err != nil {
			log.Printf("ERROR: Redis error during CSRF validation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error during CSRF validation"})
			c.Abort()
			return
		}

		log.Printf("AUDIT: CSRF validation successful for user %s, action: %s %s", 
			userID, c.Request.Method, c.Request.URL.Path)
		c.Next()
	}
}

// GenerateCSRFToken endpoint for standalone CSRF token generation
func GenerateCSRFToken(c *gin.Context) {
	// For now, return a generic token - this will be enhanced when we have user context
	token := uuid.New().String()
	c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}

// GenerateCSRFTokenInternal creates and stores CSRF token in Redis
func GenerateCSRFTokenInternal(c *gin.Context, userID string) string {
	token := uuid.New().String()
	redisClient := data.GetRedisClient()
	key := fmt.Sprintf("csrf:%s:%s", userID, token)
	
	// Store token in Redis with TTL
	err := redisClient.Set(c.Request.Context(), key, "valid", CSRF_TTL).Err()
	if err != nil {
		log.Printf("ERROR: Failed to store CSRF token in Redis: %v", err)
		return ""
	}

	log.Printf("AUDIT: Generated CSRF token for user %s from IP %s", userID, c.ClientIP())
	return token
}

// InvalidateUserCSRFTokens removes all CSRF tokens for a user (logout)
func InvalidateUserCSRFTokens(ctx *gin.Context, userID string) error {
	redisClient := data.GetRedisClient()
	pattern := fmt.Sprintf("csrf:%s:*", userID)
	
	keys, err := redisClient.Keys(ctx.Request.Context(), pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get CSRF keys: %w", err)
	}
	
	if len(keys) > 0 {
		if err := redisClient.Del(ctx.Request.Context(), keys...).Err(); err != nil {
			return fmt.Errorf("failed to delete CSRF tokens: %w", err)
		}
		log.Printf("AUDIT: Invalidated %d CSRF tokens for user %s", len(keys), userID)
	}
	
	return nil
}