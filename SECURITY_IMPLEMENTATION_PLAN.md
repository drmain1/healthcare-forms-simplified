# Security Implementation Plan - Healthcare Forms Platform

## Overview
This document provides a detailed implementation plan for critical security improvements to achieve HIPAA compliance for the Healthcare Forms platform.

---

## Priority 1: HIPAA-Compliant Audit Logging

### Architecture Decision
✅ **Use Cloud Logging → GCS Bucket** (GCP Best Practice)  
❌ **NOT Firestore** (as incorrectly suggested in initial audit)

### Why Cloud Logging + GCS?
- **Immutable by design** - Logs cannot be modified once written
- **HIPAA compliant** - Meets 6+ year retention requirements
- **Cost-effective** - GCS is cheaper than Firestore for long-term storage
- **Native integration** - Automatic integration with GCP services
- **CMEK encryption** - Customer-managed encryption keys support

### Implementation Steps

#### Step 1: Enable Required GCP Services
```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com --project=healthcare-forms-v2

# Verify it's enabled
gcloud services list --enabled --filter="name:logging" --project=healthcare-forms-v2
```

#### Step 2: Create Secure GCS Bucket for Audit Logs
```bash
# Create bucket with standard storage class
gsutil mb -p healthcare-forms-v2 -c STANDARD -l us-central1 \
  gs://healthcare-forms-v2-audit-logs

# Set 7-year retention policy (HIPAA requirement is 6 years minimum)
gsutil retention set 2555d gs://healthcare-forms-v2-audit-logs

# Enable versioning for additional protection
gsutil versioning set on gs://healthcare-forms-v2-audit-logs
```

#### Step 3: Configure CMEK Encryption
```bash
# Create KMS keyring for audit logs
gcloud kms keyrings create audit-logs-keyring \
  --location=us-central1 \
  --project=healthcare-forms-v2

# Create encryption key
gcloud kms keys create audit-logs-key \
  --location=us-central1 \
  --keyring=audit-logs-keyring \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time="+90d" \
  --project=healthcare-forms-v2

# Apply CMEK to bucket
gsutil kms encryption gs://healthcare-forms-v2-audit-logs \
  -k projects/healthcare-forms-v2/locations/us-central1/keyRings/audit-logs-keyring/cryptoKeys/audit-logs-key
```

#### Step 4: Create Log Sink for Export
```bash
# Create log sink to export audit logs to GCS
gcloud logging sinks create audit-logs-gcs-export \
  gs://healthcare-forms-v2-audit-logs \
  --log-filter='logName="projects/healthcare-forms-v2/logs/hipaa-audit-log"' \
  --project=healthcare-forms-v2

# Get the service account created for the sink
SINK_SA=$(gcloud logging sinks describe audit-logs-gcs-export \
  --format='value(writerIdentity)' \
  --project=healthcare-forms-v2)

# Grant the sink service account permission to write to bucket
gsutil iam ch $SINK_SA:objectCreator \
  gs://healthcare-forms-v2-audit-logs
```

#### Step 5: Backend Code Implementation

##### 5a. Add Dependencies
```bash
cd backend-go
go get cloud.google.com/go/logging
```

##### 5b. Create Cloud Audit Logger Service
Create file: `backend-go/internal/services/cloud_audit_logger.go`

```go
package services

import (
    "context"
    "cloud.google.com/go/logging"
    "time"
)

type CloudAuditLogger struct {
    client *logging.Client
    logger *logging.Logger
}

type AuditEntry struct {
    Timestamp    time.Time              `json:"timestamp"`
    UserID       string                 `json:"user_id"`
    UserEmail    string                 `json:"user_email,omitempty"`
    Action       string                 `json:"action"`
    ResourceType string                 `json:"resource_type"`
    ResourceID   string                 `json:"resource_id"`
    IPAddress    string                 `json:"ip_address"`
    UserAgent    string                 `json:"user_agent"`
    Success      bool                   `json:"success"`
    ErrorMsg     string                 `json:"error,omitempty"`
    Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

func NewCloudAuditLogger(projectID string) (*CloudAuditLogger, error) {
    ctx := context.Background()
    client, err := logging.NewClient(ctx, projectID)
    if err != nil {
        return nil, err
    }
    
    // Create dedicated HIPAA audit logger
    logger := client.Logger("hipaa-audit-log")
    
    return &CloudAuditLogger{
        client: client,
        logger: logger,
    }, nil
}

func (cal *CloudAuditLogger) LogAccess(ctx context.Context, entry AuditEntry) {
    severity := logging.Info
    if !entry.Success {
        severity = logging.Warning
    }
    
    cal.logger.Log(logging.Entry{
        Severity:  severity,
        Timestamp: entry.Timestamp,
        Payload:   entry,
        Labels: map[string]string{
            "user_id": entry.UserID,
            "action":  entry.Action,
            "resource": entry.ResourceType,
        },
    })
}

func (cal *CloudAuditLogger) Close() error {
    return cal.client.Close()
}
```

##### 5c. Create Audit Middleware
Create file: `backend-go/internal/api/audit_middleware.go`

```go
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
```

#### Step 6: Testing & Verification

##### Test Audit Logging
```bash
# Make API calls to generate audit logs
curl -X GET https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/forms \
  -H "Authorization: Bearer $TOKEN"

# View logs in Cloud Logging
gcloud logging read "logName=projects/healthcare-forms-v2/logs/hipaa-audit-log" \
  --limit=10 \
  --format=json \
  --project=healthcare-forms-v2

# Verify logs are being exported to GCS (may take a few minutes)
gsutil ls -la gs://healthcare-forms-v2-audit-logs/
```

##### Create Monitoring Alert
```bash
# Create alert for suspicious activity
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="Suspicious PHI Access" \
  --condition-display-name="Multiple Failed Access Attempts" \
  --condition-expression='
    resource.type="cloud_function"
    AND log_name="projects/healthcare-forms-v2/logs/hipaa-audit-log"
    AND jsonPayload.success=false
  ' \
  --project=healthcare-forms-v2
```

---

## Priority 2: Security Middleware Implementation

### Current State Analysis
✅ **Already Built:**
- `SecurityValidator` with XSS/SQL injection detection
- `RateLimiter` struct defined
- Input sanitization logic

❌ **Missing:**
- Not applied to API endpoints (only used in PDF generation)
- Rate limiter not activated
- No security headers
- Error messages expose internal details

### Implementation Steps

#### Step 1: Create Security Middleware
Create file: `backend-go/internal/api/security_middleware.go`

```go
package api

import (
    "github.com/gin-gonic/gin"
    "backend-go/internal/services"
    "net/http"
    "io/ioutil"
    "encoding/json"
    "bytes"
    "sync"
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
                result, err := validator.ValidateAndSanitize(toString(userID), requestData)
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
```

#### Step 2: Update SecurityValidator
Add to `backend-go/internal/services/security_validator.go`:

```go
// Add mutex for thread safety
import "sync"

type RateLimiter struct {
    requests map[string][]time.Time
    limit    int
    window   time.Duration
    mu       sync.Mutex  // Add this
}

func (rl *RateLimiter) Allow(userID string) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    now := time.Now()
    
    // Clean old requests
    if requests, exists := rl.requests[userID]; exists {
        validRequests := []time.Time{}
        for _, t := range requests {
            if now.Sub(t) < rl.window {
                validRequests = append(validRequests, t)
            }
        }
        rl.requests[userID] = validRequests
    }
    
    // Check limit
    if len(rl.requests[userID]) >= rl.limit {
        return false
    }
    
    // Add current request
    rl.requests[userID] = append(rl.requests[userID], now)
    return true
}
```

#### Step 3: Create Security Headers Middleware
Create file: `backend-go/internal/api/headers_middleware.go`

```go
package api

import (
    "github.com/gin-gonic/gin"
    "os"
)

func SecurityHeadersMiddleware() gin.HandlerFunc {
    isProd := os.Getenv("ENVIRONMENT") == "production"
    
    return func(c *gin.Context) {
        // Essential security headers
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-XSS-Protection", "1; mode=block")
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        
        // HSTS only in production
        if isProd {
            c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
        }
        
        // Content Security Policy
        // Adjust based on your frontend requirements
        csp := "default-src 'self'; " +
               "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; " +
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
               "font-src 'self' https://fonts.gstatic.com data:; " +
               "img-src 'self' data: https: blob:; " +
               "connect-src 'self' https://firebaseapp.com https://firebaseio.com https://googleapis.com; " +
               "frame-ancestors 'none';"
        
        c.Header("Content-Security-Policy", csp)
        
        c.Next()
    }
}
```

#### Step 4: Create Error Handler Middleware
Create file: `backend-go/internal/api/error_middleware.go`

```go
package api

import (
    "github.com/gin-gonic/gin"
    "os"
    "log"
)

func ErrorHandlerMiddleware() gin.HandlerFunc {
    isProd := os.Getenv("ENVIRONMENT") == "production"
    
    return func(c *gin.Context) {
        c.Next()
        
        // Handle any errors that occurred
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            // Always log full error internally
            log.Printf("ERROR [%s %s]: %v", c.Request.Method, c.Request.URL.Path, err)
            
            // Determine status code if not set
            status := c.Writer.Status()
            if status == 200 {
                status = 500
            }
            
            // In production, return generic message
            if isProd {
                genericMessages := map[int]string{
                    400: "Invalid request",
                    401: "Authentication required",
                    403: "Access denied",
                    404: "Resource not found",
                    429: "Too many requests",
                    500: "Internal server error",
                }
                
                message := genericMessages[status]
                if message == "" {
                    message = "An error occurred"
                }
                
                c.JSON(status, gin.H{
                    "error": message,
                    "code": "ERROR",
                })
            } else {
                // In development, return actual error
                c.JSON(status, gin.H{
                    "error": err.Error(),
                    "code": "ERROR",
                    "debug": true,
                })
            }
        }
    }
}
```

#### Step 5: Wire Everything in main.go
Update `backend-go/cmd/server/main.go`:

```go
func main() {
    // ... existing initialization code ...
    
    // Initialize security components
    auditLogger, err := services.NewCloudAuditLogger(projectID)
    if err != nil {
        log.Printf("WARNING: Audit logging disabled: %v", err)
        // Don't fail startup, but log warning
    }
    defer func() {
        if auditLogger != nil {
            auditLogger.Close()
        }
    }()
    
    securityValidator := services.NewSecurityValidator()
    
    // Create router
    router := gin.New()
    
    // Apply middleware in correct order:
    // 1. Recovery (catch panics)
    router.Use(gin.Recovery())
    
    // 2. Security headers (apply to all responses)
    router.Use(api.SecurityHeadersMiddleware())
    
    // 3. CORS (needed before auth)
    router.Use(CORSMiddleware())
    
    // 4. Error handler (catch all errors)
    router.Use(api.ErrorHandlerMiddleware())
    
    // 5. Request logging (optional but recommended)
    router.Use(gin.Logger())
    
    // Health check (no auth required)
    router.GET("/health", api.HealthCheck)
    
    // Create authenticated route group
    authRoutes := router.Group("/api")
    
    // 6. Authentication middleware
    authRoutes.Use(api.AuthMiddleware(authClient))
    
    // 7. Security validation (after auth so we have userID)
    authRoutes.Use(api.SecurityMiddleware(securityValidator))
    
    // 8. Audit logging (after auth to capture user info)
    if auditLogger != nil {
        authRoutes.Use(api.AuditMiddleware(auditLogger))
    }
    
    // Register all authenticated routes
    authRoutes.GET("/forms", api.GetForms(firestoreClient))
    authRoutes.POST("/forms", api.CreateForm(firestoreClient))
    // ... rest of routes ...
    
    // Start server
    log.Printf("Server starting on port 8080...")
    if err := router.Run(":8080"); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
```

### Testing & Verification

#### Test Security Headers
```bash
# Check security headers
curl -I https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### Test Rate Limiting
```bash
# Test rate limiting (should fail after 60 requests/minute)
TOKEN="your-firebase-token"
for i in {1..65}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/forms \
    -H "Authorization: Bearer $TOKEN"
  sleep 0.5
done
# Should see 429 status codes after 60 requests
```

#### Test Input Validation
```bash
# Test XSS attempt (should be blocked)
curl -X POST https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","surveyJson":{}}'

# Test SQL injection attempt (should be blocked)
curl -X POST https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test\" OR 1=1--","surveyJson":{}}'

# Test oversized payload (should be rejected)
curl -X POST https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python -c 'print("{\"data\":\"" + "x"*11000000 + "\"}")')"
```

#### Test Error Handling
```bash
# In production, should see generic error
ENVIRONMENT=production go run cmd/server/main.go

# Test invalid endpoint
curl https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/invalid \
  -H "Authorization: Bearer $TOKEN"
# Should return: {"error":"Resource not found","code":"ERROR"}

# In development, should see detailed error
ENVIRONMENT=development go run cmd/server/main.go
# Should return: {"error":"actual error details","code":"ERROR","debug":true}
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Security middleware tested
- [ ] Audit logging verified
- [ ] GCS bucket configured with CMEK
- [ ] Log sink created and tested
- [ ] Environment variables set

### Deployment Steps
```bash
# 1. Set environment variable
gcloud run services update healthcare-forms-backend-go \
  --set-env-vars "ENVIRONMENT=production" \
  --region us-central1

# 2. Deploy new version
cd backend-go
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --project healthcare-forms-v2

# 3. Verify deployment
curl https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/health
```

### Post-Deployment Verification
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Audit logs flowing to Cloud Logging
- [ ] Logs exporting to GCS bucket
- [ ] Error messages are generic in production
- [ ] No PHI in logs

---

## Monitoring & Alerts

### Create Dashboards
```bash
# Create monitoring dashboard for security metrics
gcloud monitoring dashboards create --config-from-file=security-dashboard.yaml
```

### Set Up Alerts
```bash
# Alert for excessive failed authentication
gcloud alpha monitoring policies create \
  --display-name="Excessive Failed Auth Attempts" \
  --condition-expression='
    resource.type="cloud_run_revision"
    AND metric.type="run.googleapis.com/request_count"
    AND metric.label.response_code_class="4xx"
    rate(5m) > 100
  '

# Alert for rate limit violations
gcloud alpha monitoring policies create \
  --display-name="Rate Limit Violations" \
  --condition-expression='
    resource.type="cloud_run_revision"
    AND metric.type="run.googleapis.com/request_count"
    AND metric.label.response_code="429"
    rate(5m) > 50
  '
```

---

## Rollback Plan

If issues occur after deployment:

```bash
# 1. List recent revisions
gcloud run revisions list \
  --service=healthcare-forms-backend-go \
  --region=us-central1

# 2. Rollback to previous revision
gcloud run services update-traffic healthcare-forms-backend-go \
  --to-revisions=[PREVIOUS_REVISION]=100 \
  --region=us-central1

# 3. Investigate issues
gcloud run services logs read healthcare-forms-backend-go \
  --region=us-central1 \
  --limit=100
```

---

## Success Criteria

### Security Improvements
- ✅ Audit logging captures all PHI access
- ✅ Logs exported to encrypted GCS bucket
- ✅ Rate limiting prevents abuse
- ✅ Input validation blocks XSS/SQL injection
- ✅ Security headers protect against common attacks
- ✅ Error messages don't leak sensitive info

### Compliance Requirements
- ✅ HIPAA audit trail requirements met
- ✅ 6+ year log retention configured
- ✅ Encryption at rest (CMEK) and in transit (TLS)
- ✅ Access controls properly configured
- ✅ Monitoring and alerting in place

---

## Priority 3: Hybrid Anti-Forgery & Anti-Automation

### Architecture Decision
✅ **Hybrid Approach:**
1.  **Authenticated Routes (`/api/**`):** Use a stateless **Double-Submit Cookie CSRF** pattern for all state-changing (POST, PUT, PATCH, DELETE) operations performed by logged-in doctors.
2.  **Public Routes (`/public/**`):** Use a combination of **Time-Limited Nonces** and **Proof-of-Work (PoW)** challenges for anonymous public form submissions.

### Why a Hybrid Approach?
This strategy applies the right tool for the right job, maximizing security with an appropriate user experience.
- **Authenticated Users (Doctors):** Have persistent sessions and perform high-value CRUD operations. Standard CSRF protection is critical to prevent malicious websites from tricking them into performing unwanted actions.
- **Public Users (Patients):** Have a transient, stateless interaction. The primary threats are automated spam and bot submissions, not session hijacking. A PoW challenge and a single-use nonce effectively mitigate this without the overhead of CSRF cookies.

---

### Part A: CSRF Protection for Authenticated Routes

#### Step 1: Backend CSRF Middleware (Go)
Create file: `backend-go/internal/api/csrf_middleware.go`

```go
package api

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "X-CSRF-Token"

// CSRFMiddleware creates a middleware that provides CSRF protection.
func CSRFMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // For state-changing methods, validate the token.
        if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" || c.Request.Method == "DELETE" {
            headerToken := c.GetHeader(CSRF_HEADER_NAME)
            cookieToken, err := c.Cookie(CSRF_COOKIE_NAME)

            if err != nil || headerToken == "" || cookieToken == "" || headerToken != cookieToken {
                c.JSON(http.StatusForbidden, gin.H{
                    "error": "Invalid CSRF token",
                    "code":  "CSRF_VALIDATION_FAILED",
                })
                c.Abort()
                return
            }
        }

        c.Next()
    }
}

// GenerateCSRFToken generates a new CSRF token and sets it as a cookie.
// This should be called upon successful user login.
func GenerateCSRFToken(c *gin.Context) {
    token := uuid.New().String()
    
    // Set the cookie that the frontend will read.
    // HttpOnly should be false so JS can read it. Secure should be true in prod.
    c.SetCookie(
        CSRF_COOKIE_NAME,
        token,
        3600*24, // 24 hours
        "/",
        c.Request.URL.Host, // Set domain dynamically
        true, // Secure flag
        false, // HttpOnly = false
    )

    // Also return it in the body for convenience if needed, e.g., for initial fetch.
    c.JSON(http.StatusOK, gin.H{"csrfToken": token})
}
```

#### Step 2: Frontend CSRF Integration (TypeScript)
Update your authenticated API client (e.g., in `frontend/src/services/api.ts`).

```typescript
// Create an API interceptor or wrapper for authenticated calls
import axios from 'axios';
import Cookies from 'js-cookie';

const authenticatedApi = axios.create({
  baseURL: '/api',
  withCredentials: true, // Ensures cookies are sent
});

authenticatedApi.interceptors.request.use(
  (config) => {
    // Attach the JWT Bearer token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // For state-changing methods, attach the CSRF token from the cookie
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      const csrfToken = Cookies.get('csrf_token');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.error("CSRF token cookie not found. Aborting request.");
        // Cancel the request if the token is missing
        return Promise.reject(new Error("CSRF token is missing"));
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default authenticatedApi;

// Example usage:
// authenticatedApi.post('/forms', { name: 'New Form' });
// authenticatedApi.delete('/forms/123');
```

#### Step 3: Wire into `main.go`
```go
func main() {
    // ... existing setup ...
    router := gin.New()
    
    // Public endpoint to get initial CSRF token after login
    // This could be integrated directly into your login response
    router.GET("/api/auth/csrf-token", api.GenerateCSRFToken)

    // Authenticated routes
    authRoutes := router.Group("/api")
    authRoutes.Use(api.AuthMiddleware(authClient))
    authRoutes.Use(api.CSRFMiddleware()) // Apply CSRF protection
    authRoutes.Use(api.SecurityMiddleware(securityValidator))
    // ... other middleware ...
    {
        authRoutes.GET("/forms", api.GetForms(firestoreClient))
        authRoutes.POST("/forms", api.CreateForm(firestoreClient))
        authRoutes.PUT("/forms/:id", api.UpdateForm(firestoreClient))
        authRoutes.DELETE("/forms/:id", api.DeleteForm(firestoreClient))
        // ... all other authenticated routes
    }
    
    // ... server startup ...
}
```

---

### Part B: Anti-Automation for Public Routes

#### Step 1: Backend Nonce & PoW Middleware (Go)
Create file: `backend-go/internal/services/nonce_service.go` to manage nonces (using an in-memory store for simplicity, but Redis is better for production).

```go
package services

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
	"github.com/google/uuid"
)

var (
	nonceStore = make(map[string]time.Time)
	nonceMutex = &sync.Mutex{}
	nonceTTL   = 30 * time.Minute
)

// GenerateNonce creates, stores, and returns a new nonce.
func GenerateNonce() string {
	nonceMutex.Lock()
	defer nonceMutex.Unlock()
	
	nonce := uuid.NewString()
	nonceStore[nonce] = time.Now()
	return nonce
}

// ValidateAndConsumeNonce checks if a nonce is valid and consumes it.
func ValidateAndConsumeNonce(nonce string) bool {
	nonceMutex.Lock()
	defer nonceMutex.Unlock()

	issueTime, exists := nonceStore[nonce]
	if !exists || time.Since(issueTime) > nonceTTL {
		return false
	}

	// Consume nonce to prevent reuse
	delete(nonceStore, nonce)
	return true
}

// ValidateProofOfWork checks if the proof is valid for the given nonce.
func ValidateProofOfWork(nonce string, proof string) bool {
    // Difficulty: hash must start with "00"
    hash := sha256.Sum256([]byte(nonce + proof))
    return hex.EncodeToString(hash[:])[0:2] == "00"
}
```

Create file: `backend-go/internal/api/public_form_middleware.go`

```go
package api

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "backend-go/internal/services"
)

type PublicSubmitPayload struct {
    FormData   map[string]interface{} `json:"formData"`
    SubmitNonce string                `json:"submitNonce"`
    ProofOfWork string                `json:"proofOfWork"`
}

func PublicFormProtectionMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        var payload PublicSubmitPayload
        if err := c.ShouldBindJSON(&payload); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
            c.Abort()
            return
        }

        // 1. Validate Proof of Work
        if !services.ValidateProofOfWork(payload.SubmitNonce, payload.ProofOfWork) {
            c.JSON(http.StatusForbidden, gin.H{"error": "Invalid proof of work", "code": "POW_FAILED"})
            c.Abort()
            return
        }

        // 2. Validate and consume the nonce
        if !services.ValidateAndConsumeNonce(payload.SubmitNonce) {
            c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired form session", "code": "NONCE_INVALID"})
            c.Abort()
            return
        }
        
        // If valid, pass control
        c.Next()
    }
}
```

#### Step 2: Frontend PoW Implementation (TypeScript)
Create a PoW utility: `frontend/src/utils/proofOfWork.ts`

```typescript
import { sha256 } from 'js-sha256';

// Function to compute proof of work
export async function computeProofOfWork(nonce: string): Promise<string> {
  let proof = 0;
  console.time('ProofOfWork');
  
  while (true) {
    const proofString = String(proof);
    const hash = sha256(nonce + proofString);
    if (hash.startsWith('00')) {
      console.timeEnd('ProofOfWork');
      return proofString;
    }
    proof++;
  }
}
```

Update the public form submission logic: `frontend/src/components/PublicFormFill.tsx`

```typescript
import { computeProofOfWork } from '../utils/proofOfWork';

// When the form is loaded, the server provides `formJson` and `submitNonce`
const { formJson, submitNonce } = await fetchPublicForm();

const handlePublicSubmit = async (formData: any) => {
  try {
    // Compute the proof of work before submitting
    const proof = await computeProofOfWork(submitNonce);

    const payload = {
      formData,
      submitNonce,
      proofOfWork: proof,
    };

    await fetch('/public/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

#### Step 3: Wire into `main.go`
```go
func main() {
    // ... existing setup ...
    router := gin.New()

    // Public routes
    publicRoutes := router.Group("/public")
    {
        // Endpoint to get a form, which now also returns a nonce
        publicRoutes.GET("/forms/:id", func(c *gin.Context) {
            formID := c.Param("id")
            // ... logic to fetch form data ...
            c.JSON(http.StatusOK, gin.H{
                "formJson":    formData,
                "submitNonce": services.GenerateNonce(), // Generate and add nonce
            })
        })

        // Endpoint to submit a form, protected by our middleware
        publicRoutes.POST("/forms/submit", api.PublicFormProtectionMiddleware(), api.SubmitPublicForm)
    }
    
    // ... authenticated routes and server startup ...
}
```

---

### Testing & Verification

#### Test Authenticated CSRF Protection
1.  **Login** to the application to get the `csrf_token` cookie.
2.  **Attempt a POST request without the `X-CSRF-Token` header.** It should fail with a 403 Forbidden error.
    ```bash
    curl -X POST https://your-backend.com/api/forms \
      -H "Authorization: Bearer $YOUR_JWT" \
      -b "csrf_token=$YOUR_COOKIE_VALUE" \
      -d '{"name":"test"}'
    # EXPECTED: 403 Forbidden
    ```
3.  **Attempt the same request with the correct header.** It should succeed.
    ```bash
    curl -X POST https://your-backend.com/api/forms \
      -H "Authorization: Bearer $YOUR_JWT" \
      -H "X-CSRF-Token: $YOUR_COOKIE_VALUE" \
      -b "csrf_token=$YOUR_COOKIE_VALUE" \
      -d '{"name":"test"}'
    # EXPECTED: 200 OK or 201 Created
    ```

#### Test Public Form Anti-Automation
1.  **Fetch a public form** to get a `submitNonce`.
2.  **Attempt to submit the form with an invalid `proofOfWork`.** It should fail with a 403 Forbidden error.
    ```bash
    curl -X POST https://your-backend.com/public/forms/submit \
      -H "Content-Type: application/json" \
      -d '{"formData":{}, "submitNonce":"THE_REAL_NONCE", "proofOfWork":"invalid_proof"}'
    # EXPECTED: 403 Forbidden
    ```
3.  **Attempt to submit with a valid proof but an expired/used nonce.** It should fail.
4.  **A full, valid submission** from the frontend should succeed.

---

## Next Steps

After completing Priority 1, 2, & 3:

1. **Priority 4**: Add Web Application Firewall (Cloud Armor)
2. **Priority 5**: Implement automated security scanning
3. **Priority 6**: Conduct penetration testing
4. **Priority 7**: Complete HIPAA risk assessment documentation


---

## Contact Information

- **Project**: healthcare-forms-v2
- **Backend Service**: healthcare-forms-backend-go
- **Region**: us-central1
- **Support**: [Your contact info]

---

*Last Updated: August 2025*
*Version: 1.0*