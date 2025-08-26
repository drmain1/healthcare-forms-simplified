
⏺ CRITICAL CSRF VULNERABILITY FIX - DETAILED IMPLEMENTATION 
  PLAN

  Executive Summary

  SEVERITY: CRITICAL - Authentication bypass vulnerability
  affecting all authenticated endpoints on production domain
  form.easydocforms.com.

  VULNERABILITY: The CSRF middleware accepts ANY 36-character
  string as a valid CSRF token for requests from Firebase
  hosting or custom domain, completely bypassing CSRF
  protection.

  IMPACT: Attackers can perform unauthorized actions on behalf
   of authenticated users including:
  - Deleting forms containing PHI data
  - Modifying organization settings
  - Accessing patient records
  - Creating unauthorized forms

  Current Vulnerable Code Location

  File: /backend-go/internal/api/csrf_middleware.go
  Lines: 45-50
  Function: CSRFMiddleware()

  The Vulnerability Explained

  Current BROKEN Logic:

  // Lines 45-50 - THIS IS VULNERABLE
  if isFirebaseOrigin || isCustomDomain {
      // Firebase Hosting and custom domain: Just check header
   token exists and is valid format
      if headerToken != "" && len(headerToken) == 36 { // UUID
   format
          validToken = true
          log.Printf("CSRF validation for same-origin domain -
   using header token only")
      }
  }

  Why This Is Broken:

  1. No Verification: The code only checks if the header
  contains ANY 36-character string
  2. Cookie Ignored: The actual CSRF token stored in the
  cookie is completely ignored
  3. Easy to Bypass: An attacker can send X-CSRF-Token: 
  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa and it will pass
  validation

  Attack Scenario:

  <!-- Malicious website: evil.com/attack.html -->
  <script>
  // This attack WILL WORK with current code
  fetch('https://form.easydocforms.com/api/forms/[FORM_ID]', {
      method: 'DELETE',
      headers: {
          'X-CSRF-Token':
  '12345678-1234-1234-1234-123456789012', // ANY UUID works!
          'Authorization': 'Bearer [stolen_or_existing_token]'
      },
      credentials: 'include'
  });
  </script>

  Step-by-Step Fix Implementation

  Step 1: Locate the File

  1. Open terminal/command prompt
  2. Navigate to project root: cd 
  /Users/davidmain/Desktop/cursor_projects/Forms .MD from opus
  3. Open the vulnerable file:
  backend-go/internal/api/csrf_middleware.go

  Step 2: Find the Vulnerable Code Block

  Look for lines 44-57. You will see:
  validToken := false
  if isFirebaseOrigin || isCustomDomain {
      // Firebase Hosting and custom domain: Just check header
   token exists and is valid format
      if headerToken != "" && len(headerToken) == 36 { // UUID
   format
          validToken = true
          log.Printf("CSRF validation for same-origin domain -
   using header token only")
      }
  } else {
      // Local/other: Traditional cookie+header validation
      if cookieErr == nil && headerToken != "" && cookieToken
  != "" && headerToken == cookieToken {
          validToken = true
          log.Printf("CSRF validation for non-Firebase origin 
  - cookie and header match")
      }
  }

  Step 3: Replace With Fixed Code

  Replace the ENTIRE block (lines 44-57) with:
  validToken := false

  // SECURITY FIX: Always validate that header token matches 
  cookie token
  // This prevents CSRF attacks even from same-origin requests
  if cookieErr == nil && headerToken != "" && cookieToken !=
  "" && headerToken == cookieToken {
      validToken = true

      // Log differently based on origin for debugging
      if isFirebaseOrigin || isCustomDomain {
          log.Printf("CSRF validation passed for production 
  domain - tokens match. Origin: %s", origin)
      } else {
          log.Printf("CSRF validation passed - tokens match. 
  Origin: %s", origin)
      }
  } else {
      // Detailed logging for debugging validation failures
      log.Printf("CSRF validation failed - Cookie exists: %v, 
  Header exists: %v, Tokens match: %v, Origin: %s",
          cookieErr == nil && cookieToken != "",
          headerToken != "",
          headerToken == cookieToken,
          origin)
  }

  Step 4: Understand Why This Fix Works

  The fixed code:
  1. ALWAYS requires the header token to match the cookie
  token
  2. NEVER accepts just any 36-character string
  3. Maintains the same-origin benefits (cookies will be sent
  automatically)
  4. Preserves the logging for debugging

  Step 5: Update Cookie Setting Logic (OPTIONAL but 
  Recommended)

  While not strictly required for the vulnerability fix,
  consider updating the cookie settings for better security:

  In the same file, find the GenerateCSRFToken function
  (around line 100) and update:

  Current line 106:
  3600*24, // 24 hours

  Change to:
  3600*4, // 4 hours - reduced lifetime for better security

  Do the same for:
  - Line 118 (localhost case)
  - Line 130 (cross-origin case)

  And in GenerateCSRFTokenInternal function:
  - Line 164
  - Line 176
  - Line 188

  Step 6: Test the Fix

  Test 1: Verify Legitimate Requests Still Work

  # From frontend, ensure normal operations work:
  # 1. Login to the application
  # 2. Create a form
  # 3. Submit a response
  # 4. View responses
  # All should work normally

  Test 2: Verify Attack is Blocked

  Create a test HTML file (test-csrf.html):
  <!DOCTYPE html>
  <html>
  <head><title>CSRF Test</title></head>
  <body>
  <h1>CSRF Attack Test</h1>
  <button onclick="testAttack()">Test CSRF Attack</button>
  <div id="result"></div>
  <script>
  function testAttack() {
      // This should now FAIL after the fix
      fetch('https://form.easydocforms.com/api/forms', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token':
  '12345678-1234-1234-1234-123456789012', // Fake token
              'Authorization': 'Bearer [YOUR_REAL_TOKEN]' // 
  You'd need a real token
          },
          body: JSON.stringify({ title: 'Hacked Form' }),
          credentials: 'include'
      })
      .then(r => r.json())
      .then(data => {
          document.getElementById('result').innerHTML =
              'Attack result: ' + JSON.stringify(data);
      });
  }
  </script>
  </body>
  </html>

  Expected Result: Should receive {"error":"Invalid CSRF 
  token","code":"CSRF_VALIDATION_FAILED"}

  Step 7: Deploy the Fix

  1. Test locally first:
  cd backend-go
  go test ./internal/api/... -v
  2. Build the application:
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -a -installsuffix cgo \
    -o server cmd/server/main.go
  3. Deploy to Cloud Run:
  gcloud run deploy healthcare-forms-backend-go \
    --source . \
    --region us-central1 \
    --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBE
  RG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"
  4. Monitor logs after deployment:
  gcloud run services logs tail healthcare-forms-backend-go
  --region us-central1

  Step 8: Verify Fix in Production

  1. Check that legitimate users can still use the application
   normally
  2. Monitor logs for any "CSRF validation failed" messages
  3. Run the CSRF test from Step 6 against production

  Additional Security Recommendations

  1. Add Rate Limiting (Future Enhancement)

  Consider adding rate limiting to prevent brute force
  attempts:
  // In main.go, before routes
  rateLimiter := gin_rate_limit.RateLimiter(
      gin_rate_limit.WithRate(10, time.Minute), // 10 requests
   per minute
  )
  r.Use(rateLimiter)

  2. Add Security Headers (Future Enhancement)

  Add these headers to all responses:
  r.Use(func(c *gin.Context) {
      c.Header("X-Frame-Options", "DENY")
      c.Header("X-Content-Type-Options", "nosniff")
      c.Header("Referrer-Policy",
  "strict-origin-when-cross-origin")
      c.Next()
  })

  3. Token Rotation (Future Enhancement)

  Rotate CSRF tokens after sensitive operations:
  - After form deletion
  - After organization settings change
  - After user role changes

  Validation Checklist

  Before marking this task complete, ensure:
  - Code has been updated exactly as specified
  - Local testing shows legitimate requests work
  - Local testing shows fake CSRF tokens are rejected
  - Unit tests pass
  - Code has been deployed to production
  - Production testing confirms the fix
  - No legitimate users are reporting issues

  Emergency Rollback Plan

  If issues occur after deployment:
  # Rollback to previous version
  gcloud run services update-traffic
  healthcare-forms-backend-go \
    --region us-central1 \
    --to-revisions=PREVIOUS_REVISION_ID=100

  Contact for Issues

  If you encounter any issues implementing this fix:
  1. Check the backend logs for detailed error messages
  2. Verify the exact line numbers match (code may have
  shifted)
  3. Ensure you're editing the correct file
  4. Test with curl commands to isolate frontend vs backend
  issues

  Summary

  This fix closes a CRITICAL security vulnerability that could
   allow attackers to bypass CSRF protection entirely. The fix
   is simple but must be implemented exactly as specified. The
   key change is to ALWAYS validate that the header token
  matches the cookie token, regardless of the origin.
