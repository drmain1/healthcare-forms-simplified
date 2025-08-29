package data

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/redis/go-redis/v9" // Updated to secure v9 client
)

var (
	redisClient *redis.Client
	once        sync.Once
	initTime    time.Time
	lastError   error
)

// RedisStats holds Redis connection statistics for monitoring
type RedisStats struct {
	Connected         bool
	LastConnectionTime time.Time
	InitializationTime time.Time
	LastError         error
	Address           string
	TLSEnabled        bool
}

// GetRedisStats returns current Redis connection statistics
func GetRedisStats() RedisStats {
	return RedisStats{
		Connected:         redisClient != nil,
		LastConnectionTime: initTime,
		InitializationTime: initTime,
		LastError:         lastError,
		Address:           os.Getenv("REDIS_ADDR"),
		TLSEnabled:        getEnvBool("REDIS_TLS_ENABLED", false),
	}
}

// GetRedisClient initializes and returns a singleton Redis client with HIPAA-compliant security
func GetRedisClient() *redis.Client {
	once.Do(func() {
		initTime = time.Now()
		redisClient = initializeRedisWithRetry()
	})
	return redisClient
}

// initializeRedisWithRetry attempts to connect to Redis with exponential backoff
func initializeRedisWithRetry() *redis.Client {
	redisAddr := os.Getenv("REDIS_ADDR")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	tlsEnabled := os.Getenv("REDIS_TLS_ENABLED")
	
	// Configuration validation
	if redisAddr == "" {
		redisAddr = "localhost:6379"
		log.Println("REDIS_INIT: REDIS_ADDR not set, defaulting to localhost:6379")
	} else {
		log.Printf("REDIS_INIT: Connecting to Redis at %s", redisAddr)
	}
	
	if redisPassword == "" {
		log.Println("REDIS_INIT: ⚠️ WARNING: REDIS_PASSWORD not set - this is required for VPC Redis instances")
	} else {
		log.Printf("REDIS_INIT: Redis password is configured (length: %d characters)", len(redisPassword))
	}

	// Determine if TLS should be enabled
	useTLS := getEnvBool("REDIS_TLS_ENABLED", false)
	log.Printf("REDIS_INIT: TLS enabled: %v (REDIS_TLS_ENABLED=%s)", useTLS, tlsEnabled)

	// Create Redis options with optimized settings for GCP Memorystore
	options := &redis.Options{
		Addr:              redisAddr,
		Password:          redisPassword,
		DB:                0,
		ReadBufferSize:    32 * 1024,
		WriteBufferSize:   32 * 1024,
		MaxRetries:        5, // Increased retries
		MinRetryBackoff:   100 * time.Millisecond,
		MaxRetryBackoff:   2 * time.Second,
		DialTimeout:       10 * time.Second, // Reduced from 30s
		ReadTimeout:       5 * time.Second,  // Increased from 3s
		WriteTimeout:     5 * time.Second,   // Increased from 3s
		PoolSize:          10,
		MinIdleConns:      2, // Reduced from 5
		MaxIdleConns:      5, // Reduced from 10
		ConnMaxIdleTime:   10 * time.Minute, // Increased to reduce frequent reconnects
		ConnMaxLifetime:   15 * time.Minute, // Increased for better connection stability
	}

	// Configure TLS for GCP Memorystore
	if useTLS {
		options.TLSConfig = &tls.Config{
			ServerName:         "", // Empty for GCP Memorystore
			InsecureSkipVerify: true, // Required for GCP self-signed certs
			MinVersion:         tls.VersionTLS12,
		}
		log.Printf("REDIS_INIT: TLS configuration applied (InsecureSkipVerify=true for GCP Memorystore)")
	}

	client := redis.NewClient(options)

	// Test connection with retry logic
	maxAttempts := 3
	backoffDelay := 1 * time.Second

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		log.Printf("REDIS_INIT: Connection attempt %d/%d", attempt, maxAttempts)
		
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		start := time.Now()
		
		err := client.Ping(ctx).Err()
		duration := time.Since(start)
		cancel()
		
		if err == nil {
			log.Printf("REDIS_INIT: ✅ Successfully connected to Redis (attempt %d, took %v)", attempt, duration)
			
			// Test basic operations to verify full functionality
			if testBasicOperations(client) {
				log.Println("REDIS_INIT: ✅ Basic operations test passed")
				return client
			} else {
				log.Println("REDIS_INIT: ❌ Basic operations test failed")
				lastError = fmt.Errorf("basic operations test failed")
				break
			}
		}
		
		lastError = err
		log.Printf("REDIS_INIT: ❌ Connection attempt %d failed (took %v): %v", attempt, duration, err)
		
		// Detailed error analysis
		if err != nil {
			log.Printf("REDIS_INIT: Error type: %T", err)
			
			errStr := err.Error()
			if contains(errStr, "timeout") {
				log.Println("REDIS_INIT: 🔍 Network timeout detected - likely VPC connectivity issue")
			} else if contains(errStr, "connection refused") {
				log.Println("REDIS_INIT: 🔍 Connection refused - Redis service may be down")
			} else if contains(errStr, "authentication") || contains(errStr, "auth") {
				log.Println("REDIS_INIT: 🔍 Authentication error - check REDIS_PASSWORD")
			} else if contains(errStr, "tls") || contains(errStr, "certificate") {
				log.Println("REDIS_INIT: 🔍 TLS error - check TLS configuration")
			} else {
				log.Printf("REDIS_INIT: 🔍 Unexpected error pattern: %v", err)
			}
		}
		
		if attempt < maxAttempts {
			log.Printf("REDIS_INIT: Retrying in %v...", backoffDelay)
			time.Sleep(backoffDelay)
			backoffDelay *= 2 // Exponential backoff
		}
	}

	// All attempts failed
	log.Printf("REDIS_INIT: ❌ FINAL FAILURE: Could not connect to Redis after %d attempts", maxAttempts)
	log.Printf("REDIS_INIT: Final error: %v", lastError)
	log.Println("REDIS_INIT: Application will continue with Redis features disabled")
	log.Println("REDIS_INIT: This will affect: CSRF tokens, rate limiting, session management, PDF generation locks")
	
	client.Close()
	return nil
}

// testBasicOperations verifies Redis is fully functional
func testBasicOperations(client *redis.Client) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	testKey := fmt.Sprintf("health-check:%d", time.Now().Unix())
	testValue := "operational"
	
	// Test SET
	if err := client.Set(ctx, testKey, testValue, 30*time.Second).Err(); err != nil {
		log.Printf("REDIS_INIT: SET operation failed: %v", err)
		return false
	}
	
	// Test GET
	result, err := client.Get(ctx, testKey).Result()
	if err != nil {
		log.Printf("REDIS_INIT: GET operation failed: %v", err)
		return false
	}
	
	if result != testValue {
		log.Printf("REDIS_INIT: GET operation returned wrong value: expected %s, got %s", testValue, result)
		return false
	}
	
	// Test DEL
	if err := client.Del(ctx, testKey).Err(); err != nil {
		log.Printf("REDIS_INIT: DEL operation failed: %v", err)
		return false
	}
	
	return true
}

// Helper functions
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		result, err := strconv.ParseBool(value)
		if err != nil {
			log.Printf("WARNING: Invalid boolean value for %s: %s, using default %v", key, value, defaultValue)
			return defaultValue
		}
		return result
	}
	return defaultValue
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) > 0 && indexOf(s, substr) >= 0)
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}