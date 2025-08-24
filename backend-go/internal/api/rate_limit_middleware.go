package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"backend-go/internal/data"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiterConfig defines rate limiting configuration
type RateLimiterConfig struct {
	RequestsPerWindow int
	WindowDuration    time.Duration
	BurstAllowance    int // Allow brief bursts above limit
}

// Default configurations for different endpoint types
var (
	AuthRateLimit = RateLimiterConfig{RequestsPerWindow: 5, WindowDuration: 1 * time.Minute, BurstAllowance: 2}
	APIRateLimit  = RateLimiterConfig{RequestsPerWindow: 100, WindowDuration: 1 * time.Minute, BurstAllowance: 10}
	PDFRateLimit  = RateLimiterConfig{RequestsPerWindow: 10, WindowDuration: 1 * time.Minute, BurstAllowance: 2}
)

// RateLimiterMiddleware creates rate limiting middleware with HIPAA compliance
func RateLimiterMiddleware(config RateLimiterConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use authenticated user ID or IP address
		identifier := c.ClientIP()
		if userID, exists := c.Get("userID"); exists {
			identifier = fmt.Sprintf("user:%s", userID.(string))
		}

		redisClient := data.GetRedisClient()
		if redisClient == nil {
			log.Printf("WARNING: Redis unavailable for rate limiting, allowing request")
			c.Next() // Fail open for availability
			return
		}
		
		// Sliding window rate limiting using Redis sorted sets
		now := time.Now().Unix()
		windowStart := now - int64(config.WindowDuration.Seconds())
		
		key := fmt.Sprintf("ratelimit:%s", identifier)
		
		// Remove old entries outside the window
		err := redisClient.ZRemRangeByScore(c.Request.Context(), key, "0", fmt.Sprintf("%d", windowStart)).Err()
		if err != nil {
			log.Printf("ERROR: Redis ZREMRANGEBYSCORE error in rate limiter: %v", err)
			c.Next() // Fail open for availability
			return
		}
		
		// Count requests in current window
		count, err := redisClient.ZCard(c.Request.Context(), key).Result()
		if err != nil {
			log.Printf("ERROR: Redis ZCARD error in rate limiter: %v", err)
			c.Next() // Fail open for availability
			return
		}
		
		// Check rate limit with burst allowance
		limit := int64(config.RequestsPerWindow + config.BurstAllowance)
		if count >= limit {
			log.Printf("SECURITY: Rate limit exceeded for %s. Count: %d, Limit: %d, Endpoint: %s %s", 
				identifier, count, limit, c.Request.Method, c.Request.URL.Path)
			
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerWindow))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", now+int64(config.WindowDuration.Seconds())))
			
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
				"retry_after": int(config.WindowDuration.Seconds()),
				"limit": config.RequestsPerWindow,
				"window": config.WindowDuration.String(),
			})
			c.Abort()
			return
		}
		
		// Add current request to the window with score as timestamp
		member := fmt.Sprintf("%d_%s", now, identifier) // Unique member to avoid collisions
		err = redisClient.ZAdd(c.Request.Context(), key, redis.Z{
			Score:  float64(now),
			Member: member,
		}).Err()
		if err != nil {
			log.Printf("ERROR: Redis ZADD error in rate limiter: %v", err)
			// Don't fail the request, just log the error
		}
		
		// Set expiration for cleanup (window duration + buffer)
		redisClient.Expire(c.Request.Context(), key, config.WindowDuration+time.Minute)
		
		remaining := limit - count - 1
		if remaining < 0 {
			remaining = 0
		}
		
		// Add rate limit headers for client information
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerWindow))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", now+int64(config.WindowDuration.Seconds())))
		
		// Audit log for high request rates (warning at 80% of limit)
		warningThreshold := int64(float64(config.RequestsPerWindow) * 0.8)
		if count >= warningThreshold {
			log.Printf("AUDIT: High request rate for %s. Count: %d, Limit: %d, Endpoint: %s %s", 
				identifier, count, config.RequestsPerWindow, c.Request.Method, c.Request.URL.Path)
		}
		
		c.Next()
	}
}

// GetRateLimitStatus returns current rate limit status for a user
func GetRateLimitStatus(c *gin.Context, config RateLimiterConfig) (int64, int64, error) {
	identifier := c.ClientIP()
	if userID, exists := c.Get("userID"); exists {
		identifier = fmt.Sprintf("user:%s", userID.(string))
	}

	redisClient := data.GetRedisClient()
	if redisClient == nil {
		return 0, int64(config.RequestsPerWindow), fmt.Errorf("redis unavailable")
	}
	
	now := time.Now().Unix()
	windowStart := now - int64(config.WindowDuration.Seconds())
	key := fmt.Sprintf("ratelimit:%s", identifier)
	
	// Clean old entries and get current count
	redisClient.ZRemRangeByScore(c.Request.Context(), key, "0", fmt.Sprintf("%d", windowStart))
	count, err := redisClient.ZCard(c.Request.Context(), key).Result()
	if err != nil {
		return 0, int64(config.RequestsPerWindow), err
	}
	
	remaining := int64(config.RequestsPerWindow) - count
	if remaining < 0 {
		remaining = 0
	}
	
	return count, remaining, nil
}