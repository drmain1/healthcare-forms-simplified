# Cloud Run Deployment - July 30, 2025

## Current Production Backend URL
```
https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app
```

## API Endpoints
- Base API URL: `https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1`
- Swagger Docs: `https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/docs`

## GCP Project Details
- **Project ID**: `healthcare-forms-v2`
- **Region**: `us-central1`
- **Service Name**: `healthcare-forms-backend`

## Environment Files Updated
All frontend environment files have been updated with the new Cloud Run URL:

1. `.env` - Main environment file
2. `.env.local` - Local overrides (highest priority)
3. `.env.development` - Development environment
4. `.env.production` - Production environment

## Environment Variable Configuration
```bash
REACT_APP_API_URL=https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1
REACT_APP_BASE_URL=https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app
```

## Backend Service Account
- File: `backend-fastapi/healthcare-forms-v2-credentials.json`
- Required for Firestore and Firebase Auth integration

## Frontend Firebase Configuration
```javascript
REACT_APP_FIREBASE_API_KEY=AIzaSyBpPx-vFvGWw2kpvbpUnsG1X2eaATWeSq8
REACT_APP_FIREBASE_AUTH_DOMAIN=healthcare-forms-v2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=healthcare-forms-v2
REACT_APP_FIREBASE_STORAGE_BUCKET=healthcare-forms-v2.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=673381373352
REACT_APP_FIREBASE_APP_ID=1:673381373352:web:0e53be9a8d8ea7f124f99d
```

## Deployment Commands
```bash
# View Cloud Run services
gcloud run services list --platform=managed --region=us-central1

# Deploy backend (from backend-fastapi directory)
gcloud run deploy healthcare-forms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# View service details
gcloud run services describe healthcare-forms-backend \
  --platform=managed \
  --region=us-central1
```

## Frontend Deployment
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Troubleshooting Notes
1. **CORS Issues**: Ensure backend allows frontend domain in CORS configuration
2. **Environment Variables**: React requires restart after changing .env files
3. **Priority Order**: `.env.local` > `.env.development` > `.env`
4. **Authentication**: Frontend sends Firebase ID token in Authorization header

## Testing Connection
```bash
# Test backend directly
curl https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1/

# Check CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -X OPTIONS \
  https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1/
```


⏺ Yes, that's correct! The
  backend-fastapi/Dockerfile.cloudrun is
  the Dockerfile used to build the Docker
   image for your Cloud Run deployment.

   