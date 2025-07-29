# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. use DRY principles and clean code. 

## Development Commands

### Frontend (React + TypeScript)
```bash
cd frontend
npm install --legacy-peer-deps  # Install dependencies with legacy peer deps for SurveyJS compatibility
npm start                       # Start development server (http://localhost:3000)
npm run build                   # Build for production
npm test                        # Run test suite
```

### Backend (Django + DRF)
```bash
cd backend
source venv/bin/activate       # Activate virtual environment
python manage.py runserver     # Start development server (http://localhost:8000)
python manage.py migrate       # Apply database migrations
python manage.py test          # Run Django tests
python create_sample_data.py   # Create sample organizations, users, forms, and patients
```

### Quick Start Scripts
```bash
./start-backend.sh              # Complete backend setup with sample data
```

## Architecture Overview

### Multi-Tenant Healthcare SaaS Platform
This is a HIPAA-compliant healthcare form builder with multi-tenant architecture:

**Backend (Django):**
- `apps/organizations/` - Multi-tenant organization management with subdomain isolation
- `apps/forms/` - SurveyJS form builder backend with FHIR mapping support
- `apps/patients/` - Patient management with FHIR-compatible name fields
- `apps/responses/` - Form response handling with audit trails
- `apps/distributions/` - Form distribution via email, SMS, QR codes
- `apps/audit/` - HIPAA audit logging middleware for all database changes
- `apps/authentication/` - JWT-based authentication system

**Frontend (React + SurveyJS):** ✅ **UI MODERNIZED**
- `components/FormBuilder/` - SurveyJS Creator integration with healthcare-specific components
- `components/Dashboard/` - Multi-tenant dashboard with form management
- `components/Responses/` - Response viewing and analytics
- `store/` - Redux Toolkit state management with RTK Query
- `services/` - AI services integration (Anthropic, Gemini, Mistral, Vertex AI)
- `styles/` - Comprehensive design system with Tailwind CSS integration 


### Key Integrations
- **SurveyJS Enterprise** - Professional form builder and renderer
- **AI Services** - Text-to-form conversion using multiple AI providers
- **Healthcare Components** - Body diagram, vital signs, insurance card processing
- **FHIR Ready** - Healthcare interoperability standards support

### Settings Configuration
Django uses modular settings:
- `config.settings.development` - Default development settings
- `config.settings.production` - Production with Gunicorn
- `config.settings.azure_dev` - Azure-specific configuration
- `config.settings.gcp_production` - **NEW** GCP-integrated production settings with enhanced security

### Database Architecture ✅ **MIGRATED TO FIRESTORE**
- **Google Cloud Firestore** - Primary NoSQL database for application data
- **SQLite** - Django internals (sessions, migrations)
- Multi-tenant isolation via Organization-scoped Firestore collections
- Comprehensive audit logging for HIPAA compliance
- Form templates with healthcare-specific question types
- Real-time data synchronization capabilities
- Auto-scaling NoSQL backend 

### AI Services Architecture
The platform integrates multiple AI providers for form generation:

- Google Gemini via `geminiService.ts`
`
- Google Vertex AI via `vertexAIService.ts`

### Authentication & Security ✅ **GCP ENHANCED**
- JWT-based authentication with refresh tokens
- Multi-tenant security with organization isolation
- HIPAA-compliant audit trails with **Cloud Logging integration**
- CORS configuration for frontend-backend communication
- **NEW: Cloud KMS encryption** for PHI data
- **NEW: Secret Manager** for secure credential storage
- **NEW: Enhanced session security** (15-min timeout, httpOnly cookies)
- **NEW: Cloud SQL** for authentication database with SSL

## Development Notes

### SurveyJS License
The project uses SurveyJS Enterprise features. Set license key:
```bash
REACT_APP_SURVEYJS_LICENSE_KEY=your-license-key
```

### Database Setup ✅ **NOW USING FIRESTORE**
- **Development**: SQLite for Django + **Google Cloud Firestore** for app data
- **GCP Project**: `healthcare-forms-prod`  
- **Firestore Database**: `healthcare-forms` (Native mode, us-central1)
- **Servers Running**: Backend (http://127.0.0.1:8000) + Frontend (http://localhost:3001)
- Sample data includes demo organization with admin/admin123 credentials

### Frontend API Configuration ✅ **UPDATED**
- **Development**: Uses local backend at `http://localhost:8000`
- **Staging/Production**: Uses Cloud Run backend via `REACT_APP_API_URL`
- **Public Forms**: Uses dedicated unauthenticated endpoints at `/forms/{id}/fill/{token}`

### Deployment Scripts
- `azure/` - Complete Azure deployment configuration
- `backend/startup.sh` - Production startup with Gunicorn
- Various shell scripts for database setup and cloud deployment

### Healthcare Compliance
- All database changes are automatically audited via middleware
- Multi-tenant architecture ensures data isolation
- FHIR-compatible data structures for interoperability
- Secure handling of Protected Health Information (PHI)

## UI Modernization ✅ **COMPLETED**

### Design System Architecture
The frontend uses a comprehensive design system with Tailwind CSS integration:

- **Design Tokens**: `styles/design-tokens.ts` - Single source of truth for colors, spacing, typography
- **CSS Variables**: `styles/base/_variables.css` - Synchronized with TypeScript tokens
- **Utilities**: `styles/utilities.ts` - Reusable flex patterns, card styles, button variants

### Styling Standards
- **Consistent Approach**: Tailwind classes + design tokens (no hardcoded values)
- **No Mixed Styling**: Eliminated sx props, inline styles, and CSS-in-JS patterns
- **Component Standards**: All components use design token system for maintainability

### Modernized Components
- **Layout.tsx** - Clean Tailwind layout with token-based spacing/colors
- **FormBuilderUI.tsx** - Converted 95+ sx props to utility classes  
- **FormBuilderToolbar.tsx** - Streamlined styling with design tokens
- **PublicFormFill.tsx** - Healthcare theme with warm beige palette
- **DateOfBirthQuestion.tsx** - Converted 65+ inline styles to Tailwind
- **HeightWeightSlider.tsx** - Modern slider components with responsive design
- **BodyDiagramField.tsx** - Utility-based cursor management and pain color tokens

### Development Guidelines
When working with UI components:
1. **Always use design tokens** - Never hardcode colors, spacing, or typography
2. **Prefer Tailwind utilities** - Use `styles/utilities.ts` patterns for common layouts
3. **Follow naming conventions** - Use `tw-` prefix for all Tailwind classes
4. **Maintain consistency** - Reference existing modernized components as examples

## GCP Authentication Implementation ✅ **IN PROGRESS**

### What's Been Implemented
1. **Enhanced Production Settings** (`config/settings/gcp_production.py`)
   - Secret Manager integration for all sensitive data
   - Cloud SQL configuration with SSL and connection pooling
   - Cloud Logging for HIPAA-compliant audit trails
   - Enhanced security (12+ char passwords, 15-min sessions)

2. **PHI Encryption Service** (`apps/services/encryption_service.py`)
   - Cloud KMS integration for HIPAA-compliant encryption
   - Singleton pattern for performance
   - Field-level encryption for patient data

3. **Cloud Logging Middleware** (`apps/audit/cloud_logging_middleware.py`)
   - Structured JSON logging for BigQuery analysis
   - Security event detection and alerting
   - Both database and cloud logging for redundancy

4. **GCP Service Configuration**
   - ✅ APIs enabled: Secret Manager, KMS, Cloud SQL, Logging
   - ✅ Service account created with required permissions
   - ✅ Secrets created: django-secret-key, jwt-signing-key, db-password
   - ✅ KMS keyring and encryption key configured
   - ✅ BigQuery dataset for HIPAA audit logs

### Quick Start for GCP Production
```bash
# Set up environment
cd backend
source venv/bin/activate
export GOOGLE_APPLICATION_CREDENTIALS="./healthcare-forms-credentials.json"

# Use GCP production settings
export DJANGO_SETTINGS_MODULE=config.settings.gcp_production

# Run migrations (when Cloud SQL is configured)
python manage.py migrate

# Test GCP services
python test_gcp_services.py

# Run server
python manage.py runserver
```

### GCP Service Status
- **Secret Manager**: ✅ Configured and accessible
- **Cloud KMS**: ✅ Keyring and key created
- **Cloud Logging**: ✅ Configured with BigQuery sink
- **Cloud SQL**: ⏳ Requires database instance setup
- **Service Account**: ✅ Permissions granted for all services

### Next Steps
1. Configure Cloud SQL instance with private IP
2. Run database migrations
3. Deploy to Cloud Run or App Engine
4. Set up monitoring alerts
5. Configure Identity-Aware Proxy (Phase 2)

## CI/CD Pipeline & GCP Deployment ✅ **STAGING-ONLY ENVIRONMENT**

### GitHub Actions Automated Deployment
The project uses GitHub Actions for automated CI/CD to a single staging environment:

**Current Deployment Strategy (as of July 28, 2025):**
- `main` branch → **Staging** environment ONLY
- Service name: `healthcare-forms-backend` (not `-staging` suffix)
- Production deployment is **completely disabled**
- All development and testing happens on the staging environment

**Backend CI/CD Pipeline** (`.github/workflows/backend-ci-cd.yml`):
1. **Test Phase**: Runs on all PRs and pushes
   - Python linting (flake8, black, isort)
   - Django unit tests with coverage
   - Test results uploaded to Codecov

2. **Build Phase**: Runs on push to main only
   - Builds Docker image
   - Pushes to Google Artifact Registry
   - Image tag: `$ARTIFACT_REGISTRY/$GCP_PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME:latest`

3. **Deploy to Staging**: Automatic deployment on push to main
   - Deploys to Cloud Run service: `healthcare-forms-backend`
   - Uses `config.settings.gcp_production` settings
   - Environment variables set to `ENVIRONMENT=staging`
   - Health check validation at `/health/`
   - Auto-scaling: 1-10 instances

**Frontend CI/CD Pipeline** (`.github/workflows/frontend-firebase-deploy.yml`):
- Builds React app with staging API URL
- Deploys to Firebase Hosting on push to main
- Live preview URL: https://formbuilder-f4460--staging-867lfdxh.web.app
- API URL: https://healthcare-forms-backend-yv6dlhmhwa-uc.a.run.app

### Manual GCP Setup
For initial infrastructure setup:
```bash
# Run the GCP setup workflow manually
# Go to GitHub Actions → Setup GCP Infrastructure → Run workflow
# Select environment: staging or production
```

This creates:
- Artifact Registry for Docker images
- Cloud Storage buckets for frontend
- Cloud SQL PostgreSQL instance
- Secret Manager secrets
- Cloud Run services
- Monitoring and alerts

### Checking Deployment Status
```bash
# View recent GitHub Actions runs
gh run list --limit=5

# Check Cloud Run service status  
gcloud run services describe healthcare-forms-backend --region=us-central1

# View service logs
gcloud run services logs read healthcare-forms-backend --region=us-central1 --limit=50

# Deploy frontend to staging manually (if needed)
cd frontend && firebase hosting:channel:deploy staging --expires 30d
```

## Current Development Status ✅ **JULY 28, 2025**

### Working Features
- **✅ Staging Environment**: Both frontend and backend deploy automatically on push to main
- **✅ Public Form Links**: Work without authentication on mobile devices
- **✅ Form Builder**: Healthcare-specific form creation with AI integration
- **✅ Multi-tenant Architecture**: Organization isolation and security
- **✅ CI/CD Pipeline**: Reliable deployments to staging environment
- **✅ Code Quality**: All Python code formatted with black and isort

### Active URLs (Staging Only)
- **Frontend**: https://formbuilder-f4460--staging-867lfdxh.web.app
- **Backend API**: https://healthcare-forms-backend-yv6dlhmhwa-uc.a.run.app
- **Backend Health**: https://healthcare-forms-backend-yv6dlhmhwa-uc.a.run.app/health/
- **Build Info**: https://healthcare-forms-backend-yv6dlhmhwa-uc.a.run.app/api/v1/auth/build-info/
- **Public Form Endpoint**: `/forms/{form-id}/fill/{share-token}`

### Development Workflow
1. Make changes locally and test
2. Run formatters before committing:
   ```bash
   cd backend
   source venv/bin/activate
   isort . && black .
   ```
3. Push to main branch
4. GitHub Actions automatically deploys both frontend and backend to staging
5. Monitor deployment at: https://github.com/drmain1/forms_gonnawork/actions

### Environment Configuration
- **No separate staging/production** - Single staging environment only
- **Backend service**: `healthcare-forms-backend` (no `-staging` suffix)
- **Settings**: Uses `config.settings.gcp_production` with `ENVIRONMENT=staging`
- **Production deployment**: Disabled until production launch

### Required GitHub Secrets
Configure these in your GitHub repository settings:
- `WIF_PROVIDER`: Workload Identity Federation provider
- `WIF_SERVICE_ACCOUNT`: GitHub Actions service account
- `CLOUD_RUN_SERVICE_ACCOUNT`: Cloud Run service account

### Deployment Notes
- All pushes to `main` automatically deploy to **staging** (NOT production)
- No manual deployment needed - just git push
- Health checks at `/health/` endpoint
- Automatic rollback on failed deployments
- Staging uses 1-10 instances with auto-scaling
- **Production deployment is disabled** - will be enabled next week

### Recent Updates (July 28, 2025)
- Fixed Python formatting issues with black and isort
- Removed 16 unused test/debug scripts
- Cleaned up unused JWT middleware
- Fixed import errors in authentication views
- Simplified to single staging environment