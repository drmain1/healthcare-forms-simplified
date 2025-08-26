package api

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
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

// Emergency in-memory CSRF token store for when Redis is unavailable
type emergencyCSRFStore struct {
	mu     sync.RWMutex
	tokens map[string]time.Time // token -> expiry time
}

var emergencyStore = &emergencyCSRFStore{
	tokens: make(map[string]time.Time),
}

// cleanExpiredTokens removes expired tokens from emergency store
func (e *emergencyCSRFStore) cleanExpiredTokens() {
	e.mu.Lock()
	defer e.mu.Unlock()
	
	now := time.Now()
	for token, expiry := range e.tokens {
		if now.After(expiry) {
			delete(e.tokens, token)
		}
	}
}

// storeToken adds a token to emergency store
func (e *emergencyCSRFStore) storeToken(token string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.tokens[token] = time.Now().Add(CSRF_TTL)
}

// validateToken checks if token exists and is valid
func (e *emergencyCSRFStore) validateToken(token string) bool {
	e.mu.RLock()
	defer e.mu.RUnlock()
	
	expiry, exists := e.tokens[token]
	if !exists {
		return false
	}
	
	if time.Now().After(expiry) {
		// Token expired, remove it
		delete(e.tokens, token)
		return false
	}
	
	return true
}

// isPDFGenerationEndpoint checks if the current request is for PDF generation
func isPDFGenerationEndpoint(path string) bool {
	return strings.Contains(path, "/generate-pdf") || strings.Contains(path, "/pdf")
}

// CSRFMiddleware validates CSRF tokens stored in Redis
func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF for non-state-changing methods
		if c.Request.Method != "POST" && c.Request.Method != "PUT" && 
		   c.Request.Method != "PATCH" && c.Request.Method != "DELETE" {
			c.Next()
			return
		}

		// Clean expired emergency tokens periodically
		emergencyStore.cleanExpiredTokens()

		headerToken := c.GetHeader(CSRF_HEADER_NAME)
		userID, userExists := c.Get("userID")
		
		// Check if Redis is available
		redisClient := data.GetRedisClient()
		redisAvailable := redisClient != nil
		isPDFEndpoint := isPDFGenerationEndpoint(c.Request.URL.Path)
		
		log.Printf("CSRF_DEBUG: %s %s - Token:%s, User:%v, Redis:%v, PDF:%v", 
			c.Request.Method, c.Request.URL.Path, 
			maskToken(headerToken), userExists, redisAvailable, isPDFEndpoint)

		if headerToken == "" {
			// MIGRATION: Check if user is authenticated but missing CSRF token
			// This handles existing sessions that were created before CSRF implementation
			if userExists {
				log.Printf("MIGRATION: Generating CSRF token for existing authenticated user %s from IP %s", 
					userID, c.ClientIP())
				
				// Try to generate token (will use Redis if available, emergency store if not)
				newToken := GenerateCSRFTokenInternal(c, userID.(string))
				if newToken != "" {
					c.Header("X-CSRF-Token-Generated", newToken)
					log.Printf("AUDIT: Generated CSRF token for existing session user %s (Redis:%v)", userID, redisAvailable)
					c.Next()
					return
				} else if isPDFEndpoint {
					// For PDF generation, create emergency token even if generation failed
					emergencyToken := generateEmergencyCSRFToken(userID.(string))
					c.Header("X-CSRF-Token-Generated", emergencyToken)
					log.Printf("EMERGENCY: Generated emergency CSRF token for PDF generation user %s", userID)
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
		if !userExists {
			log.Printf("SECURITY: CSRF check failed - user not authenticated for %s %s", 
				c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated for CSRF check"})
			c.Abort()
			return
		}

		// Validate CSRF token
		if redisAvailable {
			// Use Redis for validation
			key := fmt.Sprintf("csrf:%s:%s", userID.(string), headerToken)
			err := redisClient.Get(c.Request.Context(), key).Err()
			
			if err == redis.Nil {
				log.Printf("SECURITY: CSRF validation failed for user %s from IP %s - token not found in Redis", 
					userID, c.ClientIP())
				
				// For PDF generation, fall back to emergency store
				if isPDFEndpoint && emergencyStore.validateToken(headerToken) {
					log.Printf("EMERGENCY: CSRF validation passed via emergency store for PDF generation user %s", userID)
					c.Next()
					return
				}
				
				c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired CSRF token"})
				c.Abort()
				return
			} else if err != nil {
				log.Printf("ERROR: Redis error during CSRF validation: %v", err)
				
				// For PDF generation, fall back to emergency store
				if isPDFEndpoint && emergencyStore.validateToken(headerToken) {
					log.Printf("EMERGENCY: CSRF validation passed via emergency store after Redis error for user %s", userID)
					c.Next()
					return
				}
				
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error during CSRF validation"})
				c.Abort()
				return
			}
			
			log.Printf("AUDIT: CSRF validation successful via Redis for user %s, action: %s %s", 
				userID, c.Request.Method, c.Request.URL.Path)
			c.Next()
		} else {
			// Redis unavailable - use emergency store
			if emergencyStore.validateToken(headerToken) {
				log.Printf("EMERGENCY: CSRF validation successful via emergency store for user %s, action: %s %s", 
					userID, c.Request.Method, c.Request.URL.Path)
				c.Next()
			} else {
				log.Printf("SECURITY: CSRF validation failed for user %s from IP %s - token not found in emergency store", 
					userID, c.ClientIP())
				
				// For PDF generation, be more lenient and allow the request
				if isPDFEndpoint {
					log.Printf("EMERGENCY: Allowing PDF generation request without valid CSRF token for user %s (Redis unavailable)", userID)
					c.Next()
				} else {
					c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired CSRF token (emergency mode)"})
					c.Abort()
				}
			}
		}
	}
}

// generateEmergencyCSRFToken creates a token for emergency use when Redis is unavailable
func generateEmergencyCSRFToken(userID string) string {
	token := uuid.New().String()
	emergencyStore.storeToken(token)
	log.Printf("EMERGENCY: Generated and stored emergency CSRF token for user %s", userID)
	return token
}

// maskToken masks a token for logging purposes - use the existing one from csrf_diagnostics.go

// GenerateCSRFToken endpoint for standalone CSRF token generation
func GenerateCSRFToken(c *gin.Context) {
	// Check if user is authenticated
	userID, exists := c.Get("userID")
	if !exists {
		// If not authenticated, this endpoint requires auth middleware
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required for CSRF token generation"})
		return
	}
	
	// Generate and store token (will use Redis or emergency store)
	token := GenerateCSRFTokenInternal(c, userID.(string))
	if token == "" {
		// If both Redis and emergency store failed, try emergency generation
		token = generateEmergencyCSRFToken(userID.(string))
		if token == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"csrfToken": token, "emergency": true})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}

// GenerateCSRFTokenInternal creates and stores CSRF token in Redis (or emergency store if Redis unavailable)
func GenerateCSRFTokenInternal(c *gin.Context, userID string) string {
	token := uuid.New().String()
	redisClient := data.GetRedisClient()
	
	if redisClient != nil {
		// Try Redis first
		key := fmt.Sprintf("csrf:%s:%s", userID, token)
		
		// Store token in Redis with TTL
		err := redisClient.Set(c.Request.Context(), key, "valid", CSRF_TTL).Err()
		if err != nil {
			log.Printf("ERROR: Failed to store CSRF token in Redis: %v", err)
			log.Printf("FALLBACK: Using emergency store for CSRF token generation - user %s", userID)
			// Fall back to emergency store
			emergencyStore.storeToken(token)
			return token
		}

		log.Printf("AUDIT: Generated CSRF token in Redis for user %s from IP %s", userID, c.ClientIP())
		return token
	} else {
		// Redis unavailable - use emergency store
		log.Printf("WARNING: Redis unavailable for CSRF token generation, using emergency store - user %s from IP %s", 
			userID, c.ClientIP())
		emergencyStore.storeToken(token)
		log.Printf("EMERGENCY: Generated CSRF token in emergency store for user %s", userID)
		return token
	}
}

// InvalidateUserCSRFTokens removes all CSRF tokens for a user (logout)
func InvalidateUserCSRFTokens(ctx *gin.Context, userID string) error {
	redisClient := data.GetRedisClient()
	if redisClient == nil {
		log.Printf("WARNING: Redis unavailable for CSRF token invalidation - user %s", userID)
		return nil // Return nil since it's not a critical failure
	}
	
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