package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisTestConfig holds configuration for a Redis instance test
type RedisTestConfig struct {
	Name        string
	Addr        string
	Password    string
	TLSEnabled  bool
	Description string
}

func main() {
	fmt.Println("=== Redis Connectivity Test ===")
	fmt.Println()

	// Test configurations
	configs := []RedisTestConfig{
		{
			Name:        "VPC-NEW",
			Addr:        "10.37.219.28:6378",
			Password:    os.Getenv("REDIS_PASSWORD"),
			TLSEnabled:  true,
			Description: "New VPC-based Redis instance (healthcare-vpc)",
		},
		{
			Name:        "DEFAULT-OLD",
			Addr:        "10.35.139.228:6378", 
			Password:    "8df0d1f3-e164-46df-b112-ff558446aa73",
			TLSEnabled:  true,
			Description: "Old default network Redis instance",
		},
		{
			Name:        "LOCAL",
			Addr:        "localhost:6379",
			Password:    "",
			TLSEnabled:  false,
			Description: "Local development Redis (optional)",
		},
	}

	// Test environment variables
	fmt.Printf("Environment Variables:\n")
	fmt.Printf("  REDIS_ADDR=%s\n", os.Getenv("REDIS_ADDR"))
	fmt.Printf("  REDIS_PASSWORD=%s\n", maskPassword(os.Getenv("REDIS_PASSWORD")))
	fmt.Printf("  REDIS_TLS_ENABLED=%s\n", os.Getenv("REDIS_TLS_ENABLED"))
	fmt.Printf("  GCP_PROJECT_ID=%s\n", os.Getenv("GCP_PROJECT_ID"))
	fmt.Println()

	// Test each configuration
	for _, config := range configs {
		fmt.Printf("--- Testing %s ---\n", config.Name)
		fmt.Printf("Description: %s\n", config.Description)
		fmt.Printf("Address: %s\n", config.Addr)
		fmt.Printf("TLS: %v\n", config.TLSEnabled)
		fmt.Printf("Auth: %s\n", maskPassword(config.Password))
		
		success := testRedisConnection(config)
		if success {
			fmt.Printf("✅ %s: Connection successful\n", config.Name)
		} else {
			fmt.Printf("❌ %s: Connection failed\n", config.Name)
		}
		fmt.Println()
	}

	// Test using environment variables (production config)
	fmt.Println("--- Testing Production Environment Config ---")
	prodConfig := RedisTestConfig{
		Name:        "PRODUCTION", 
		Addr:        getEnvOrDefault("REDIS_ADDR", "10.37.219.28:6378"),
		Password:    os.Getenv("REDIS_PASSWORD"),
		TLSEnabled:  getEnvBool("REDIS_TLS_ENABLED", true),
		Description: "Configuration from environment variables",
	}
	
	success := testRedisConnection(prodConfig)
	if success {
		fmt.Printf("✅ PRODUCTION: Environment config working\n")
	} else {
		fmt.Printf("❌ PRODUCTION: Environment config failed\n")
	}
}

func testRedisConnection(config RedisTestConfig) bool {
	options := &redis.Options{
		Addr:         config.Addr,
		Password:     config.Password,
		DB:           0,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	// Configure TLS if enabled
	if config.TLSEnabled {
		options.TLSConfig = &tls.Config{
			ServerName:         "",
			InsecureSkipVerify: true, // Required for GCP Memorystore
		}
		fmt.Printf("  TLS Config: InsecureSkipVerify=true\n")
	}

	client := redis.NewClient(options)
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Test 1: Basic connectivity
	fmt.Printf("  Test 1: PING command... ")
	start := time.Now()
	result, err := client.Ping(ctx).Result()
	duration := time.Since(start)
	
	if err != nil {
		fmt.Printf("FAILED (%v) - %v\n", duration, err)
		return false
	}
	fmt.Printf("SUCCESS (%v) - %s\n", duration, result)

	// Test 2: SET/GET operations
	fmt.Printf("  Test 2: SET/GET operations... ")
	testKey := fmt.Sprintf("test:%d", time.Now().Unix())
	testValue := "connectivity-test"

	start = time.Now()
	err = client.Set(ctx, testKey, testValue, 30*time.Second).Err()
	if err != nil {
		fmt.Printf("FAILED (SET) - %v\n", err)
		return false
	}

	getValue, err := client.Get(ctx, testKey).Result()
	duration = time.Since(start)
	
	if err != nil {
		fmt.Printf("FAILED (GET) - %v\n", err)
		return false
	}

	if getValue != testValue {
		fmt.Printf("FAILED - Value mismatch: expected=%s, got=%s\n", testValue, getValue)
		return false
	}
	fmt.Printf("SUCCESS (%v)\n", duration)

	// Test 3: TTL operations
	fmt.Printf("  Test 3: TTL operations... ")
	ttl, err := client.TTL(ctx, testKey).Result()
	if err != nil {
		fmt.Printf("FAILED - %v\n", err)
		return false
	}
	fmt.Printf("SUCCESS - TTL: %v\n", ttl)

	// Clean up test key
	client.Del(ctx, testKey)

	return true
}

func maskPassword(password string) string {
	if password == "" {
		return "(empty)"
	}
	if len(password) <= 4 {
		return "****"
	}
	return password[:2] + "****" + password[len(password)-2:]
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		result, err := strconv.ParseBool(value)
		if err != nil {
			log.Printf("Warning: Invalid boolean value for %s: %s, using default %v", key, value, defaultValue)
			return defaultValue
		}
		return result
	}
	return defaultValue
}