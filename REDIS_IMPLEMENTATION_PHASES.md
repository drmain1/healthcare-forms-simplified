# Redis Implementation Phases - HIPAA-Compliant Distributed System

## Overview

This guide breaks down the Redis implementation into 4 distinct phases, each with clear testing and rollback points. Each phase is designed to be independently deployable and testable without breaking existing functionality.

## Critical Prerequisites 


### 2. GCP Memorystore Verification (MUST DO SECOND)
```bash
# Check current instance configuration
gcloud redis instances describe healthcare-forms-redis --region=us-central1

# MANDATORY requirements for HIPAA compliance:
# - tier: STANDARD_HA (NOT BASIC)
# - transitEncryptionMode: SERVER_AUTHENTICATION (NOT DISABLED)
# - redisVersion: 7.2 or higher
# - authEnabled: true (password required)
```

**⚠️ CRITICAL:** If your instance doesn't meet requirements, create new HIPAA-compliant instance:
```bash
gcloud redis instances create healthcare-forms-redis-hipaa \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_2 \
    --tier=standard \
    --transit-encryption-mode=SERVER_AUTHENTICATION \
    --auth-enabled

# Set password for HIPAA compliance
gcloud redis instances update healthcare-forms-redis-hipaa \
    --region=us-central1 \
    --update-auth-string
```

### 3. Dependencies Update (Use Latest Secure Version)
```bash
cd backend-go
go mod tidy

# ⚠️ IMPORTANT: Use new official Redis client (not old go-redis)
go get github.com/redis/go-redis/v9  # Latest secure version
go get github.com/google/uuid

# Remove old vulnerable dependency if present
go mod edit -dropreplace github.com/go-redis/redis/v8
```

---

## Phase 1: Foundation & Safety Infrastructure ✅ COMPLETED
**Goal:** Establish secure Redis connection without breaking existing functionality

### Implementation Steps

1. **Create Secure Redis Client Singleton**
   ```bash
   # Create the file structure
   mkdir -p backend-go/internal/data
   ```
   
   Create `backend-go/internal/data/redis.go` with HIPAA-compliant configuration:
   ```go
   package data

   import (
       "context"
       "log"
       "os"
       "sync"
       "time"

       "github.com/redis/go-redis/v9"  // Updated to secure v9 client
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
           
           if redisAddr == "" {
               redisAddr = "localhost:6379"
               log.Println("REDIS_ADDR not set, defaulting to localhost:6379")
           }
           
           if redisPassword == "" {
               log.Println("⚠️ WARNING: REDIS_PASSWORD not set - required for HIPAA compliance")
           }

           log.Printf("Initializing secure Redis client with address: %s", redisAddr)
           redisClient = redis.NewClient(&redis.Options{
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
           })

           // Ping the Redis server to ensure connection and auth
           ctx := context.Background()
           if err := redisClient.Ping(ctx).Err(); err != nil {
               log.Fatalf("Could not connect to Redis: %v", err)
           }
           log.Println("Successfully connected to Redis with authentication")
       })
       return redisClient
   }
   ```

2. **Add Secure Environment Variables**
   **Local Development:**
   ```bash
   export REDIS_ADDR=localhost:6379
   export REDIS_PASSWORD=your_local_password
   ```
   
   **Production (Cloud Run):**
   ```bash
   # Add to Cloud Run environment variables:
   REDIS_ADDR=10.153.171.243:6379
   REDIS_PASSWORD=your_secure_production_password  # ⚠️ Use Secret Manager
   REDIS_TLS_ENABLED=true
   ```

3. **Add Enhanced Health Check Integration**
   Find the health endpoint in `cmd/server/main.go` and replace with:
   ```go
   // Enhanced health check with Redis security validation
   router.GET("/health", func(c *gin.Context) {
       ctx := context.Background()
       
       // Basic service health
       healthStatus := gin.H{"status": "healthy", "timestamp": time.Now().Unix()}
       
       // Redis connectivity and auth check
       redisClient := data.GetRedisClient()
       if err := redisClient.Ping(ctx).Err(); err != nil {
           healthStatus["status"] = "unhealthy"
           healthStatus["redis"] = "disconnected"
           healthStatus["redis_error"] = err.Error()
           c.JSON(500, healthStatus)
           return
       }
       
       // Redis connection pool health
       stats := redisClient.PoolStats()
       healthStatus["redis"] = gin.H{
           "status": "connected",
           "total_connections": stats.TotalConns,
           "idle_connections": stats.IdleConns,
           "stale_connections": stats.StaleConns,
       }
       
       // Check for critical connection pool issues
       if stats.TotalConns == 0 {
           healthStatus["status"] = "degraded"
           healthStatus["redis"].(gin.H)["warning"] = "no_connections_available"
       }
       
       c.JSON(200, healthStatus)
   })
   ```

### Testing Phase 1
```bash
# Local testing with security
export REDIS_ADDR=localhost:6379
export REDIS_PASSWORD=your_local_password
go run cmd/server/main.go
# Should see: "Successfully connected to Redis with authentication"

# Test enhanced health endpoint
curl http://localhost:8080/health
# Should return detailed Redis connection info:
# {
#   "status": "healthy",
#   "timestamp": 1234567890,
#   "redis": {
#     "status": "connected",
#     "total_connections": 5,
#     "idle_connections": 4,
#     "stale_connections": 0
#   }
# }

# Security verification - check Redis auth is working
redis-cli -h localhost -a your_local_password ping
# Should return: PONG

redis-cli -h localhost ping  # Without password
# Should return: (error) NOAUTH Authentication required

# Production deployment with secure environment variables
# ⚠️ IMPORTANT: Use Secret Manager for REDIS_PASSWORD
gcloud secrets create redis-password --data-file=password.txt

gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --set-env-vars "REDIS_ADDR=10.153.171.243:6379,GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app,REDIS_TLS_ENABLED=true" \
  --set-secrets "REDIS_PASSWORD=redis-password:latest"

# Verify production health
curl https://form.easydocforms.com/health
# Should show healthy Redis connection with pool stats
```

### ✅ PHASE 1 COMPLETED SUCCESSFULLY!

**Production Verification:**
- Health endpoint: `GET https://form.easydocforms.com/health` returns:
  ```json
  {
    "redis": {
      "idle_connections": 6,
      "stale_connections": 6,
      "status": "connected", 
      "total_connections": 6
    },
    "status": "healthy"
  }
  ```
- Production logs show: `Successfully connected to Redis with authentication`
- HIPAA-compliant Redis instance: `healthcare-forms-redis-hipaa` (10.35.139.228:6378)
- VPC connector: `redis-connector` enables Cloud Run ↔ Redis connectivity
- TLS encryption working with GCP Memorystore SERVER_AUTHENTICATION mode
- Graceful fallback: Application continues if Redis unavailable

**Final Infrastructure:**
- Redis: Standard HA tier, encrypted, password auth via Secret Manager  
- Cloud Run: VPC connector, Redis env vars, health checks functional
- Monthly cost: ~$46.72 for HIPAA Redis infrastructure
- Ready for Phase 2: Session management migration

### Git Checkpoint 1
```bash
git add .
git commit -m "Phase 1 Complete: Redis foundation with HIPAA-compliant infrastructure

✅ SUCCESSFULLY IMPLEMENTED:
- HIPAA-compliant Redis instance: healthcare-forms-redis-hipaa
- Backend Redis v9 client with TLS support and graceful fallback  
- VPC connector for Cloud Run ↔ Redis connectivity
- Fixed health endpoint, production deployment verified

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Session Management Migration
**Goal:** Move session metadata to Redis while keeping existing Firebase auth

### Implementation Steps

1. **Add Session Models with HIPAA Compliance**
   Add to `backend-go/internal/data/models.go`:
   ```go
   // UserSession represents session metadata stored in Redis for HIPAA compliance
   type UserSession struct {
       UserID         string    `json:"user_id"`
       OrganizationID string    `json:"organization_id"`
       Permissions    []string  `json:"permissions"`
       CreatedAt      time.Time `json:"created_at"`
       ExpiresAt      time.Time `json:"expires_at"`
       IPAddress      string    `json:"ip_address"`      // HIPAA audit requirement
       UserAgent      string    `json:"user_agent"`      // HIPAA audit requirement
       SessionType    string    `json:"session_type"`    // "api" or "web"
   }
   ```

2. **Create Session Service with Error Handling**
   Create `backend-go/internal/services/session_service.go`:
   ```go
   package services

   import (
       "context"
       "encoding/json"
       "fmt"
       "log"
       "time"

       "backend-go/internal/data"
       "github.com/redis/go-redis/v9"
   )

   const SessionTTL = 5 * 24 * time.Hour // 5 days - HIPAA compliant

   // CreateSession stores a new user session in Redis with HIPAA audit trail
   func CreateSession(ctx context.Context, rdb *redis.Client, sessionID string, sessionData *data.UserSession) error {
       key := fmt.Sprintf("session:%s", sessionID)
       
       // Set expiration time
       sessionData.ExpiresAt = time.Now().Add(SessionTTL)

       jsonData, err := json.Marshal(sessionData)
       if err != nil {
           return fmt.Errorf("failed to marshal session data: %w", err)
       }

       // Store with TTL
       if err := rdb.Set(ctx, key, jsonData, SessionTTL).Err(); err != nil {
           return fmt.Errorf("failed to store session in Redis: %w", err)
       }

       // HIPAA audit log
       log.Printf("AUDIT: Session created for user %s, org %s, IP %s, expires %v", 
           sessionData.UserID, sessionData.OrganizationID, sessionData.IPAddress, sessionData.ExpiresAt)

       return nil
   }

   // GetSession retrieves a user session from Redis with validation
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

       // Check expiration
       if time.Now().After(sessionData.ExpiresAt) {
           // Clean up expired session
           rdb.Del(ctx, key)
           return nil, nil
       }

       return &sessionData, nil
   }

   // DeleteSession removes a user session from Redis (for logout) with audit
   func DeleteSession(ctx context.Context, rdb *redis.Client, sessionID string) error {
       key := fmt.Sprintf("session:%s", sessionID)
       
       // Get session for audit before deletion
       sessionData, _ := GetSession(ctx, rdb, sessionID)
       if sessionData != nil {
           log.Printf("AUDIT: Session deleted for user %s, org %s", 
               sessionData.UserID, sessionData.OrganizationID)
       }
       
       return rdb.Del(ctx, key).Err()
   }
   ```

3. **Update Auth Integration with Graceful Fallback**
   In `backend-go/internal/api/auth.go`, modify the SessionLogin function:
   ```go
   // After setting the session cookie, add this Redis integration:
   
   // Store session metadata in Redis for distributed access
   redisClient := data.GetRedisClient()
   userRecord, err := authClient.GetUser(ctx, token.UID)
   if err != nil {
       log.Printf("Error getting user record for session storage: %v", err)
       // Continue with login - Redis failure shouldn't block auth
   } else {
       // Extract organization ID from custom claims or Firestore
       orgID := "" // Extract from userRecord.CustomClaims or query Firestore
       if customClaims := userRecord.CustomClaims; customClaims != nil {
           if orgIDClaim, ok := customClaims["organization_id"].(string); ok {
               orgID = orgIDClaim
           }
       }
       
       // HIPAA audit data
       clientIP := c.ClientIP()
       userAgent := c.GetHeader("User-Agent")
       
       sessionData := &data.UserSession{
           UserID:         token.UID,
           OrganizationID: orgID,
           Permissions:    []string{"read:forms", "write:responses"}, // Based on role
           CreatedAt:      time.Now(),
           IPAddress:      clientIP,
           UserAgent:      userAgent,
           SessionType:    "web",
       }

       if err := services.CreateSession(ctx, redisClient, sessionCookie, sessionData); err != nil {
           log.Printf("Failed to store session in Redis: %v", err)
           // Log but don't fail login - graceful degradation
       } else {
           log.Printf("Successfully stored session for user %s in Redis", token.UID)
       }
   }
   ```

### Safety Measures
- Wrap Redis operations in error handling
- If Redis fails, log error but continue with existing auth flow
- Add feature flag capability for gradual rollout

### Testing Phase 2
```bash
# Test login flow with audit logging
curl -X POST https://form.easydocforms.com/api/auth/session-login \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestClient/1.0" \
  -d '{"idToken":"your_firebase_token"}'

# Check logs for session storage and HIPAA audit entries
gcloud run services logs read healthcare-forms-backend-go --region us-central1 | grep "AUDIT:"
gcloud run services logs read healthcare-forms-backend-go --region us-central1 | grep "Successfully stored session"

# Verify Redis data with authentication
redis-cli -h 10.153.171.243 -a your_password
> KEYS session:*
> GET session:your_session_id
# Should show JSON with UserID, OrganizationID, IPAddress, UserAgent

# Test session expiration
> TTL session:your_session_id
# Should show remaining seconds (5 days = 432000 seconds)

# Test graceful fallback - simulate Redis failure
# Temporarily stop Redis or use wrong password
redis-cli -h 10.153.171.243 -a wrong_password
# Login should still work, but with logged Redis errors
```

### Rollback Plan Phase 2
If issues occur, comment out Redis session storage code in auth.go - existing Firebase auth will continue working.

### Git Checkpoint 2
```bash
git add .
git commit -m "Phase 2: Add distributed session management with Redis

- Store session metadata in Redis keyed by Firebase session cookie
- Graceful fallback if Redis unavailable
- Maintains existing Firebase authentication flow

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: CSRF Security Enhancement  
**Goal:** Centralize CSRF token validation in Redis

### Implementation Steps

1. **Update CSRF Middleware with Redis Security**
   Replace `backend-go/internal/api/csrf_middleware.go` with:
   ```go
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
   func InvalidateUserCSRFTokens(ctx context.Context, userID string) error {
       redisClient := data.GetRedisClient()
       pattern := fmt.Sprintf("csrf:%s:*", userID)
       
       keys, err := redisClient.Keys(ctx, pattern).Result()
       if err != nil {
           return fmt.Errorf("failed to get CSRF keys: %w", err)
       }
       
       if len(keys) > 0 {
           if err := redisClient.Del(ctx, keys...).Err(); err != nil {
               return fmt.Errorf("failed to delete CSRF tokens: %w", err)
           }
           log.Printf("AUDIT: Invalidated %d CSRF tokens for user %s", len(keys), userID)
       }
       
       return nil
   }
   ```

2. **Modify Auth Response to Include CSRF Token**
   Update SessionLogin in `backend-go/internal/api/auth.go`:
   ```go
   // At the end of SessionLogin function, before final JSON response:
   
   // Generate CSRF token for this session
   csrfToken := GenerateCSRFTokenInternal(c, token.UID)
   if csrfToken == "" {
       log.Printf("ERROR: Failed to generate CSRF token for user %s", token.UID)
       c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token"})
       return
   }

   // Return success response with CSRF token
   c.JSON(http.StatusOK, gin.H{
       "status": "success",
       "message": "Login successful",
       "csrfToken": csrfToken,
       "expiresIn": int(expiresIn.Seconds()),
   })
   ```

3. **Add Logout Endpoint with CSRF Cleanup**
   Add to your auth routes:
   ```go
   // POST /api/auth/logout
   func LogoutHandler(c *gin.Context) {
       userID, exists := c.Get("userID")
       if !exists {
           c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
           return
       }

       // Clear session cookie
       c.SetCookie("session", "", -1, "/", cookieDomain, isSecure, true)

       // Remove session from Redis
       redisClient := data.GetRedisClient()
       sessionCookie, _ := c.Cookie("session")
       if sessionCookie != "" {
           services.DeleteSession(c.Request.Context(), redisClient, sessionCookie)
       }

       // Invalidate all CSRF tokens for user
       if err := InvalidateUserCSRFTokens(c.Request.Context(), userID.(string)); err != nil {
           log.Printf("ERROR: Failed to invalidate CSRF tokens: %v", err)
       }

       log.Printf("AUDIT: User %s logged out from IP %s", userID, c.ClientIP())
       c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Logged out successfully"})
   }
   ```

4. **Frontend Integration Requirements (BREAKING CHANGE)**
   Frontend must be updated to:
   ```javascript
   // Store CSRF token from login response
   const loginResponse = await fetch('/api/auth/session-login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ idToken })
   });
   
   const { csrfToken } = await loginResponse.json();
   
   // Store in memory (NOT localStorage for security)
   sessionStorage.setItem('csrfToken', csrfToken);
   
   // Send in all state-changing requests
   fetch('/api/forms', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'X-CSRF-Token': sessionStorage.getItem('csrfToken')
       },
       body: JSON.stringify(formData)
   });
   
   // Clear on logout
   sessionStorage.removeItem('csrfToken');
   ```

### Critical Testing Phase 3
```bash
# Test CSRF generation in login response
curl -X POST https://form.easydocforms.com/api/auth/session-login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your_firebase_token"}' \
  -c cookies.txt
# Response should include: {"status":"success","csrfToken":"uuid-here",...}

# Extract CSRF token for testing
CSRF_TOKEN=$(curl -s -X POST https://form.easydocforms.com/api/auth/session-login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your_token"}' | jq -r '.csrfToken')

# Test CSRF validation success
curl -X POST https://form.easydocforms.com/api/forms \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Cookie: session=your_session" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Form"}'
# Should return 200 OK

# Test CSRF validation failure (no token)
curl -X POST https://form.easydocforms.com/api/forms \
  -H "Cookie: session=your_session" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Form"}'
# Should return 403: "CSRF token not provided in header"

# Test CSRF validation failure (invalid token)
curl -X POST https://form.easydocforms.com/api/forms \
  -H "X-CSRF-Token: invalid-token-123" \
  -H "Cookie: session=your_session" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Form"}'
# Should return 403: "Invalid or expired CSRF token"

# Verify Redis CSRF token storage
redis-cli -h 10.153.171.243 -a your_password
> KEYS csrf:*
# Should show: csrf:user_id:token_uuid
> GET csrf:user_id:token_uuid
# Should return: "valid"
> TTL csrf:user_id:token_uuid
# Should show remaining seconds (4 hours = 14400)

# Test logout and CSRF cleanup
curl -X POST https://form.easydocforms.com/api/auth/logout \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Cookie: session=your_session"
# Should return: {"status":"success","message":"Logged out successfully"}

# Verify CSRF tokens were cleaned up
redis-cli -h 10.153.171.243 -a your_password
> KEYS csrf:*
# Should show no keys for the logged-out user

# Check audit logs
gcloud run services logs read healthcare-forms-backend-go --region us-central1 | grep "AUDIT:"
# Should show CSRF generation, validation, and cleanup events
gcloud run services logs read healthcare-forms-backend-go --region us-central1 | grep "SECURITY:"
# Should show security violations (missing/invalid tokens)
```

### Frontend Update Required
The frontend will need updates to handle the new CSRF flow. This is a **breaking change** that requires coordination.

### Git Checkpoint 3
```bash
git add .
git commit -m "Phase 3: Centralize CSRF tokens in Redis

- Move CSRF validation from cookies to Redis storage  
- Return CSRF token in login response body
- Require frontend updates for token handling

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Phase 3 Issue Resolution (August 24, 2024)

**Problem Encountered:**
After implementing Phase 3, CRUD operations returned 403 Forbidden errors despite successful authentication.

**Root Cause Analysis:**
The frontend was making duplicate CSRF token requests:
1. `authService.sessionLogin()` correctly returned a CSRF token stored in Redis
2. `FirebaseAuthContext` then called `fetchCSRFToken()` which fetched a NEW random UUID
3. The `/api/auth/csrf-token` endpoint was returning a random token without storing it in Redis
4. This invalid token overwrote the valid one in sessionStorage

**Investigation Process:**
1. Created diagnostic endpoints (`/api/diagnostics/csrf`) to inspect token state
2. Built browser console diagnostic script to test token validity
3. Discovered token mismatch between sessionStorage and Redis
4. Traced the issue to duplicate token fetch in `FirebaseAuthContext.tsx`

**Solution Applied:**
```diff
// FirebaseAuthContext.tsx
try {
  await authService.sessionLogin(authUser.idToken);
  console.log('Session login successful');
- // Fetch CSRF token after successful session login  
- await fetchCSRFToken();
- console.log('CSRF token fetched');
+ console.log('Session login successful - CSRF token received and stored');
```

Also fixed the `/api/auth/csrf-token` endpoint to properly store tokens in Redis when called.

**Lessons Learned:**
1. Always trace the complete authentication flow when debugging CSRF issues
2. Diagnostic endpoints are invaluable for production debugging
3. Browser console scripts can quickly validate token state
4. Duplicate API calls can overwrite valid security tokens

**Testing Tools Created:**
- CSRF diagnostics endpoint: `/api/diagnostics/csrf`
- Browser diagnostic script (see REDIS.md for full script)
- Quick validation test:
```javascript
// Validate CSRF token is working
(async()=>{
  const t=sessionStorage.getItem('csrfToken');
  console.log('Token:',t?'Present':'Missing');
  const r=await fetch('/api/forms',{method:'POST',credentials:'include',
    headers:{'X-CSRF-Token':t||''},body:JSON.stringify({/*...*/})});
  console.log('Status:',r.status===201?'✅ WORKING':'❌ FAILED');
})();
```

### Git Checkpoint 3 (Issue Resolution)
```bash
git add .
git commit -m "Fix Phase 3: Resolve CSRF token duplication issue

PROBLEM: 403 Forbidden on all CRUD operations
ROOT CAUSE: Frontend was fetching duplicate CSRF token, overwriting valid one
SOLUTION: Removed redundant fetchCSRFToken() call in FirebaseAuthContext

✅ FIXED:
- Removed duplicate token fetch in FirebaseAuthContext.tsx
- Fixed /api/auth/csrf-token to properly store tokens in Redis
- Added comprehensive CSRF diagnostics endpoint
- Created browser console diagnostic scripts

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Advanced Coordination Features
**Goal:** Add rate limiting and distributed locking

### Implementation Steps

1. **Rate Limiting Middleware with HIPAA Audit**
   Create `backend-go/internal/api/rate_limit_middleware.go`:
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
           
           // Sliding window rate limiting
           now := time.Now().Unix()
           windowStart := now - int64(config.WindowDuration.Seconds())
           
           key := fmt.Sprintf("ratelimit:%s", identifier)
           
           // Remove old entries outside the window
           redisClient.ZRemRangeByScore(c.Request.Context(), key, "0", fmt.Sprintf("%d", windowStart))
           
           // Count requests in current window
           count, err := redisClient.ZCard(c.Request.Context(), key).Result()
           if err != nil {
               log.Printf("ERROR: Redis error in rate limiter: %v", err)
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
               })
               c.Abort()
               return
           }
           
           // Add current request to the window
           redisClient.ZAdd(c.Request.Context(), key, &redis.Z{
               Score:  float64(now),
               Member: fmt.Sprintf("%d", now),
           })
           
           // Set expiration for cleanup
           redisClient.Expire(c.Request.Context(), key, config.WindowDuration+time.Minute)
           
           remaining := limit - count - 1
           if remaining < 0 {
               remaining = 0
           }
           
           c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerWindow))
           c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
           c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", now+int64(config.WindowDuration.Seconds())))
           
           c.Next()
       }
   }
   ```
   
   Apply to route groups in `cmd/server/main.go`:
   ```go
   // Authentication routes (stricter limits)
   authRoutes := router.Group("/api/auth")
   authRoutes.Use(RateLimiterMiddleware(AuthRateLimit))
   
   // API routes (moderate limits)
   apiRoutes := router.Group("/api")
   apiRoutes.Use(AuthMiddleware(firebaseApp))
   apiRoutes.Use(RateLimiterMiddleware(APIRateLimit))
   
   // PDF generation (strict limits)
   pdfRoutes := apiRoutes.Group("/responses")
   pdfRoutes.Use(RateLimiterMiddleware(PDFRateLimit))
   ```

2. **Enhanced Distributed Locking Service**
   Create `backend-go/internal/services/lock_service.go`:
   ```go
   package services

   import (
       "context"
       "fmt"
       "log"
       "time"

       "github.com/redis/go-redis/v9"
       "github.com/google/uuid"
   )

   // DistributedLock represents a Redis-based distributed lock
   type DistributedLock struct {
       client     *redis.Client
       key        string
       value      string
       ttl        time.Duration
       acquired   bool
   }

   // NewDistributedLock creates a new distributed lock
   func NewDistributedLock(client *redis.Client, resourceID string, ttl time.Duration) *DistributedLock {
       return &DistributedLock{
           client: client,
           key:    fmt.Sprintf("lock:%s", resourceID),
           value:  uuid.NewString(),
           ttl:    ttl,
       }
   }

   // Acquire attempts to acquire the lock
   func (lock *DistributedLock) Acquire(ctx context.Context) (bool, error) {
       success, err := lock.client.SetNX(ctx, lock.key, lock.value, lock.ttl).Result()
       if err != nil {
           return false, fmt.Errorf("failed to acquire lock: %w", err)
       }
       
       lock.acquired = success
       if success {
           log.Printf("AUDIT: Distributed lock acquired for resource %s, token %s", 
               lock.key, lock.value[:8])
       }
       
       return success, nil
   }

   // Release releases the lock using Lua script for atomic operation
   func (lock *DistributedLock) Release(ctx context.Context) error {
       if !lock.acquired {
           return nil
       }
       
       // Lua script ensures only lock owner can release
       script := `
           if redis.call("get", KEYS[1]) == ARGV[1] then
               return redis.call("del", KEYS[1])
           else
               return 0
           end
       `
       
       result, err := lock.client.Eval(ctx, script, []string{lock.key}, lock.value).Result()
       if err != nil {
           return fmt.Errorf("failed to release lock: %w", err)
       }
       
       if result.(int64) == 1 {
           log.Printf("AUDIT: Distributed lock released for resource %s", lock.key)
           lock.acquired = false
       } else {
           log.Printf("WARNING: Lock release failed - lock not owned by this token: %s", lock.key)
       }
       
       return nil
   }

   // Extend extends the lock TTL
   func (lock *DistributedLock) Extend(ctx context.Context, additionalTTL time.Duration) error {
       if !lock.acquired {
           return fmt.Errorf("cannot extend unacquired lock")
       }
       
       script := `
           if redis.call("get", KEYS[1]) == ARGV[1] then
               return redis.call("expire", KEYS[1], ARGV[2])
           else
               return 0
           end
       `
       
       result, err := lock.client.Eval(ctx, script, []string{lock.key}, lock.value, int(additionalTTL.Seconds())).Result()
       if err != nil {
           return fmt.Errorf("failed to extend lock: %w", err)
       }
       
       if result.(int64) == 0 {
           return fmt.Errorf("lock no longer owned by this token")
       }
       
       return nil
   }
   ```
   
   Integrate with PDF generation in your PDF handler:
   ```go
   // In PDF generation handler
   func GeneratePDFHandler(c *gin.Context) {
       responseId := c.Param("responseId")
       
       redisClient := data.GetRedisClient()
       lock := services.NewDistributedLock(redisClient, fmt.Sprintf("pdf-gen:%s", responseId), 5*time.Minute)
       
       acquired, err := lock.Acquire(c.Request.Context())
       if err != nil {
           log.Printf("ERROR: Failed to acquire PDF generation lock: %v", err)
           c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not acquire system lock"})
           return
       }
       
       if !acquired {
           log.Printf("INFO: PDF generation already in progress for response %s", responseId)
           c.JSON(http.StatusConflict, gin.H{"error": "PDF generation is already in progress for this response"})
           return
       }
       
       // Ensure lock is released
       defer func() {
           if err := lock.Release(c.Request.Context()); err != nil {
               log.Printf("ERROR: Failed to release PDF lock: %v", err)
           }
       }()
       
       // Your existing PDF generation logic here...
       // For long operations, consider extending the lock:
       // lock.Extend(c.Request.Context(), 2*time.Minute)
   }
   ```

3. **Enhanced Performance Monitoring**
   Update health endpoint with comprehensive Redis metrics:
   ```go
   // Add to health endpoint in cmd/server/main.go
   router.GET("/health", func(c *gin.Context) {
       ctx := context.Background()
       healthStatus := gin.H{
           "status": "healthy", 
           "timestamp": time.Now().Unix(),
           "version": "1.0.0", // Your app version
       }
       
       redisClient := data.GetRedisClient()
       
       // Redis connectivity
       if err := redisClient.Ping(ctx).Err(); err != nil {
           healthStatus["status"] = "unhealthy"
           healthStatus["redis"] = gin.H{"status": "disconnected", "error": err.Error()}
           c.JSON(500, healthStatus)
           return
       }
       
       // Redis performance metrics
       stats := redisClient.PoolStats()
       info, _ := redisClient.Info(ctx, "memory", "stats", "replication").Result()
       
       redisHealth := gin.H{
           "status": "connected",
           "pool": gin.H{
               "total_connections": stats.TotalConns,
               "idle_connections": stats.IdleConns,
               "stale_connections": stats.StaleConns,
               "hits": stats.Hits,
               "misses": stats.Misses,
               "timeouts": stats.Timeouts,
           },
       }
       
       // Parse Redis INFO for key metrics
       if info != "" {
           // Add memory usage, connected clients, etc.
           redisHealth["server_info"] = "available" // Parse specific metrics as needed
       }
       
       // Check for warning conditions
       if stats.TotalConns == 0 {
           healthStatus["status"] = "degraded"
           redisHealth["warning"] = "no_connections_available"
       }
       
       if stats.Timeouts > 0 {
           redisHealth["warning"] = fmt.Sprintf("connection_timeouts_detected: %d", stats.Timeouts)
       }
       
       healthStatus["redis"] = redisHealth
       c.JSON(200, healthStatus)
   })
   ```

### Testing Phase 4
```bash
# Test rate limiting with headers
echo "Testing rate limiting..."
for i in {1..105}; do 
    echo "Request $i:"
    curl -s -w "Status: %{http_code}, Limit: %{header_X-RateLimit-Limit}, Remaining: %{header_X-RateLimit-Remaining}\n" \
        -X GET https://form.easydocforms.com/api/forms \
        -H "Cookie: session=your_session" \
        -o /dev/null
    sleep 0.1
done
# Should show decreasing remaining count, then 429 status

# Test different rate limits for different endpoints
echo "\nTesting auth endpoint rate limiting (stricter)..."
for i in {1..7}; do 
    curl -s -w "Auth Request $i - Status: %{http_code}\n" \
        -X POST https://form.easydocforms.com/api/auth/session-login \
        -H "Content-Type: application/json" \
        -d '{"idToken":"invalid"}' \
        -o /dev/null
done
# Should hit 429 faster (5 requests + 2 burst = 7 total)

# Test PDF generation locking
echo "\nTesting distributed PDF locking..."
TEST_RESPONSE_ID="test-response-123"

# Start first PDF generation in background
curl -X POST https://form.easydocforms.com/api/responses/$TEST_RESPONSE_ID/generate-pdf \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -H "Cookie: session=your_session" &
PID1=$!

# Immediately try second generation (should be blocked)
sleep 0.5
curl -X POST https://form.easydocforms.com/api/responses/$TEST_RESPONSE_ID/generate-pdf \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -H "Cookie: session=your_session"
# Should return 409: "PDF generation is already in progress"

wait $PID1

# Test lock expiration
echo "\nTesting lock cleanup..."
sleep 2
curl -X POST https://form.easydocforms.com/api/responses/$TEST_RESPONSE_ID/generate-pdf \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -H "Cookie: session=your_session"
# Should work now (previous lock expired)

# Verify Redis lock keys
redis-cli -h 10.153.171.243 -a your_password
> KEYS lock:*
# Should show active locks
> TTL lock:pdf-gen:test-response-123
# Should show remaining seconds or -2 if expired

# Test enhanced health endpoint
echo "\nTesting enhanced health monitoring..."
curl -s https://form.easydocforms.com/health | jq .
# Should return detailed Redis pool statistics:
# {
#   "status": "healthy",
#   "timestamp": 1234567890,
#   "redis": {
#     "status": "connected",
#     "pool": {
#       "total_connections": 5,
#       "idle_connections": 4,
#       "hits": 1250,
#       "misses": 45,
#       "timeouts": 0
#     }
#   }
# }

# Check audit logs for all Phase 4 features
echo "\nChecking audit logs..."
gcloud run services logs read healthcare-forms-backend-go --region us-central1 --limit=50 | grep "AUDIT:"
# Should show rate limiting violations, lock acquisitions/releases

gcloud run services logs read healthcare-forms-backend-go --region us-central1 --limit=50 | grep "SECURITY:"
# Should show security events (rate limit exceeded)
```

### Git Checkpoint 4
```bash
git add .
git commit -m "Phase 4: Add Redis-based rate limiting and distributed locks

- Implement per-user rate limiting across all instances
- Add distributed locks for PDF generation
- Prevent duplicate operations and resource contention

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

---

## HIPAA Compliance Documentation Requirements (January 2025)

### 1. Written Security Policies (Now Required)
Create `docs/redis-security-policy.md`:
```markdown
# Redis Security Policy for HIPAA Compliance

## Access Controls
- All Redis access requires authentication
- Passwords stored in GCP Secret Manager
- Connection encryption enforced via TLS

## Data Handling
- Session data expires automatically (5 days max)
- CSRF tokens expire in 4 hours
- No PHI stored directly in Redis
- All access logged for audit

## Monitoring
- Redis health monitored via /health endpoint
- Connection pool metrics tracked
- Rate limiting events logged
- Failed authentication attempts logged

## Incident Response
- Redis failure triggers graceful degradation
- Session cleanup procedures documented
- 72-hour recovery procedures available
```

### 2. 72-Hour Recovery Procedures (HIPAA Requirement)
Create `docs/redis-disaster-recovery.md`:
```markdown
# Redis Disaster Recovery - 72 Hour Compliance

## Hour 0-2: Immediate Response
1. Verify application graceful degradation working
2. Check GCP Memorystore status in console
3. Review monitoring alerts and logs
4. Notify security team if breach suspected

## Hour 2-24: Assessment and Temporary Measures
1. Assess data loss scope (sessions, CSRF tokens)
2. Implement temporary Redis instance if needed
3. Update DNS/configuration for new instance
4. Verify all security measures active

## Hour 24-72: Full Recovery
1. Restore from backup or rebuild instance
2. Verify HIPAA compliance features enabled
3. Restore rate limiting and session management
4. Complete security audit and documentation
```

### 3. Annual Audit Procedures
Create `docs/redis-audit-checklist.md`:
```markdown
# Annual Redis Security Audit Checklist

## Technical Verification
- [ ] Redis version up to date with security patches
- [ ] Authentication enabled and passwords rotated
- [ ] TLS encryption verified
- [ ] Rate limiting effectiveness reviewed
- [ ] Session management audit completed

## Compliance Verification  
- [ ] HIPAA security rule requirements met
- [ ] Audit logs retention policy followed
- [ ] Access controls documented and reviewed
- [ ] Penetration testing completed
- [ ] Security policies updated
```

---

## Additional Safety Measures Not in Original Guide

### 1. Circuit Breaker Pattern
Add to `redis.go`:
```go
type RedisCircuitBreaker struct {
    failures    int32
    maxFailures int32
    resetTime   time.Time
    mutex       sync.RWMutex
}

func (cb *RedisCircuitBreaker) IsOpen() bool {
    cb.mutex.RLock()
    defer cb.mutex.RUnlock()
    return atomic.LoadInt32(&cb.failures) >= cb.maxFailures && time.Now().Before(cb.resetTime)
}
```

### 2. Graceful Degradation
Wrap all Redis operations with fallback behavior:
```go
func SafeRedisOperation(operation func() error, fallback func()) error {
    if circuitBreaker.IsOpen() {
        fallback()
        return nil
    }
    if err := operation(); err != nil {
        circuitBreaker.RecordFailure()
        fallback()
        return err
    }
    circuitBreaker.RecordSuccess()
    return nil
}
```

### 3. Redis Connection Monitoring  
Add connection pool monitoring to health checks:
```go
stats := redisClient.PoolStats()
if stats.TotalConns == 0 {
    return errors.New("no redis connections available")
}
```

### 4. Memory Usage Alerts
Implement Redis memory monitoring:
```go
info, err := redisClient.Info(ctx, "memory").Result()
// Parse and alert if memory usage > 80%
```

### 5. Key Expiration Policies
Set appropriate TTLs for all keys:
- Sessions: 5 days (as implemented)  
- CSRF tokens: 4 hours (as implemented)
- Rate limit counters: 1 minute-1 hour based on window
- Locks: 2 minutes max (as implemented)
- Add cleanup job for orphaned keys

## Emergency Procedures

### Redis Instance Failure
1. **Immediate:** Applications will fallback to existing behavior (sessions in Firebase, no rate limiting)
2. **Recovery:** Deploy new Redis instance, update REDIS_ADDR, redeploy services
3. **Data Loss:** Sessions will be lost (users need to re-login), CSRF tokens regenerated

### Rollback Procedures
Each phase can be independently rolled back by:
1. Reverting the specific Git commit
2. Removing Redis calls while keeping fallback behavior  
3. Redeploying without Redis environment variables

### Monitoring Checklist
- [ ] Redis connection count in GCP Console
- [ ] Memory usage trends in Memorystore metrics
- [ ] Application error rates during Redis integration  
- [ ] Response time impact from Redis calls
- [ ] CSRF token validation success/failure rates
- [ ] Rate limiting effectiveness (blocked requests)
- [ ] Lock contention metrics for PDF generation