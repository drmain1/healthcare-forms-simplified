#!/bin/bash

# =========================================
# SINGLE SOURCE OF TRUTH DEPLOYMENT SCRIPT
# =========================================
# Usage: ./deploy.sh
# 
# This script handles the complete deployment process:
# 1. Builds the frontend with production settings
# 2. Copies frontend to backend web directory
# 3. Builds and deploys backend to Cloud Run
# =========================================

set -e  # Exit on error

# Configuration
PROJECT_ID="healthcare-forms-v2"
SERVICE_NAME="healthcare-forms-backend-go"
IMAGE_NAME="healthcare-forms-backend-go"
REGION="us-central1"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
GCR_IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Production Deployment - form.easydocforms.com${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Step 1: Build Frontend
echo -e "${YELLOW}[1/5] Building frontend...${NC}"
cd frontend

# Ensure correct production environment
# For form.easydocforms.com, we use empty API_URL since the proxy adds /api
if ! grep -q "REACT_APP_API_URL=$" .env; then
    echo -e "${YELLOW}Info: Setting REACT_APP_API_URL to empty (proxy handles /api prefix)${NC}"
    sed -i '' 's|REACT_APP_API_URL=.*|REACT_APP_API_URL=|' .env
fi

npm run build
echo -e "${GREEN}✓ Frontend build complete${NC}"

# Step 2: Copy Frontend to Backend
echo -e "${YELLOW}[2/5] Copying frontend to backend...${NC}"
cd ..
cp -r frontend/build/* backend-go/web/build/
echo -e "${GREEN}✓ Frontend copied to backend/web/build${NC}"

# Step 3: Build Docker Image
echo -e "${YELLOW}[3/5] Building Docker image...${NC}"
cd backend-go
docker build --platform linux/amd64 -t ${GCR_IMAGE} .
echo -e "${GREEN}✓ Docker image built: ${GCR_IMAGE}${NC}"

# Step 4: Push to Google Container Registry
echo -e "${YELLOW}[4/5] Pushing to GCR...${NC}"
gcloud auth configure-docker --quiet
docker push ${GCR_IMAGE}
echo -e "${GREEN}✓ Image pushed to GCR${NC}"

# Step 5: Deploy to Cloud Run
echo -e "${YELLOW}[5/5] Deploying to Cloud Run...${NC}"
# Note: Using PSC internal endpoints for HIPAA compliance
# - GOTENBERG_URL: Internal load balancer (10.0.0.100)  
# - REDIS_ADDR: VPC-native Redis instance (10.37.219.28:6378)
gcloud run deploy ${SERVICE_NAME} \
  --image ${GCR_IMAGE} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars="GOTENBERG_URL=https://10.128.0.4" \
  --set-env-vars="CORS_ALLOWED_ORIGINS=http://localhost:3000;https://healthcare-forms-v2.web.app;https://healthcare-forms-v2.firebaseapp.com;https://form.easydocforms.com" \
  --set-env-vars="REDIS_ADDR=10.37.219.28:6378" \
  --set-env-vars="REDIS_TLS_ENABLED=true" \
  --set-secrets="REDIS_PASSWORD=redis-password:latest" \
  --vpc-connector="backend-connector-new" \
  --vpc-egress="private-ranges-only" \
  --timeout 300 \
  --quiet

echo -e "${GREEN}✓ Deployed to Cloud Run${NC}"

# Get deployment info
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
REVISION=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.latestReadyRevisionName)')

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}[✓] Deployment completed successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "Service URL: ${BLUE}${SERVICE_URL}${NC}"
echo -e "Image: ${BLUE}${GCR_IMAGE}${NC}"
echo -e "Revision: ${BLUE}${REVISION}${NC}"
echo ""

# Test deployment
echo -e "${YELLOW}Testing deployment...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://form.easydocforms.com/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}⚠ Health check failed (HTTP ${HEALTH_STATUS})${NC}"
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Test the application at: https://form.easydocforms.com"
echo "2. Check logs: gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo ""