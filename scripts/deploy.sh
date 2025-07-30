#!/bin/bash

# Healthcare Forms Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_ID="healthcare-forms-v2"
REGION="us-central1"
BACKEND_SERVICE="healthcare-forms-backend"
FRONTEND_BUCKET="healthcare-forms-frontend-${ENVIRONMENT}"

echo "🚀 Deploying to ${ENVIRONMENT} environment..."

# Build Docker images
echo "📦 Building Docker images..."
docker build -t gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:${ENVIRONMENT} ./backend-fastapi
docker build -t ${FRONTEND_BUCKET} ./frontend

# Push backend to Google Container Registry
echo "☁️ Pushing backend to GCR..."
docker push gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:${ENVIRONMENT}

# Deploy backend to Cloud Run
echo "🏃 Deploying backend to Cloud Run..."
gcloud run deploy ${BACKEND_SERVICE}-${ENVIRONMENT} \
  --image gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:${ENVIRONMENT} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=${ENVIRONMENT}"

# Build and deploy frontend
echo "🎨 Building frontend..."
cd frontend
npm run build

# Deploy to Firebase Hosting
echo "🔥 Deploying frontend to Firebase..."
if [ "$ENVIRONMENT" = "production" ]; then
  firebase deploy --only hosting
else
  firebase deploy --only hosting:staging
fi

echo "✅ Deployment complete!"
echo "Backend URL: https://${BACKEND_SERVICE}-${ENVIRONMENT}-${REGION}.a.run.app"
echo "Frontend URL: https://${PROJECT_ID}.web.app"