# Gotenberg PDF Generation Service Architecture

This document outlines the architecture of the Gotenberg PDF generation service and its integration with the Go backend.

## Overview

The PDF generation functionality has been externalized from the main Go backend into a dedicated, containerized service using [Gotenberg](https://gotenberg.dev/). This approach offers several advantages:

*   **Decoupling:** The backend and PDF generation services are decoupled, allowing them to be scaled and updated independently.
*   **Security:** The Gotenberg service is secured and only accessible by the Go backend, adhering to the principle of least privilege.
*   **Scalability:** The Gotenberg service can be scaled independently to handle high volumes of PDF generation requests without impacting the performance of the main backend.

## GCP Cloud Run Services

The architecture consists of two main services running on Google Cloud Run:

1.  **`healthcare-forms-backend-go`**: The main Go backend application.
2.  **`gotenberg`**: The dedicated PDF generation service.

Both services are deployed in the `us-central1` region.

## Security and IAM

To ensure a secure, HIPAA-compliant environment, the following security measures have been implemented:

*   **Dedicated Service Account:** A new service account, `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`, has been created specifically for the `healthcare-forms-backend-go` service. This service account is granted only the necessary permissions to access other GCP services, following the principle of least privilege.
*   **Restricted Access to Gotenberg:** The `gotenberg` service is **not** publicly accessible. It can only be invoked by the `go-backend-sa` service account, which has been granted the `roles/run.invoker` IAM role for the `gotenberg` service.
*   **Service-to-Service Authentication:** Cloud Run handles the authentication between the Go backend and the Gotenberg service automatically, using the service account's identity.

## Configuration

The `healthcare-forms-backend-go` service is configured to communicate with the `gotenberg` service via the following environment variable:

*   `GOTENBERG_URL`: `https://gotenberg-673381373352.us-central1.run.app`

This URL points to the internal, secure endpoint of the `gotenberg` service.

## Current Implementation Status

### What's Been Implemented

1. **Frontend Changes (Completed)**:
   - `ResponseDetail.tsx`: Added `surveyContainerRef` to capture rendered SurveyJS form HTML
   - `PdfExportButton.tsx`: Updated to accept `getHtmlContent` prop and send HTML to backend
   - Removed old PDF mutation dependency

2. **Backend Changes (Completed)**:
   - Created `gotenberg.go` with Gotenberg client implementation
   - Added `ExportHTMLToPDF` handler in `forms.go`
   - Added route `/api/forms/:id/export-html-to-pdf` in `main.go`
   - Fixed missing imports (`bytes` and `html/template`)
   - Successfully deployed to Cloud Run at: `https://healthcare-forms-backend-go-673381373352.us-central1.run.app`

3. **Environment Configuration**:
   - Updated `.env.local` with new backend URL
   - `GOTENBERG_URL` is configured in `cloudbuild.yaml`

### Current Issues - CRITICAL

#### Issue Summary (August 5, 2025)
The PDF export functionality has progressed but still has critical issues:

1. **401 - Session Login Failure**:
   - **Error**: `POST /api/auth/session-login` returns 401 with "INSUFFICIENT_PERMISSION"
   - **Root Cause**: Firebase Admin SDK cannot create session cookies
   - **Log Evidence**:
     ```
     2025/08/05 03:31:08 Error creating session cookie: unexpected http response with status: 400
     {
       "error": {
         "code": 400,
         "message": "INSUFFICIENT_PERMISSION",
         "errors": [
           {
             "message": "INSUFFICIENT_PERMISSION",
             "domain": "global",
             "reason": "invalid"
           }
         ]
       }
     }
     ```
   - **Impact**: Users cannot establish authenticated sessions with the backend

2. **404 - Missing Review Endpoint**:
   - **Error**: `POST /api/responses/:id/review` returns 404
   - **Root Cause**: This endpoint is not implemented in the Go backend
   - **Impact**: Frontend review functionality is broken

3. **500 - Gotenberg Access Forbidden** (RESOLVED):
   - **Previous Error**: PDF export failed with 500 error
   - **Fix Applied**: Fixed compilation errors and authentication
   - **Status**: ✅ Backend now successfully connects to Gotenberg

4. **PDF Content Issues** (NEW - August 5):
   - **Current Problem**: PDF generates but lacks actual question text
   - **Symptoms**:
     - HTML capture is 239KB but contains no question text
     - Question titles show as "question1", "question2" etc. instead of actual text
     - No answer values are captured
   - **Debug Evidence**:
     ```
     Number of question titles found: 7
     Question 1 text: question1
     Question 2 text: question2
     ...
     Contains any question text? false
     ```
   - **Root Cause**: SurveyJS is rendering question names/IDs instead of titles
   - **Impact**: PDFs are generated but show only structure without content

5. **Attempted Fixes (August 5)**:
   - ✅ Added 1-second delay before HTML capture
   - ✅ Force survey re-render before capture
   - ✅ Added comprehensive CSS styling (170+ lines)
   - ✅ Set up onAfterRenderSurvey event handler
   - ❌ Still capturing question IDs instead of actual text

### Root Cause Analysis

1. **SurveyJS Display Mode Issue**:
   - Survey is rendering in display mode but showing question names instead of titles
   - Possible causes:
     - Survey JSON might be missing title properties
     - Display mode might be rendering differently than expected
     - Question text might be stored in a different property

2. **Service Account Permissions** (for session login):
   - The `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com` service account likely lacks:
     - Firebase Admin SDK permissions for session cookie management

2. **IAM Configuration Required**:
   ```bash
   # Grant Firebase Admin permissions
   gcloud projects add-iam-policy-binding healthcare-forms-v2 \
     --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
     --role="roles/firebase.admin"

   # Ensure Cloud Run invoker role for Gotenberg
   gcloud run services add-iam-policy-binding gotenberg \
     --region=us-central1 \
     --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
     --role="roles/run.invoker"
   ```

3. **Backend Deployment Status**:
   - Current deployment: `https://healthcare-forms-backend-go-673381373352.us-central1.run.app`
   - Using distroless image: `gcr.io/healthcare-forms-v2/healthcare-forms-backend-go:latest`
   - Frontend fix for authentication not yet deployed

### Immediate Actions Needed

1. **Fix SurveyJS Question Rendering** (PRIORITY):
   - Investigate why question titles show as IDs ("question1") instead of actual text
   - Check the survey JSON structure in the form data
   - Verify the correct property is being used for question titles
   - Test with a simple hardcoded survey to isolate the issue

2. **Fix Service Account Permissions** (for session login):
   - Grant Firebase Admin role to `go-backend-sa`
   - This will resolve the 401 session login errors

3. **Implement Missing Endpoint**:
   - Add `/api/responses/:id/review` endpoint to the Go backend
   - Or update frontend to stop calling this non-existent endpoint

4. **Debug Suggestions for Tomorrow**:
   - Log the actual survey JSON to see what properties exist
   - Try rendering survey without display mode to see if text appears
   - Check if question titles are in `title` vs `name` vs another property
   - Test with survey.getAllQuestions() to inspect question objects

### Testing Commands for GCP Agent

```bash
# Check current IAM bindings for the service account
gcloud projects get-iam-policy healthcare-forms-v2 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com"

# Check Gotenberg service IAM policy
gcloud run services get-iam-policy gotenberg --region=us-central1

# Test Gotenberg service directly
curl -X POST https://gotenberg-673381373352.us-central1.run.app/forms/chromium/convert/html \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -F "index.html=@test.html"

# Check backend service account configuration
gcloud run services describe healthcare-forms-backend-go \
  --region=us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"
```

### Deployment Information

#### Docker Image Details
- **Image**: `gcr.io/healthcare-forms-v2/healthcare-forms-backend-go:latest`
- **Also tagged**: `gcr.io/healthcare-forms-v2/healthcare-forms-backend-go:20250804-202051`
- **Base**: Google Distroless (`gcr.io/distroless/static-debian12:nonroot`)
- **Digest**: `sha256:bf7e7caf89879fb21cc68aaddd463a2b4cfbfbad2054db12be0de0b93c065680`

#### Environment Variables Needed
```yaml
# In Cloud Run service configuration
GOOGLE_CLOUD_PROJECT: healthcare-forms-v2
GOTENBERG_URL: https://gotenberg-673381373352.us-central1.run.app
PORT: 8080
```

#### Service URLs
- **Go Backend**: `https://healthcare-forms-backend-go-673381373352.us-central1.run.app`
- **Gotenberg**: `https://gotenberg-673381373352.us-central1.run.app`
- **Frontend**: Currently using the Go backend URL in `.env.local`

### Critical Files to Check

1. **Backend Authentication** (`/backend-go/internal/api/auth.go`):
   - Session login handler that's failing with INSUFFICIENT_PERMISSION
   - Needs Firebase Admin SDK permissions

2. **Gotenberg Client** (`/backend-go/internal/pdf/gotenberg.go`):
   - Contains the HTTP client that's getting 403 from Gotenberg
   - May need to add authentication headers

3. **Frontend Config** (`/frontend/.env.local`):
   ```
   REACT_APP_API_URL=https://healthcare-forms-backend-go-673381373352.us-central1.run.app/api
   ```

### How The Flow Should Work

1. User clicks "Export PDF" button on Response Detail page
2. Frontend captures the rendered SurveyJS form HTML via `surveyContainerRef`
3. Frontend gets Firebase ID token using `firebaseAuth.getIdToken()`
4. Frontend sends HTML + token to backend endpoint `/api/forms/:id/export-html-to-pdf`
5. Backend validates the Firebase token
6. Backend forwards HTML to Gotenberg service for conversion
7. Gotenberg converts HTML to PDF and returns it
8. Backend sends PDF back to frontend
9. Frontend triggers download of the PDF file

### Complete Fix Checklist for GCP Agent

- [ ] Grant `roles/firebase.admin` to `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`
- [ ] Grant `roles/run.invoker` on Gotenberg service to `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`
- [ ] Deploy frontend with PdfExportButton authentication fix
- [ ] Verify Gotenberg service is running and accessible
- [ ] Test PDF export end-to-end
- [ ] Either implement `/api/responses/:id/review` endpoint or remove frontend calls to it
- [ ] Monitor Cloud Run logs for any remaining errors
