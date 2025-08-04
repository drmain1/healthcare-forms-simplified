# Public Form Submission Still Returning 401 - Critical Issue

## Problem Summary
The `/responses/public` endpoint continues to return 401 Unauthorized despite being configured as a public route without authentication requirements.

## Current Code Status

### Route Registration (backend-go/cmd/server/main.go)
```go
// Line 80 - Public route (BEFORE auth middleware)
r.POST("/responses/public", api.CreatePublicFormResponse(firestoreClient))

// Line 90-91 - Authenticated routes group
authRequired := r.Group("/api")
authRequired.Use(api.AuthMiddleware(authClient))
```

### Frontend Configuration (frontend/src/config/api.ts)
```javascript
// Line 25 - Correctly pointing to public endpoint
submitPublic: () => `${getBaseUrl()}/responses/public`
```

## Evidence from Logs
```
2025-08-04T04:15:35.799649Z [GIN] POST "/responses/public" | 401 | 33.046669ms
```

## The Hidden Problem
In `backend-go/internal/api/middleware.go`, there's a leftover check from the old implementation:
```go
func AuthMiddleware(authClient *auth.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.URL.Path == "/api/responses/public" {  // OLD PATH!
            c.Next()
            return
        }
        // ... auth validation ...
    }
}
```

This check is for the OLD path `/api/responses/public` but the route is now at `/responses/public`.

## Root Cause Analysis
The auth middleware might be getting applied globally or through another middleware chain. The public route `/responses/public` is being caught by authentication checks despite being registered outside the authenticated group.

## Required Fix

### Option 1: Remove the outdated middleware check
Delete lines 15-18 from `backend-go/internal/api/middleware.go` since the public route shouldn't go through auth middleware at all.

### Option 2: Update the middleware check
Change line 15 in `backend-go/internal/api/middleware.go`:
```go
// FROM:
if c.Request.URL.Path == "/api/responses/public" {
// TO:
if c.Request.URL.Path == "/responses/public" {
```

### Option 3: Investigate if there's global middleware
Check if there's any global authentication being applied that catches all routes, even those outside the `/api` group.

## Testing
After fix, this command should return 400 (bad request), NOT 401:
```bash
curl -X POST https://healthcare-forms-backend-go-673381373352.us-central1.run.app/responses/public \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Deployment Steps
1. Fix the middleware check
2. Rebuild: `docker build --platform linux/amd64 -f backend-go/Dockerfile.alpine -t gcr.io/healthcare-forms-v2/forms-api-go:latest backend-go`
3. Push: `docker push gcr.io/healthcare-forms-v2/forms-api-go:latest`
4. Deploy: `gcloud run deploy healthcare-forms-backend-go --image gcr.io/healthcare-forms-v2/forms-api-go:latest --region us-central1 --quiet`