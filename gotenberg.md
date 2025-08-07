# Gotenberg PDF Generation Service Architecture

**Last Updated: December 2024**  
**Status: ✅ FULLY OPERATIONAL WITH CLINIC HEADERS**

This document outlines the architecture of the Gotenberg PDF generation service and its integration with the Go backend.

## Overview

The PDF generation functionality uses a two-stage process with AI-powered HTML generation followed by PDF conversion using [Gotenberg](https://gotenberg.dev/). This architecture provides:

*   **AI-Powered Generation:** Vertex AI (Gemini) creates professional medical document HTML from form responses
*   **Decoupling:** The backend and PDF generation services are decoupled, allowing them to be scaled and updated independently
*   **Security:** The Gotenberg service is secured and only accessible by the Go backend, adhering to the principle of least privilege
*   **Scalability:** Both services can be scaled independently to handle high volumes of PDF generation requests

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

The `healthcare-forms-backend-go` service is configured with the following environment variables:

*   `GOTENBERG_URL`: `https://gotenberg-ubaop6yg4q-uc.a.run.app` - Gotenberg service endpoint
*   `GCP_PROJECT_ID`: `healthcare-forms-v2` - Google Cloud project ID

The backend uses:
*   **Vertex AI Model**: `gemini-2.5-flash-lite` for HTML generation
*   **Service Account**: `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`

## Current Implementation Status

### ✅ FULLY WORKING Implementation (August 6, 2025)

1. **PDF Generation Pipeline**:
   - Form response data fetched from Firestore `form_responses` collection
   - Data processed through `ProcessAndFlattenForm` to extract visible questions
   - Vertex AI (Gemini 2.5 Flash Lite) generates professional HTML with clinical summary
   - Gotenberg converts HTML to PDF
   - PDF returned to client for download

2. **Backend Components**:
   - `pdf_generator.go`: Main orchestrator for PDF generation
   - `form_processor.go`: Processes SurveyJS conditional logic
   - `vertex_service.go`: Handles AI-powered HTML generation
   - `gotenberg_service.go`: Manages HTML to PDF conversion with authentication
   - Endpoint: `POST /api/responses/:responseId/generate-pdf`

3. **Key Fixes Applied**:
   - Fixed Firestore field mappings (`form_id` → `form`, `response_data` → `data`)
   - Added Google Cloud authentication to Gotenberg service calls
   - Enhanced error logging throughout the pipeline
   - Properly configured service account permissions

### Previous Issues - ALL RESOLVED

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

### Resolution Summary

1. **Field Mapping Issue (RESOLVED)**:
   - **Problem**: Backend was looking for wrong field names in Firestore
   - **Solution**: Corrected field mappings to match actual schema
     - `form_id` → `form`
     - `response_data` → `data`

2. **Authentication Issue (RESOLVED)**:
   - **Problem**: Gotenberg service returned 403 Forbidden
   - **Solution**: Added Google Cloud authentication using `idtoken.NewClient()`
   - Service account `go-backend-sa` has proper IAM permissions

3. **Working IAM Configuration**:
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

### Dependencies and Libraries

#### Backend Dependencies
- **Vertex AI SDK**: `cloud.google.com/go/vertexai/genai`
- **Firestore SDK**: `cloud.google.com/go/firestore`
- **Google ID Token**: `google.golang.org/api/idtoken`
- **Gin Framework**: `github.com/gin-gonic/gin`
- **Model**: Gemini 2.5 Flash Lite

#### Service Dependencies
- **Gotenberg**: Version 8.x running on Cloud Run
- **Supported formats**: HTML to PDF via Chromium engine
- **Authentication**: Service-to-service via Google Cloud IAM

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

### How The PDF Generation Works

1. User clicks "Generate PDF" button on Response Detail page
2. Frontend sends request to `/api/responses/:responseId/generate-pdf`
3. Backend fetches form response from Firestore `form_responses` collection
4. Backend fetches form definition from Firestore `forms` collection
5. **NEW: Backend fetches organization's clinic info from Firestore `organizations` collection**
6. Form processor extracts visible questions based on SurveyJS conditional logic
7. Vertex AI (Gemini) generates professional HTML with:
   - **NEW: Clinic header with logo, name, address, contact info**
   - Clinical summary paragraph
   - 2-column layout for space efficiency
   - Grouped sections (Patient Info, Health Complaints, etc.)
   - Professional footer with confidentiality notice
8. Gotenberg converts the HTML to PDF with proper formatting
9. PDF is returned to frontend for download
10. Frontend triggers browser download of the PDF file

### Monitoring and Debugging

#### Check PDF Generation Logs
```bash
# View recent PDF generation attempts
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 50 | grep -E "PDF generation|ERROR"

# Check Gotenberg service health
curl https://gotenberg-ubaop6yg4q-uc.a.run.app/health
```

#### Common Issues and Solutions

| Issue | Error Message | Solution |
|-------|--------------|----------|
| Field not found | "Form ID not found in response document" | Check Firestore field names match code |
| Auth failure | "403 Forbidden" from Gotenberg | Verify service account has run.invoker role |
| Model error | "Failed to generate HTML from AI service" | Check Vertex AI quota and model name |
| Network timeout | Request timeout | Increase Cloud Run timeout settings |

### Current Deployment Details

- **Backend Revision**: `healthcare-forms-backend-go-00047-qwx`
- **Backend URL**: `https://healthcare-forms-backend-go-673381373352.us-central1.run.app`
- **Gotenberg URL**: `https://gotenberg-ubaop6yg4q-uc.a.run.app`
- **Last Deploy**: August 6, 2025
- **Status**: ✅ All systems operational

## Signature Support (Added August 6, 2025)

### Overview
The PDF generation pipeline now fully supports SurveyJS signature pad fields, embedding them as images in the generated PDFs. This is critical for medical forms requiring multiple signatures (patient, guardian, witness, etc.).

### How Signatures Work

1. **Data Capture**: SurveyJS signature pads generate base64-encoded data URLs
   - Format: `data:image/png;base64,iVBORw0KGgoAAAANS...`
   - Typical size: 10-50KB per signature

2. **Storage**: Signatures stored in Firestore `form_responses` collection
   - Field: `data` (map[string]interface{})
   - No special handling needed - stored as regular string values

3. **Processing Pipeline**:
   ```
   Frontend (SurveyJS) → Base64 Data URL
   ↓
   Backend API → Firestore Storage
   ↓
   PDF Generation Request
   ↓
   form_processor.go → Preserves signature data
   ↓
   vertex_service.go → Embeds as <img> tags
   ↓
   Gotenberg → Renders images in PDF
   ```

### Implementation Details

#### Backend Components

1. **form_processor.go** (Updated)
   ```go
   type VisibleQuestion struct {
       Name          string      `json:"name"`
       Title         string      `json:"title"`
       Answer        interface{} `json:"answer"`
       QuestionType  string      `json:"questionType"`
       IsSignature   bool        `json:"isSignature,omitempty"`
       SignatureData string      `json:"signatureData,omitempty"`
   }
   ```
   - Detects signature pad questions by type
   - Preserves base64 data in `SignatureData` field
   - Validates data URL format
   - Handles empty signatures gracefully

2. **vertex_service.go** (Updated)
   - AI prompt enhanced to recognize signature fields
   - Embeds signatures as: `<img src="data:image/png;base64,..." style="max-width: 200px; height: auto;">`
   - Groups all signatures in "Signatures & Consent" section
   - Shows "No signature provided" for missing signatures

#### Frontend Components

1. **signatureValidation.ts** (New)
   - Validates signature data before submission
   - Detects empty signatures (blank canvas)
   - Size-based validation (real signatures > 1000 chars)
   - Provides validation messages for required signatures

2. **PublicFormFill.tsx** (Updated)
   - Integrates signature validation
   - Cleans empty signatures before submission
   - Shows proper error messages

### Multiple Signatures Support

Medical forms often require multiple signatures:
- Patient signature
- Guardian/caregiver signature
- Witness signature
- Terms acceptance signature

The system handles unlimited signatures per form, each:
- Validated independently
- Displayed with proper labels
- Grouped in PDF output
- Sized appropriately (max-width: 200px)

### Performance Considerations

**PDF Generation Time**: ~35 seconds total
- Firestore fetch: ~1 second
- Form processing: <1 second
- Vertex AI HTML generation: ~22 seconds
- Gotenberg PDF conversion: ~13 seconds

**Cloud Run Compute Cost**:
- Full 35 seconds billed (includes wait time)
- ~$0.0007 per PDF at current rates
- Consider async processing for high volume

### Environment Variables

Required environment variables for Cloud Run deployment:
```yaml
GCP_PROJECT_ID: healthcare-forms-v2
GOTENBERG_URL: https://gotenberg-ubaop6yg4q-uc.a.run.app
CORS_ALLOWED_ORIGINS: http://localhost:3000;https://healthcare-forms-v2.web.app;https://healthcare-forms-v2.firebaseapp.com
```

### Testing Signatures

1. Create a form with signature pad fields:
   ```javascript
   {
     type: 'signaturepad',
     name: 'patient_signature',
     title: 'Patient Signature',
     isRequired: true
   }
   ```

2. Fill and submit the form with signatures

3. Generate PDF - signatures appear as embedded images

### Troubleshooting Signatures

| Issue | Cause | Solution |
|-------|-------|----------|
| Signatures show as "[No Signature]" | Empty or invalid base64 data | Check frontend validation is working |
| PDF generation fails | Malformed base64 data | Validate data URL format |
| Signatures too large/small in PDF | CSS styling issue | Adjust max-width in vertex_service.go prompt |
| CORS errors on PDF export | Missing CORS origins | Update CORS_ALLOWED_ORIGINS env var |

### Dependencies

- **SurveyJS**: Provides signature pad component
- **Gotenberg**: Supports base64 data URLs in HTML
- **Vertex AI**: Generates HTML with embedded images
- **No additional libraries required** - works with existing stack

## Clinic Header Support (Added December 2024)

### Overview
PDFs now include professional clinic headers with organization-specific branding. This is a multi-tenant feature where each organization's PDFs automatically include their clinic information.

### Data Structure
Organizations store clinic information in Firestore:
```go
type ClinicInfo struct {
    ClinicName        string // Required
    AddressLine1      string // Required
    AddressLine2      string // Optional (Suite, Floor, etc.)
    City              string // Required
    State             string // Required (2-letter code)
    ZipCode           string // Required
    Phone             string // Required (formatted)
    Fax               string // Optional
    Email             string // Required
    Website           string // Optional
    TaxID             string // Optional (Federal Tax ID)
    NPI               string // Optional (National Provider ID)
    LogoURL           string // Optional (hosted image URL)
    PrimaryColor      string // Optional (header background)
    SecondaryColor    string // Optional (accent color)
}
```

### Implementation
1. **Backend API Endpoints**:
   - `GET /api/organizations/:id/clinic-info` - Retrieve clinic settings
   - `PUT /api/organizations/:id/clinic-info` - Update clinic settings

2. **PDF Generation Enhancement**:
   - `pdf_generator.go` fetches organization's clinic info
   - `vertex_service.go` includes `GeneratePDFHTMLWithClinic()` method
   - Vertex AI prompt creates professional medical headers

3. **Frontend Settings Page**:
   - `ClinicSettings.tsx` component for managing clinic information
   - Real-time validation and formatting (phone numbers, etc.)
   - Color picker for branding customization

### Deployment Automation

**Quick Deploy Script** (`deploy-backend.sh`):
```bash
# Make executable (first time only)
chmod +x deploy-backend.sh

# Deploy to Cloud Run with distroless image
./deploy-backend.sh

# Or build locally for testing
./deploy-backend.sh --local
```

The script automates:
- Multi-stage Docker build (Alpine builder → Distroless runtime)
- Push to Google Container Registry
- Deploy to Cloud Run with all environment variables
- Health check verification

### Multi-Tenant Architecture
- Flat structure: Each organization has one clinic address
- Automatic PDF branding per organization
- No cross-tenant data access
- Clinic info embedded in organization document

### Future Enhancements

Consider for optimization:
1. Compress signature images before storage
2. Implement signature image caching
3. Add signature verification/timestamps
4. Support for drawing tablets
5. Async PDF generation for better UX
6. Direct file upload for clinic logos (currently URL-based)
7. PDF templates per organization
8. Custom fonts and advanced branding options
