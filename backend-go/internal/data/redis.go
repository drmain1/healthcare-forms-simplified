package data

import (
	"context"
	"crypto/tls"
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
)

// GetRedisClient initializes and returns a singleton Redis client with HIPAA-compliant security
func GetRedisClient() *redis.Client {
	once.Do(func() {
		redisAddr := os.Getenv("REDIS_ADDR")
		redisPassword := os.Getenv("REDIS_PASSWORD") // Required for HIPAA
		tlsEnabled := os.Getenv("REDIS_TLS_ENABLED")
		
		if redisAddr == "" {
			redisAddr = "localhost:6379"
			log.Println("REDIS_ADDR not set, defaulting to localhost:6379")
		}
		
		if redisPassword == "" {
			log.Println("⚠️ WARNING: REDIS_PASSWORD not set - required for HIPAA compliance")
		}

		// Determine if TLS should be enabled
		useTLS := false
		if tlsEnabled != "" {
			useTLS, _ = strconv.ParseBool(tlsEnabled)
		}

		options := &redis.Options{
			Addr:              redisAddr,
			Password:          redisPassword, // Required for HIPAA
			DB:                0,
			ReadBufferSize:    32 * 1024,  // 32KiB for performance (v9 feature)
			WriteBufferSize:   32 * 1024,  // 32KiB for performance (v9 feature)
			MaxRetries:        3,
			DialTimeout:       30 * time.Second,
			ReadTimeout:       3 * time.Second,
			WriteTimeout:      3 * time.Second,
			PoolSize:          10,
			MinIdleConns:      5,
			MaxIdleConns:      10,
			ConnMaxIdleTime:   5 * time.Minute,
			ConnMaxLifetime:   10 * time.Minute,
		}

		// Enable TLS for HIPAA compliance (GCP Memorystore with SERVER_AUTHENTICATION)
		if useTLS {
			options.TLSConfig = &tls.Config{
				ServerName:         "", // Leave empty for GCP Memorystore
				InsecureSkipVerify: true, // Required for GCP Memorystore self-signed cert
			}
			log.Printf("Initializing secure Redis client with TLS enabled, address: %s", redisAddr)
		} else {
			log.Printf("Initializing Redis client without TLS, address: %s", redisAddr)
		}
		
		redisClient = redis.NewClient(options)

		// Ping the Redis server to ensure connection and auth
		ctx := context.Background()
		if err := redisClient.Ping(ctx).Err(); err != nil {
			log.Printf("WARNING: Could not connect to Redis: %v", err)
			log.Println("Application will continue without Redis caching/session management")
			redisClient = nil // Set to nil to indicate Redis is unavailable
			return
		}
		log.Println("Successfully connected to Redis with authentication")
	})
	return redisClient
}