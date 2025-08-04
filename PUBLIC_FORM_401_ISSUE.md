# Public Form Submission 401 Error - Problem Breakdown

## Issue Summary
Public form submissions are failing with 401 Unauthorized error when users attempt to submit forms via share links without authentication.

## Current Behavior
- **Endpoint**: `POST https://healthcare-forms-backend-go-673381373352.us-central1.run.app/api/responses/public`
- **Error**: 401 Unauthorized
- **Context**: Public users accessing forms via share tokens should NOT require authentication

## Expected Behavior
The `/api/responses/public` endpoint should:
1. Accept form submissions WITHOUT authentication
2. Validate the share token included in the request
3. Create form response in Firestore with proper organization_id from share link

## Technical Details

### Current Implementation (backend-go/cmd/server/main.go)
```go
// Line 80 - Public route configuration
r.POST("/api/responses/public", api.CreatePublicFormResponse(firestoreClient))
```

### Problem Location
The `/api/responses/public` endpoint is configured OUTSIDE the authenticated routes group but still returns 401. This suggests the authentication middleware might be applied globally or the route isn't properly registered.

### Request Flow
1. User accesses form via: `/forms/{formId}/fill/{shareToken}`
2. Frontend submits to: `/api/responses/public`
3. Request payload includes:
   - `form_id`: The form identifier
   - `share_token`: Token for validation
   - `response_data`: Form submission data

### Required Fix
The Go backend needs to ensure `/api/responses/public` is:
1. Registered BEFORE any global authentication middleware
2. Explicitly excluded from authentication requirements
3. Properly handling the share token validation internally

## Request for GCP Agent

Please update the Go backend deployment to ensure the `/api/responses/public` endpoint:

1. **Is accessible without authentication** - This endpoint must be public
2. **Validates share tokens internally** - The endpoint code already handles this
3. **Returns proper CORS headers** - Already configured for localhost:3000

### Specific Changes Needed

In `backend-go/cmd/server/main.go`, verify the route registration order:

```go
// Public routes MUST be registered BEFORE auth middleware
r.POST("/api/responses/public", api.CreatePublicFormResponse(firestoreClient))

// THEN apply auth middleware to protected routes only
authRequired := r.Group("/api")
authRequired.Use(api.AuthMiddleware(authClient))
```

### Testing Command
After deployment, this curl command should return 400 (bad request) NOT 401:
```bash
curl -X POST https://healthcare-forms-backend-go-673381373352.us-central1.run.app/api/responses/public \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{}'
```

A 400 response means the endpoint is accessible but data validation failed (expected).
A 401 response means authentication is incorrectly required (current bug).

## Root Cause
The authentication middleware is likely being applied to ALL routes under `/api/*` pattern, including `/api/responses/public`. The fix is to ensure public endpoints are registered outside the authenticated group or explicitly excluded from auth checks.