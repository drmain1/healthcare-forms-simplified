# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
```bash
cd backend-fastapi
source venv/bin/activate       # Activate virtual environment
pip install -r requirements.txt # Install dependencies
uvicorn main:app --reload      # Start development server (http://localhost:8000)
```

### Frontend (React + TypeScript)
```bash
cd frontend
npm install --legacy-peer-deps  # Install dependencies with legacy peer deps for SurveyJS
npm start                      # Start development server (http://localhost:3000)
npm run build                  # Build for production
npm test                       # Run test suite
npm run lint                   # Run ESLint
```

### Firebase Deployment
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Architecture Overview

### Healthcare Forms Platform - Simplified Version
This is a refactored healthcare forms platform using modern FastAPI + Firestore architecture:

**Backend (FastAPI):**
- `backend-fastapi/main.py` - FastAPI application entry point with CORS and router configuration
- `backend-fastapi/routers/` - API endpoints for forms, responses, organizations, auth
- `backend-fastapi/models/` - Pydantic models for data validation
- `backend-fastapi/services/` - Firebase Auth and Firestore integration
- Uses Google Cloud Firestore as the primary NoSQL database
- Firebase Auth for authentication (replacing JWT)

**Frontend (React + SurveyJS):**
- `src/components/FormBuilder/` - SurveyJS Creator integration for form building
- `src/components/Auth/` - Firebase authentication components
- `src/store/` - Redux Toolkit state management with RTK Query
- `src/services/` - AI services (Gemini, Vertex AI, Mistral) and Firebase integration
- `src/contexts/` - Firebase Auth context provider
- Multi-tenant architecture with organization-based data isolation

### Key Integrations
- **SurveyJS** - Form builder and renderer (requires license key)
- **Firebase Auth** - Authentication provider
- **Google Cloud Firestore** - NoSQL database
- **AI Services** - Form generation via Gemini, Vertex AI, and Mistral

### Database Architecture
- **Google Cloud Firestore** collections:
  - `organizations` - Multi-tenant organizations
  - `forms` - Form definitions with SurveyJS JSON
  - `form_responses` - Submitted form responses
  - `form_templates` - Reusable form templates
- Organization-based data isolation via `organization_id` field

### Authentication Flow
1. Frontend uses Firebase Auth for Google Sign-In
2. Firebase ID token sent to backend in Authorization header
3. Backend validates token with Firebase Admin SDK
4. User's organization determined from Firestore

### API Configuration
- **Development**: Backend at `http://localhost:8000`, Frontend at `http://localhost:3000`
- **Production**: Backend deployed to Cloud Run, Frontend to Firebase Hosting
- API base path: `/api/v1/`

### Current Issues
- Forms cannot be saved - likely missing Firestore setup or permissions
- Need to verify Firestore is properly configured in new GCP project
- Check Firebase service account credentials path

### Deployment Notes
- Backend requires `healthcare-forms-v2-credentials.json` service account file
- Frontend Firebase config in `src/contexts/FirebaseAuthContext.tsx`
- Production backend URL: `https://healthcare-forms-backend-yv6dlhmhwa-uc.a.run.app`

## GCP Project Configuration
- **Project ID**: `healthcare-forms-v2` (as seen in firestore.py)
- **Firestore**: Needs to be enabled and configured
- **Firebase Auth**: Should be configured for authentication
- **Service Account**: Place credentials in `backend-fastapi/healthcare-forms-v2-credentials.json`