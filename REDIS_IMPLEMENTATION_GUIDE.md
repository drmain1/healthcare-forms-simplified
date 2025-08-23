
# Redis Implementation Guide for HIPAA Compliance & Scaling

**Objective:** This guide provides a step-by-step plan for a developer to implement a robust, Redis-backed architecture for session management, security, and distributed coordination. This is a critical requirement for achieving HIPAA compliance and enabling the application to scale horizontally on Google Cloud Run.

**Target Audience:** A developer new to the project, with a working knowledge of Go.

**Context:** Our application runs in multiple instances on Cloud Run. In-memory storage is isolated to each instance, which creates critical failures in security and data consistency. We will use a centralized Redis instance (GCP Memorystore) to solve these problems.

---

## Phase 1: Foundational Setup - Centralized Redis Client

Before implementing features, we need a standardized way to connect to Redis throughout the application.

### Step 1.1: Create a Centralized Redis Service

We will create a single file to manage the Redis connection, ensuring all parts of the application use the same client and connection pool.

1.  **Create a new file:** `backend-go/internal/data/redis.go`
2.  **Add the following code to the file:**

    ```go
    package data

    import (
    	"context"
    	"log"
    	"os"
    	"sync"

    	"github.com/go-redis/redis/v8"
    )

    var (
    	redisClient *redis.Client
    	once        sync.Once
    )

    // GetRedisClient initializes and returns a singleton Redis client.
    // It reads the Redis address from the `REDIS_ADDR` environment variable.
    // This ensures that we use the same client instance across the application,
    // which is crucial for efficient connection pooling.
    func GetRedisClient() *redis.Client {
    	once.Do(func() {
    		redisAddr := os.Getenv("REDIS_ADDR")
    		if redisAddr == "" {
    			// Default to localhost for local development if not set.
    			redisAddr = "localhost:6379"
    			log.Println("REDIS_ADDR not set, defaulting to localhost:6379")
    		}

    		log.Printf("Initializing Redis client with address: %s", redisAddr)
    		redisClient = redis.NewClient(&redis.Options{
    			Addr:     redisAddr,
    			Password: "", // No password set by default
    			DB:       0,  // Use default DB
    		})

    		// Ping the Redis server to ensure a connection is established.
    		ctx := context.Background()
    		if err := redisClient.Ping(ctx).Err(); err != nil {
    			log.Fatalf("Could not connect to Redis: %v", err)
    		}
    		log.Println("Successfully connected to Redis.")
    	})
    	return redisClient
    }
    ```

### Step 1.2: Update Environment Variables

Ensure the `REDIS_ADDR` is available to the application. For production Cloud Run, this will be `10.153.171.243:6379`.

---

## Phase 2: Core Security Implementations

### Step 2.1: Distributed Session Management

**Goal:** Store user sessions in Redis to allow for validation across any instance and enable instant logout propagation.

1.  **Define the Session Structure:** In `backend-go/internal/data/models.go`, add a struct for session data.

    ```go
    // models.go
    package data

    import "time"

    // ... other models

    type UserSession struct {
        UserID         string    `json:"user_id"`
        OrganizationID string    `json:"organization_id"`
        Permissions    []string  `json:"permissions"`
        CreatedAt      time.Time `json:"created_at"`
        ExpiresAt      time.Time `json:"expires_at"`
    }
    ```

2.  **Create a Session Service:** Create a new file `backend-go/internal/services/session_service.go`.

    ```go
    package services

    import (
    	"context"
    	"encoding/json"
    	"fmt"
    	"time"

    	"backend-go/internal/data"
    	"github.com/go-redis/redis/v8"
    )

    const SessionTTL = 5 * 24 * time.Hour // 5 days

    // CreateSession stores a new user session in Redis.
    func CreateSession(ctx context.Context, rdb *redis.Client, sessionID string, sessionData *data.UserSession) error {
        key := fmt.Sprintf("session:%s", sessionID)
        
        // Set expiration time
        sessionData.ExpiresAt = time.Now().Add(SessionTTL)

        jsonData, err := json.Marshal(sessionData)
        if err != nil {
            return fmt.Errorf("failed to marshal session data: %w", err)
        }

        return rdb.Set(ctx, key, jsonData, SessionTTL).Err()
    }

    // GetSession retrieves a user session from Redis.
    func GetSession(ctx context.Context, rdb *redis.Client, sessionID string) (*data.UserSession, error) {
        key := fmt.Sprintf("session:%s", sessionID)
        
        jsonData, err := rdb.Get(ctx, key).Result()
        if err == redis.Nil {
            return nil, nil // Session not found, not an error
        } else if err != nil {
            return nil, fmt.Errorf("failed to get session from redis: %w", err)
        }

        var sessionData data.UserSession
        if err := json.Unmarshal([]byte(jsonData), &sessionData); err != nil {
            return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
        }

        return &sessionData, nil
    }

    // DeleteSession removes a user session from Redis (for logout).
    func DeleteSession(ctx context.Context, rdb *redis.Client, sessionID string) error {
        key := fmt.Sprintf("session:%s", sessionID)
        return rdb.Del(ctx, key).Err()
    }
    ```

3.  **Integrate into `auth.go`:** Modify the `SessionLogin` function in `backend-go/internal/api/auth.go` to use this new service.

    *   **Important:** The current `auth.go` uses Firebase Session Cookies. We will augment this, not replace it. The session cookie will act as a `sessionID`. We will store metadata in Redis keyed by this cookie.

    ```go
    // In backend-go/internal/api/auth.go, inside SessionLogin function

    // After this line:
    // c.SetCookie("session", sessionCookie, int(expiresIn.Seconds()), "/", cookieDomain, isSecure, true)

    // ADD THIS CODE:
    // Store session metadata in Redis
    redisClient := data.GetRedisClient()
    userRecord, err := authClient.GetUser(ctx, token.UID)
    if err != nil {
        log.Printf("Error getting user record for session storage: %v", err)
        // Decide if this should be a fatal error for login
    }
    
    // Example permissions, fetch this from Firestore based on user
    permissions := []string{"read:forms", "write:responses"} 
    orgID := userRecord.CustomClaims["organization_id"].(string) // Assuming org ID is in custom claims

    sessionData := &data.UserSession{
        UserID:         token.UID,
        OrganizationID: orgID,
        Permissions:    permissions,
        CreatedAt:      time.Now(),
    }

    err = services.CreateSession(ctx, redisClient, sessionCookie, sessionData)
    if err != nil {
        log.Printf("Failed to store session in Redis: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session state"})
        return
    }
    
    log.Printf("Successfully stored session for user %s in Redis", token.UID)

    // ... rest of the function
    ```

### Step 2.2: Centralized CSRF Token Store

**Goal:** Move CSRF tokens from client-side cookies (which are validated but not stored server-side) to a centralized Redis store. This ensures any instance can validate a token.

1.  **Modify `csrf_middleware.go`:** Update the middleware to validate against Redis.

    ```go
    // In backend-go/internal/api/csrf_middleware.go

    // Replace the CSRFMiddleware function with this new version
    func CSRFMiddleware() gin.HandlerFunc {
        return func(c *gin.Context) {
            // Skip CSRF for non-state-changing methods
            if c.Request.Method != "POST" && c.Request.Method != "PUT" && c.Request.Method != "PATCH" && c.Request.Method != "DELETE" {
                c.Next()
                return
            }

            headerToken := c.GetHeader(CSRF_HEADER_NAME)
            if headerToken == "" {
                c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token not provided in header"})
                c.Abort()
                return
            }

            // Get user ID from context (set by auth middleware)
            userID, exists := c.Get("userID")
            if !exists {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated for CSRF check"})
                c.Abort()
                return
            }

            redisClient := data.GetRedisClient()
            key := fmt.Sprintf("csrf:%s:%s", userID.(string), headerToken)

            // Use GET to check for existence. We don't need the value.
            err := redisClient.Get(c.Request.Context(), key).Err()
            if err == redis.Nil {
                log.Printf("CSRF validation failed for user %s. Token not found in Redis.", userID)
                c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired CSRF token"})
                c.Abort()
                return
            } else if err != nil {
                log.Printf("Redis error during CSRF validation: %v", err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error during CSRF validation"})
                c.Abort()
                return
            }

            log.Printf("CSRF validation successful for user %s", userID)
            c.Next()
        }
    }

    // Replace GenerateCSRFTokenInternal with this new version
    func GenerateCSRFTokenInternal(c *gin.Context, userID string) string {
        token := uuid.New().String()
        redisClient := data.GetRedisClient()
        key := fmt.Sprintf("csrf:%s:%s", userID, token)
        
        // Store the token in Redis with a 4-hour TTL
        err := redisClient.Set(c.Request.Context(), key, "true", 4*time.Hour).Err()
        if err != nil {
            log.Printf("Failed to store CSRF token in Redis: %v", err)
            // Handle error appropriately, maybe can't log in
            return ""
        }

        // We no longer set a cookie. The token is returned in the response body
        // for the frontend to store in memory and send in the X-CSRF-Token header.
        log.Printf("Generated and stored CSRF token in Redis for user %s", userID)
        return token
    }
    ```

2.  **Update `auth.go` Login Flow:** Modify `SessionLogin` to call the new CSRF generation function and return the token in the response body.

    ```go
    // In backend-go/internal/api/auth.go, inside SessionLogin function

    // REMOVE the old call to GenerateCSRFTokenInternal(c, shouldBeSecure)

    // At the end of the function, before c.JSON(...), add:
    csrfToken := GenerateCSRFTokenInternal(c, token.UID)
    if csrfToken == "" {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
        return
    }

    // Modify the final JSON response to include the CSRF token
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "csrfToken": csrfToken,
    })
    ```

---

## Phase 3: Advanced Coordination Patterns

### Step 3.1: Distributed Rate Limiting

**Goal:** Implement a centralized rate limiter to prevent abuse across all instances.

1.  **Create a Rate Limiting Middleware:** Create a new file `backend-go/internal/api/rate_limit_middleware.go`.

    ```go
    package api

    import (
    	"fmt"
    	"log"
    	"net/http"
    	"time"

    	"backend-go/internal/data"
    	"github.com/gin-gonic/gin"
    )

    // RateLimiterMiddleware creates a middleware for rate limiting based on User ID.
    // It uses a sliding window algorithm in Redis.
    func RateLimiterMiddleware(limit int, window time.Duration) gin.HandlerFunc {
    	return func(c *gin.Context) {
    		userID, exists := c.Get("userID")
    		if !exists {
    			// Or use IP address as a fallback for unauthenticated routes
    			userID = c.ClientIP()
    		}

    		redisClient := data.GetRedisClient()
    		key := fmt.Sprintf("ratelimit:%s", userID.(string))

    		// INCR returns the new value of the key after incrementing.
    		count, err := redisClient.Incr(c.Request.Context(), key).Result()
    		if err != nil {
    			log.Printf("Redis error during rate limiting: %v", err)
    			c.Next() // Fail open
    			return
    		}

    		// If this is the first request in the window, set the expiration.
    		if count == 1 {
    			redisClient.Expire(c.Request.Context(), key, window)
    		}

    		if count > int64(limit) {
    			log.Printf("Rate limit exceeded for user %s. Count: %d, Limit: %d", userID, count, limit)
    			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
    			c.Abort()
    			return
    		}

    		c.Next()
    	}
    }
    ```

2.  **Apply the Middleware:** In your main router setup (`cmd/server/main.go`), apply this middleware to protected routes.

    ```go
    // In cmd/server/main.go
    
    // Example:
    protectedRoutes := router.Group("/api")
    protectedRoutes.Use(AuthMiddleware(firebaseApp)) // Assuming you have this
    // Apply rate limiter to all protected routes
    protectedRoutes.Use(api.RateLimiterMiddleware(100, 1*time.Minute)) // 100 requests per minute
    {
        // your protected routes here
    }
    ```

### Step 3.2: Distributed Locks

**Goal:** Prevent duplicate operations, like PDF generation, from running simultaneously for the same resource.

1.  **Create a Locking Service:** Create a new file `backend-go/internal/services/lock_service.go`.

    ```go
    package services

    import (
    	"context"
    	"fmt"
    	"time"

    	"github.com/go-redis/redis/v8"
    	"github.com/google/uuid"
    )

    // AcquireLock attempts to acquire a distributed lock in Redis.
    // It returns a lock value (token) if successful, or an empty string if not.
    // The lock is acquired using SET NX for atomicity.
    func AcquireLock(ctx context.Context, rdb *redis.Client, resourceID string, ttl time.Duration) (string, error) {
    	lockToken := uuid.NewString()
    	key := fmt.Sprintf("lock:%s", resourceID)

    	// SetNX returns true if the key was set, false if it already existed.
    	ok, err := rdb.SetNX(ctx, key, lockToken, ttl).Result()
    	if err != nil {
    		return "", fmt.Errorf("redis error acquiring lock: %w", err)
    	}

    	if !ok {
    		return "", nil // Lock already held
    	}

    	return lockToken, nil
    }

    // ReleaseLock releases a previously acquired lock.
    // It uses a Lua script to ensure the lock is only released by its owner.
    func ReleaseLock(ctx context.Context, rdb *redis.Client, resourceID string, lockToken string) error {
    	key := fmt.Sprintf("lock:%s", resourceID)
    	script := `
    	if redis.call("get", KEYS[1]) == ARGV[1] then
    		return redis.call("del", KEYS[1])
    	else
    		return 0
    	end
    	`
    	_, err := rdb.Eval(ctx, script, []string{key}, lockToken).Result()
    	return err
    }
    ```

2.  **Integrate into `pdf_generator.go`:** Wrap the PDF generation logic with the lock.

    ```go
    // In backend-go/internal/api/pdf_generator.go, inside GeneratePDFHandler

    // At the beginning of the function:
    redisClient := data.GetRedisClient()
    lockResourceID := fmt.Sprintf("pdf-generation:%s", responseId)
    lockTTL := 2 * time.Minute // Max time for PDF generation

    lockToken, err := services.AcquireLock(c.Request.Context(), redisClient, lockResourceID, lockTTL)
    if err != nil {
        log.Printf("Error acquiring lock for response %s: %v", responseId, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire system lock"})
        return
    }

    if lockToken == "" {
        log.Printf("Duplicate PDF generation request for response %s", responseId)
        c.JSON(http.StatusConflict, gin.H{"error": "PDF generation is already in progress for this response."})
        return
    }

    // Ensure the lock is released even if a panic occurs
    defer services.ReleaseLock(c.Request.Context(), redisClient, lockResourceID, lockToken)

    // ... existing PDF generation logic ...
    ```

---

## Phase 4: Answering Technical Questions

This section clarifies the technical questions from the initial requirements document.

1.  **Is our Memorystore Redis instance configured for high availability?**
    *   **Answer:** This depends on the tier selected in GCP. For HIPAA, we **must** use the **Standard Tier**, which provides a replica and automatic failover. The Basic Tier is not sufficient. Please verify this in the GCP Console.

2.  **Should we use Redis Pub/Sub for session invalidation broadcasts?**
    *   **Answer:** Yes, this is an excellent pattern for instant, system-wide logout.
    *   **Implementation:** When a user logs out, in addition to deleting their session from Redis, publish a message to a channel (e.g., `session-invalidation`). All instances would subscribe to this channel. Upon receiving a message with a `sessionID`, they can take action, such as immediately terminating a WebSocket connection for that user. For a stateless API, simply deleting the session from Redis as we've implemented is often sufficient.

3.  **What's the recommended approach for Redis connection pooling with Cloud Run?**
    *   **Answer:** The `go-redis` library handles connection pooling automatically. By using the singleton pattern in `internal/data/redis.go`, we ensure that our entire application instance shares a single pool of connections, which is the most efficient approach. No further action is needed here.

4.  **Should we implement Redis Sentinel for automatic failover?**
    *   **Answer:** No. When using GCP Memorystore (Standard Tier), Google manages high availability and failover automatically. Sentinel is for self-managed Redis deployments. Rely on the GCP-provided service endpoint.

5.  **Is encryption-in-transit properly configured for our Redis instance?**
    *   **Answer:** GCP Memorystore has an "in-transit encryption" feature that must be enabled during instance creation. Please verify in the GCP Console that this is active for our instance. If not, a new instance may need to be created with the feature enabled.

---

## Developer Checklist

- [ ] Create `backend-go/internal/data/redis.go` with the singleton client.
- [ ] Add `REDIS_ADDR` to environment variables for local and production.
- [ ] Implement distributed session management in `auth.go` and a new `session_service.go`.
- [ ] Refactor `csrf_middleware.go` to use Redis for token storage and validation.
- [ ] Update the `SessionLogin` function to return the CSRF token in the body.
- [ ] Implement the rate-limiting middleware and apply it to protected routes.
- [ ] Implement the distributed lock service and integrate it into the PDF generation handler.
- [ ] Verify GCP Memorystore is Standard Tier and has in-transit encryption enabled.
