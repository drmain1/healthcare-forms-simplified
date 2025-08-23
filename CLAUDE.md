# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Go)
```bash
cd backend-go

# Run development server (use unset to avoid credential file issues)
unset GOOGLE_APPLICATION_CREDENTIALS && GCP_PROJECT_ID='healthcare-forms-v2' GOTENBERG_URL='http://localhost:3005' go run cmd/server/main.go

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
go test ./internal/services   # test services including PDF generation

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

### Current Backend System
The platform uses a Go backend (`backend-go/`) as the primary system:
- **Production Domain**: `https://form.easydocforms.com` (Cloudflare proxied)
- **Cloud Run**: `healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app`
- Uses Gin framework with CORS middleware
- Vertex AI integration for PDF generation
- Gotenberg service for HTML to PDF conversion
- Service Account: `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`

Note: FastAPI backend (`backend-fastapi/`) exists but is LEGACY and not actively maintained.

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

## Critical Architecture: Metadata-Based Pattern Detection

### Overview
The PDF generation system uses metadata tags for 100% reliable pattern detection instead of fragile heuristic matching.

### How It Works
1. **Frontend**: Custom SurveyJS components include `metadata: { patternType: 'pattern_name' }` in their JSON
2. **Backend**: Pattern detectors in `pattern_detector.go` check ONLY for metadata tags
3. **Renderers**: Each pattern type has a dedicated renderer in `backend-go/internal/services/`

### Required Import Order (CRITICAL)
In components using custom questions (`FormBuilderContainer.tsx`, `PublicFormFill.tsx`, `ResponseDetail.tsx`):
```typescript
// FIRST - Initialize metadata support
import { initializeSurveyMetadata } from '../../utils/initializeSurveyMetadata';
initializeSurveyMetadata();

// SECOND - Import custom questions (they will inherit metadata property)
import './BodyPainDiagramQuestion';
import './PatientDemographicsQuestion';
// ... other custom questions
```

### Supported Pattern Types
- `body_pain_diagram` - Body pain diagram with clickable areas
- `sensation_areas_diagram` / `body_diagram_2` - Sensation areas diagram
- `patient_demographics` - Patient demographic fields
- `patient_vitals` - Height/weight sliders
- `insurance_card` - Insurance card capture
- `review_of_systems` - Medical review of systems checklist
- `additional_demographics` - Extended demographics
- `terms_and_conditions` - Terms acceptance panel
- `terms_checkbox` - Simple terms checkbox

### Adding New Patterns
1. Add `metadata: { patternType: 'your_pattern' }` to the component's JSON
2. Update pattern detector in `pattern_detector.go` to check for metadata
3. Create/update renderer in `backend-go/internal/services/`
4. Register renderer in `renderer_registry.go`

## Key Configuration

### Environment Variables
**Backend (Go)**
- `GCP_PROJECT_ID`: `healthcare-forms-v2`
- `GOTENBERG_URL`: `https://gotenberg-ubaop6yg4q-uc.a.run.app` (production) or `http://localhost:3005` (local)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON (or use gcloud auth for local dev)

**Frontend**
- `REACT_APP_API_URL`: Backend API URL (`https://form.easydocforms.com/api` for production)
- `REACT_APP_SURVEYJS_LICENSE_KEY`: SurveyJS license
- Firebase configuration variables (multiple REACT_APP_FIREBASE_* vars)

### Authentication Flow
1. User signs in with Google via Firebase Auth
2. Frontend receives Firebase ID token
3. Token sent to backend in Authorization header
4. Backend validates with Firebase Admin SDK
5. Organization context determined from user profile

## PDF Generation Pipeline

### Data Flow
1. Form response submitted → stored in `form_responses` collection
2. PDF generation triggered via `/api/responses/:responseId/generate-pdf`
3. `pattern_detector.go` identifies patterns using metadata tags
4. Each pattern processed by its specific renderer
5. HTML assembled and sent to Gotenberg service
6. PDF returned to client

### Debugging PDF Generation
```bash
# Check pattern detection
grep "DEBUG: Detected patterns" logs

# Verify metadata in form JSON
grep "metadata: map\[patternType:" logs

# Check for empty ElementNames (common issue)
grep "fields=\[\]" logs  # Should have field names, not empty

# Monitor Gotenberg service
curl http://localhost:3005/health  # Local Gotenberg health check
```

## Common Issues & Solutions

### PDF Shows Blank Sections
- Check `ElementNames` is populated in pattern matcher (not empty `[]`)
- Verify metadata tag matches exactly between frontend and backend
- Ensure renderer is registered in `renderer_registry.go`

### Metadata Not Appearing in JSON
- Verify `initializeSurveyMetadata()` is called BEFORE custom question imports
- Clear browser cache and rebuild form
- Check browser console for `[SurveyJS] Metadata support initialized successfully`

### Local Development Authentication
```bash
# Use Application Default Credentials instead of service account file
unset GOOGLE_APPLICATION_CREDENTIALS
gcloud auth application-default login
```

### SurveyJS Dependencies
- Always use `npm install --legacy-peer-deps` due to SurveyJS peer dependency requirements
- License key required in environment variables

## API Endpoints (Go Backend)

### Core Endpoints
- `POST /api/auth/session-login` - Firebase token validation
- `GET/POST /api/forms/` - Form CRUD operations
- `GET/POST /api/responses/` - Response operations (maps to form_responses collection)
- `POST /api/responses/:responseId/generate-pdf` - Generate PDF
- `GET /forms/:id/fill/:share_token` - Public form access
- `GET /health` - Service health check

## Deployment Process

### Backend Deployment
1. Ensure proper environment variables are set
2. Build with Dockerfile (uses distroless for security)
3. Deploy to Cloud Run: `gcloud run deploy healthcare-forms-backend-go`
4. Verify health endpoint: `/health`

### Frontend Deployment
1. Update `.env.local` with production URLs (`REACT_APP_API_URL=https://form.easydocforms.com/api`)
2. Run `npm run build`
3. **Option A (Current)**: Deploy: `firebase deploy --only hosting --project healthcare-forms-v2`
4. **Option B (Recommended)**: Deploy to custom domain `form.easydocforms.com` (Cloudflare proxied)
5. Verify at `form.easydocforms.com` or `healthcare-forms-v2.web.app`

## Monitoring & Debugging

### View Logs
```bash
# Recent logs
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 100

# Stream logs
gcloud run services logs tail healthcare-forms-backend-go \
  --region us-central1

# Filter for pattern detection
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 | grep "Pattern type="
```

### Debug Points
- Redux DevTools for state inspection
- Network tab for API calls
- Check for 404s on PDF generation endpoints
- Firestore console for data verification
- Verify service account permissions for Cloud Run services

## Security & Compliance

### HIPAA Requirements
- All PHI data encrypted client-side before storage
- Session-based encryption keys (never persisted)
- Automatic PHI cleanup on navigation
- 15-minute session timeout (`frontend/src/utils/sessionTimeout.ts`)

### Container Security
- Production uses Google Distroless images (nonroot)
- Static binary compilation with security flags
- Runs as non-root user (UID 65532)

### Custom Domain Setup (form.easydocforms.com)
- **DNS**: Cloudflare manages DNS with CNAME to Cloud Run
- **Benefits**: Same-origin requests, eliminates Firebase proxy cookie issues
- **SSL**: Cloudflare provides SSL termination and DDoS protection
- **CSRF**: Traditional cookie-based CSRF tokens work properly
- **Performance**: Cloudflare CDN and edge caching