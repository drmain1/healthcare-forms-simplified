# Security Fix: Body Diagram CSP Vulnerability + CORS Fix

## Date: August 21, 2025

## Issue
The body diagram components (`BodyPainDiagram.tsx` and `BodyDiagram2.tsx`) were using `dangerouslySetInnerHTML` to render SVG content without sanitization, requiring `'unsafe-inline'` in the Content Security Policy (CSP) `script-src` directive. This posed a potential XSS vulnerability and HIPAA compliance concern.

## Solution
Implemented DOMPurify to sanitize SVG content before rendering, allowing removal of `'unsafe-inline'` from CSP headers.

## Changes Made

### 1. Frontend Changes

#### Package Installation
```bash
npm install --legacy-peer-deps dompurify @types/dompurify
```

#### BodyPainDiagram.tsx
```typescript
// Added import
import DOMPurify from 'dompurify';

// Updated line 194
// Before:
<div dangerouslySetInnerHTML={{ __html: svgContent }} />

// After:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgContent) }} />
```

#### BodyDiagram2.tsx
```typescript
// Added import
import DOMPurify from 'dompurify';

// Updated line 196
// Before:
<div dangerouslySetInnerHTML={{ __html: BODY_SVG_CONTENT }} />

// After:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(BODY_SVG_CONTENT) }} />
```

### 2. Backend Changes

#### headers_middleware.go
```go
// Updated CSP header - removed 'unsafe-inline' from script-src
// Before:
"script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; "

// After:
"script-src 'self' https://apis.google.com https://www.gstatic.com; "
```

### 3. Redis Configuration (Optional Enhancement)

#### main.go
Made Redis optional to allow deployment without blocking on Redis connection:
```go
// Initialize Redis Client (optional)
var rdb *redis.Client
redisAddr := os.Getenv("REDIS_ADDR")
if redisAddr != "" {
    rdb = redis.NewClient(&redis.Options{
        Addr: redisAddr,
    })
    // Ping Redis to check the connection
    if _, err := rdb.Ping(ctx).Result(); err != nil {
        log.Printf("WARNING: Failed to connect to Redis: %v. Redis caching disabled.", err)
        rdb = nil
    } else {
        log.Printf("Connected to Redis at %s", redisAddr)
    }
} else {
    log.Printf("WARNING: REDIS_ADDR not set. Redis caching disabled.")
}
```

## Deployment

### Backend Deployment to Cloud Run
```bash
cd backend-go
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --project healthcare-forms-v2 \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app,ENVIRONMENT=production,CORS_ALLOWED_ORIGINS=https://healthcare-forms-v2.web.app;http://localhost:3000" \
  --no-allow-unauthenticated

# Make service publicly accessible
gcloud run services add-iam-policy-binding healthcare-forms-backend-go \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-central1 \
  --project=healthcare-forms-v2
```

### Frontend Deployment
```bash
cd frontend
npm run build
firebase deploy --only hosting --project healthcare-forms-v2
```

## Verification

### Test CSP Headers
```bash
curl https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/api/auth/session-login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}' \
  -v 2>&1 | grep -i "content-security"
```

### Expected Result
```
content-security-policy: default-src 'self'; script-src 'self' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://firebaseapp.com https://firebaseio.com https://googleapis.com; frame-ancestors 'none';
```

## Security Headers Now Active
- ✅ **Content-Security-Policy**: Restrictive policy without `unsafe-inline` in script-src
- ✅ **Strict-Transport-Security**: max-age=31536000; includeSubDomains; preload
- ✅ **X-Content-Type-Options**: nosniff
- ✅ **X-Frame-Options**: DENY
- ✅ **X-XSS-Protection**: 1; mode=block
- ✅ **Referrer-Policy**: strict-origin-when-cross-origin
- ✅ **Permissions-Policy**: geolocation=(), microphone=(), camera=()

## Testing Checklist

### Frontend Functionality
- [x] BodyPainDiagram click detection works
- [x] Pain intensity markers display correctly
- [x] Marker removal functions properly
- [x] Clear All button works
- [x] BodyDiagram2 sensation markers work
- [x] All sensation types selectable
- [x] SVG renders without console errors

### Backend Security
- [x] No CSP violations in browser console
- [x] API endpoints respond with security headers
- [x] PDF generation still works with diagrams
- [x] Form submission with diagram data succeeds

## HIPAA Compliance Notes
- Removes potential XSS vulnerability vector
- Strengthens defense against script injection attacks
- Maintains full functionality while improving security posture
- Aligns with December 2024 HIPAA security requirements

## Future Enhancements

### Redis Integration
To enable Redis caching for improved performance:
1. Create VPC connector for Cloud Run
2. Configure connector with Redis Memorystore instance
3. Add `REDIS_ADDR` environment variable with Redis host:port

### Additional CSP Improvements
Consider removing `'unsafe-inline'` from `style-src` once React/MUI support for CSP nonces is implemented.

## Rollback Plan
If issues arise:
1. Remove `DOMPurify.sanitize()` calls from frontend components
2. Add `'unsafe-inline'` back to script-src in CSP header
3. Redeploy both frontend and backend
4. Investigate issues before attempting fix again

## CORS Issue Fix (Added August 21, 2025)

### Issue
After security upgrades, frontend was unable to communicate with backend due to CORS errors blocking requests from `http://localhost:3000`.

### Root Cause
1. Missing `CORS_ALLOWED_ORIGINS` environment variable in Cloud Run deployment
2. CORS middleware needed to be applied before SecurityHeadersMiddleware
3. Default configuration only allowed localhost, not production URLs

### Fix Applied
1. **Updated `backend-go/cmd/server/main.go`**:
   - Added default CORS origins for development and production
   - Fixed middleware ordering (CORS before SecurityHeaders)
   
2. **Deployed with proper environment variable**:
   ```bash
   --set-env-vars "CORS_ALLOWED_ORIGINS=http://localhost:3000;https://healthcare-forms-v2.web.app;https://healthcare-forms-v2.firebaseapp.com"
   ```

### Current Status
- ✅ Backend accepts requests from both localhost and production URLs
- ✅ CORS errors resolved
- ✅ Frontend-backend communication restored

## Resources
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)