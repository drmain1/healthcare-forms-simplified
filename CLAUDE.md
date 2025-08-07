# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Go)
```bash
cd backend-go

# Run development server
go run cmd/server/main.go

# Build for production
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-w -s -extldflags '-static'" \
  -a -installsuffix cgo \
  -o server cmd/server/main.go

# Deploy to Cloud Run
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"

# Run tests
go test ./...
go test -v ./...              # verbose output
go test -race ./...           # with race detection
go test ./internal/api        # specific package

# Format code
go fmt ./...
```

### Frontend (React + TypeScript)
```bash
cd frontend

# Install dependencies (IMPORTANT: legacy peer deps required for SurveyJS)
npm install --legacy-peer-deps

# Development server
npm start                      # http://localhost:3000

# Production build
npm run build

# Run tests
npm test
npm test -- --coverage        # with coverage
npm test -- --watchAll=false  # single run
npm test -- src/components/Auth/Login.test.tsx  # specific test file
npm test -- --testNamePattern="should render"   # pattern matching

# Lint and analysis
npm run lint
npm run analyze               # build and serve for analysis
npm run bundle-size          # check bundle sizes

# Firebase deployment
firebase deploy --only hosting --project healthcare-forms-v2
```

## Architecture Overview

### Dual Backend System (Migration in Progress)
The platform currently has TWO backend implementations in transition:

1. **Go Backend** (`backend-go/`) - NEW, actively deployed
   - Cloud Run: `healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app`
   - Uses Gin framework with CORS middleware
   - Vertex AI integration for PDF generation
   - Gotenberg service for HTML to PDF conversion
   - Service Account: `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`

2. **FastAPI Backend** (`backend-fastapi/`) - LEGACY, being phased out
   - Python-based, original implementation
   - Reference for API structure during migration
   - NOT actively maintained

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Form Engine**: SurveyJS (requires license key in env)
- **Authentication**: Firebase Auth with Google Sign-In
- **UI Components**: Material-UI (MUI) + Tailwind CSS
- **Encryption**: Client-side PHI encryption using CryptoJS
- **Mobile**: Enhanced mobile UI with dedicated styles

### Database Structure (Firestore)
```
healthcare-forms-v2/
├── organizations/          # Multi-tenant orgs
├── forms/                  # Form definitions with SurveyJS JSON
├── form_responses/         # Submitted responses (NOTE: not "responses")
├── form_templates/         # Reusable templates
└── share_links/           # Public form share tokens
```

### Critical Configuration Files
- **GCP Project ID**: `healthcare-forms-v2` (project number: 673381373352)
- **Service Account**: `backend-go/healthcare-forms-v2-credentials.json` (gitignored)
- **Frontend ENV**: `frontend/.env.local` (contains Firebase config and API URLs)
- **Firebase Config**: `firebase.json` (hosting rewrites to Cloud Run)
- **Go Module**: `github.com/gemini/forms-api` (Go 1.24)

## Known Issues & Gotchas

### PDF Generation Collection Mismatch
The PDF generator (`backend-go/internal/api/pdf_generator.go`) looks for collection `"responses"` but should use `"form_responses"`:
```go
// WRONG (current):
client.Collection("responses").Doc(responseId)

// CORRECT (should be):
client.Collection("form_responses").Doc(responseId)
```

### SurveyJS License
- License key required in `REACT_APP_SURVEYJS_LICENSE_KEY`
- Use `--legacy-peer-deps` for npm install due to SurveyJS dependencies

### CORS Configuration
- Backend CORS allows all origins in development
- Production uses Firebase Hosting rewrites to avoid CORS issues

### Session Timeout
- 15-minute automatic timeout for HIPAA compliance
- Handled by `frontend/src/utils/sessionTimeout.ts`
- Clears all PHI data from Redux store on timeout

## Security & Compliance

### HIPAA Requirements
- All PHI data encrypted client-side before storage
- Session-based encryption keys (never persisted)
- Automatic PHI cleanup on navigation
- Audit logging for all data access
- 15-minute session timeout

### Container Security
- Production uses Google Distroless images (nonroot)
- No shell, minimal attack surface
- Static binary compilation with security flags
- Dockerfile location: `backend-go/Dockerfile`
  - Build stage: `golang:1.24-alpine`
  - Runtime stage: `gcr.io/distroless/static-debian12:nonroot`
  - Runs as non-root user (UID 65532)

### Authentication Flow
1. User signs in with Google via Firebase Auth
2. Frontend receives Firebase ID token
3. Token sent to backend in Authorization header
4. Backend validates with Firebase Admin SDK
5. Organization context determined from user profile

## AI Services Integration

### Vertex AI (Gemini)
- Model: `gemini-2.5-flash-lite`
- Used for PDF HTML generation with clinical summaries
- Service: `backend-go/internal/services/vertex_ai_service.go`
- Processes form responses into professional medical documents

### Gotenberg Service
- External service for HTML to PDF conversion
- URL: `https://gotenberg-ubaop6yg4q-uc.a.run.app`
- Service: `backend-go/internal/services/gotenberg_service.go`
- Secured with IAM (only accessible by backend service account)
- Deployed as separate Cloud Run service

## API Endpoints (Go Backend)

### Authentication
- `POST /api/auth/session-login` - Firebase token validation

### Forms
- `GET /api/forms/` - List forms
- `POST /api/forms/` - Create form
- `GET /api/forms/:id` - Get form
- `PUT/PATCH /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/share-links` - Create share link

### Responses
- `GET /api/responses/` - List responses (note: maps to form_responses collection)
- `POST /api/responses/` - Create response
- `GET /api/responses/:id` - Get response
- `POST /api/responses/:responseId/generate-pdf` - Generate PDF

### Public
- `GET /forms/:id/fill/:share_token` - Get public form
- `POST /responses/public` - Submit public response

### Health
- `GET /health` - Service health check

## Testing Strategy

### Frontend Testing
```bash
# Run specific test file
npm test -- src/components/Auth/Login.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Debug tests
npm test -- --no-coverage --verbose
```

### Backend Testing
```bash
# Run all tests
go test ./...

# Run specific package tests
go test ./internal/api

# Run with verbose output
go test -v ./...

# Run with race detection
go test -race ./...

# Test PDF generation
./test_pdf_generation.sh
```

## Deployment Process

### Backend Deployment
1. Ensure `GCP_PROJECT_ID` and `GOTENBERG_URL` env vars are set
2. Build with Dockerfile (uses distroless for security)
3. Deploy to Cloud Run with proper service account
4. Verify health endpoint: `/health`
5. Check logs for any startup issues

### Frontend Deployment
1. Update `.env.local` with production URLs
2. Run `npm run build`
3. Deploy with `firebase deploy --only hosting`
4. Verify at `healthcare-forms-v2.web.app`

## Monitoring & Debugging

### Cloud Run Logs
```bash
# View recent logs
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 100

# Filter for errors
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 100 | grep -i error

# Stream logs in real-time
gcloud run services logs tail healthcare-forms-backend-go \
  --region us-central1
```

### Common Debug Points
- Redux DevTools for state inspection
- Network tab for API calls (check for 404s on PDF generation)
- Console for encryption/decryption issues
- Firestore console for data verification
- Check service account permissions for Cloud Run services

## Migration Notes

The codebase is transitioning from FastAPI (Python) to Go:
- API structure remains similar for compatibility
- Frontend unchanged except API base URL
- Database schema unchanged
- Authentication flow unchanged
- PDF generation now uses Gotenberg instead of WeasyPrint

When working on backend features, use the Go implementation (`backend-go/`) as the source of truth.

## Key Data Processing Services

### Form Processor (`form_processor.go`)
- Processes SurveyJS conditional logic
- Extracts visible questions based on response data
- Flattens nested form structures for PDF generation

### PDF Generation Pipeline
1. Fetch form response from Firestore
2. Process through `ProcessAndFlattenForm`
3. Generate HTML via Vertex AI
4. Convert to PDF via Gotenberg
5. Return PDF to client

## Environment Variables

### Backend (Go)
- `GCP_PROJECT_ID`: `healthcare-forms-v2`
- `GOTENBERG_URL`: `https://gotenberg-ubaop6yg4q-uc.a.run.app`
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON

### Frontend
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_SURVEYJS_LICENSE_KEY`: SurveyJS license
- Firebase configuration variables (multiple REACT_APP_FIREBASE_* vars)