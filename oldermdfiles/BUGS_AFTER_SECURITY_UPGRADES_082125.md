# Bugs After Security Upgrades - August 21-22, 2025

## Date: August 21-22, 2025

## Security Upgrades Implemented
1. **DOMPurify for SVG Sanitization** - Removed `unsafe-inline` from CSP script-src
2. **CSRF Token Protection** - Added CSRF middleware to all authenticated routes
3. **Enhanced Security Headers** - Strict CSP, HSTS, X-Frame-Options, etc.
4. **Redis Caching** - Made optional to avoid deployment blocking

## Bugs Encountered and Fixed

### 1. API Endpoint 404 Errors
**Issue:** Frontend requests to `/api/responses/` returning 404
**Root Cause:** Trailing slashes in frontend API calls not handled by backend (Gin router has `RedirectTrailingSlash = false`)
**Fix:** Removed trailing slashes from all API endpoint URLs in frontend:
- `responsesApi.ts`: Changed `/responses/` to `/responses`
- `formsApi.ts`: Changed `/forms/` to `/forms` and all other endpoints

### 2. Authentication 401 Errors
**Issue:** API calls failing with "incorrect number of segments" error
**Root Cause:** Firebase ID token not being properly sent or validated
**Status:** Resolved after fixing trailing slashes

### 3. Share Link Creation 403 Forbidden
**Issue:** Creating share links returns 403 "permission denied"
**Root Cause:** Legacy forms created before organization ID field was properly set
**Fix:** Modified `share_links.go` to:
- Auto-assign organization ID to legacy forms without one
- Add debug logging for organization ID mismatches
- Update form with current user's organization ID when missing

### 4. Backend URL Configuration Error
**Issue:** Frontend using incorrect backend URL format
**Root Cause:** `.env.local` had malformed URL with project ID instead of Cloud Run hash
**Fix:** Corrected URLs in `.env.local`:
- From: `https://healthcare-forms-backend-go-673381373352.us-central1.run.app`
- To: `https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app`

### 5. CSRF Token 403 Errors in Production (August 22, 2025)
**Issue:** Form creation failing with 403 "Invalid CSRF token" in production
**Root Cause:** Multiple interconnected issues:
1. `REACT_APP_API_URL` set to empty string in production `.env.production`
2. Frontend code not handling empty string case, falling back to localhost URLs
3. CSRF cookies not being sent due to SameSite=None with Firebase Hosting proxy

**Fixes Applied:**

#### A. API URL Configuration (Frontend)
Fixed all instances to handle empty string properly:
```javascript
// Pattern applied across all files:
process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api')
```

Files fixed:
- `frontend/src/index.tsx` - axios.defaults.baseURL
- `frontend/src/store/api/baseApi.ts` - RTK Query base URL
- `frontend/src/store/api/organizationsApi.ts` - Organizations API URL
- `frontend/src/config/api.ts` - API configuration
- `frontend/src/utils/csrfToken.ts` - CSRF token fetch URL
- `frontend/src/services/authService.ts` - Session login URL
- `frontend/src/contexts/FirebaseAuthContext.tsx` - Organization fetch URL
- `frontend/src/components/Settings/ClinicSettings.tsx` - Settings API URLs
- `frontend/src/components/Responses/PdfExportButton.tsx` - PDF generation URL
- `frontend/src/services/insuranceCardService.ts` - Insurance card API URL

#### B. CSRF Cookie SameSite Policy (Backend)
Modified cookie settings to use `SameSite=Lax` for Firebase Hosting domains:
```go
// Pattern applied in csrf_middleware.go and auth.go:
if strings.Contains(origin, "firebaseapp.com") || strings.Contains(origin, ".web.app") {
    c.SetSameSite(http.SameSiteLaxMode)
} else {
    c.SetSameSite(http.SameSiteNoneMode)
}
```

Files fixed:
- `backend-go/internal/api/csrf_middleware.go` - Both GenerateCSRFToken functions
- `backend-go/internal/api/auth.go` - Session cookie in SessionLogin

#### C. Debug Logging Added (Frontend)
Added console logging to trace CSRF token flow:
- `frontend/src/utils/csrfToken.ts` - Token fetch and cookie reading
- `frontend/src/store/api/baseApi.ts` - Token inclusion in headers
- `frontend/src/App.tsx` - Application startup verification

**Current Status:** 
- Backend deployed with SameSite=Lax for Firebase domains
- Frontend deployed with correct API URL handling
- **ISSUE:** Debug logs not appearing in browser console (needs investigation)
- **ISSUE:** CSRF token still not being sent with requests (403 errors persist)

## Files Modified

### Frontend
- `/frontend/.env.local` - Fixed backend URLs
- `/frontend/.env.production` - Set to empty string for Firebase proxy
- `/frontend/src/store/api/responsesApi.ts` - Removed trailing slashes
- `/frontend/src/store/api/formsApi.ts` - Removed trailing slashes
- `/frontend/src/index.tsx` - Fixed axios baseURL configuration
- `/frontend/src/store/api/baseApi.ts` - Fixed RTK Query base URL
- `/frontend/src/store/api/organizationsApi.ts` - Fixed organizations API URL
- `/frontend/src/config/api.ts` - Fixed API URL configuration
- `/frontend/src/utils/csrfToken.ts` - Fixed CSRF token fetch URL and added logging
- `/frontend/src/services/authService.ts` - Fixed session login URL
- `/frontend/src/contexts/FirebaseAuthContext.tsx` - Fixed organization fetch URL
- `/frontend/src/components/Settings/ClinicSettings.tsx` - Fixed settings API URLs
- `/frontend/src/components/Responses/PdfExportButton.tsx` - Fixed PDF generation URL
- `/frontend/src/services/insuranceCardService.ts` - Fixed insurance card API URL
- `/frontend/src/App.tsx` - Added debug logging

### Backend
- `/backend-go/internal/api/share_links.go` - Added organization ID handling for legacy forms
- `/backend-go/internal/api/forms.go` - Allow access to forms without organization ID
- `/backend-go/internal/api/headers_middleware.go` - Removed `unsafe-inline` from CSP
- `/backend-go/internal/api/csrf_middleware.go` - Added SameSite=Lax for Firebase domains
- `/backend-go/internal/api/auth.go` - Added SameSite=Lax for session cookie
- `/backend-go/cmd/server/main.go` - Made Redis optional

## Deployment Commands Used
```bash
# Backend deployment with security fixes and CSRF cookie fix
cd backend-go
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --project healthcare-forms-v2 \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"

# Or using Cloud Build for faster deployment
gcloud builds submit --tag gcr.io/healthcare-forms-v2/healthcare-forms-backend-go
gcloud run deploy healthcare-forms-backend-go \
  --image gcr.io/healthcare-forms-v2/healthcare-forms-backend-go \
  --region us-central1 \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"

# Frontend deployment
cd frontend
npm run build
firebase deploy --only hosting --project healthcare-forms-v2
```

## Current Status
- ✅ SVG sanitization with DOMPurify working
- ✅ CSP headers properly configured without `unsafe-inline`
- ✅ API endpoints accessible without trailing slash issues
- ✅ Share link creation working for all forms
- ✅ Authentication flow working correctly
- ✅ API URL configuration fixed for production environment
- ✅ Backend CSRF cookies configured with SameSite=Lax for Firebase domains
- ❌ CSRF token validation failing - cookies not being sent with requests
- ❌ Frontend debug logs not appearing in console

## Testing Checklist
- [x] Body pain diagram functionality
- [x] API authentication with Firebase tokens
- [x] Form responses listing
- [x] Share link creation and management
- [x] PDF generation with body diagrams
- [ ] Full end-to-end form submission via public link
- [ ] CSRF token validation on all POST/PUT/DELETE requests
- [ ] CSRF cookie being properly set and sent with requests

## Open Issues Requiring Investigation
1. **CSRF Cookie Not Being Sent**: Despite setting SameSite=Lax, the CSRF cookie is not being included in requests
2. **Debug Logs Not Appearing**: Console.log statements added for debugging are not showing in browser console
3. **Cross-Origin-Opener-Policy Errors**: Multiple COOP errors in console may be affecting script execution

## Technical Details

### Firebase Hosting Configuration
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "healthcare-forms-backend-go",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

### Backend CSRF Middleware Logs
```
2025/08/22 15:03:47 Generated CSRF token: 76e72967-031c-441b-9071-82a6b409c509, Secure: true, Origin: https://healthcare-forms-v2.web.app
2025/08/22 15:04:03 CSRF Check - Method: POST, Path: /api/forms, Header Token: , Cookie Token: , Error: http: named cookie not present
```

## Lessons Learned
1. **Trailing Slashes Matter** - When `RedirectTrailingSlash` is disabled in Gin, ensure frontend and backend agree on URL format
2. **Legacy Data Migration** - Always handle cases where older data lacks required fields
3. **Environment Variables** - Empty string is falsy in JavaScript, needs explicit checking
4. **Cookie Policies** - SameSite=None requires Secure flag and can cause issues with proxies
5. **Firebase Hosting Proxy** - Requests through Firebase proxy are considered same-site, use SameSite=Lax
6. **Debug Logging** - Essential for diagnosing cookie and CORS issues in production

## Follow-up Tasks
1. Investigate why CSRF cookies aren't being sent despite SameSite=Lax
2. Debug why console.log statements aren't appearing in production build
3. Review Cross-Origin-Opener-Policy configuration
4. Consider alternative CSRF protection methods if cookie-based approach continues to fail
5. Add automated migration script for legacy forms without organization IDs
6. Add monitoring alerts for 403/404 errors to catch similar issues faster
7. Document the organization ID assignment logic in API documentation

## Next Steps for Investigation
1. Check if cookies are being set at all using browser DevTools
2. Verify cookie domain and path settings
3. Test with different browsers to rule out browser-specific issues
4. Consider using header-based CSRF tokens instead of cookie-based
5. Review Firebase Hosting proxy headers and cookie forwarding