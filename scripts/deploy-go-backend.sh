#!/bin/bash

# Deploy Go Backend with Public Form Fixes to Google Cloud Run
# This script builds and deploys the Go backend with the authentication fixes
# Using Alpine multi-stage build for minimal image size

set -e

# Configuration
PROJECT_ID="healthcare-forms-v2"
IMAGE_NAME="forms-api-go"
REGION="us-central1"
SERVICE_NAME="healthcare-forms-backend-go"
GCR_IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Go backend deployment with Alpine multi-stage build...${NC}"

# Step 1: Build the image for AMD64 platform using Alpine multi-stage Dockerfile
echo -e "${YELLOW}Building Docker image with Alpine multi-stage build...${NC}"
docker build --platform linux/amd64 \
  -f backend-go/Dockerfile.alpine \
  -t ${GCR_IMAGE} \
  backend-go

# Step 2: Configure Docker for GCR (if not already done)
echo -e "${YELLOW}Configuring Docker authentication for GCR...${NC}"
gcloud auth configure-docker --quiet

# Step 3: Push to GCR
echo -e "${YELLOW}Pushing image to GCR...${NC}"
docker push ${GCR_IMAGE}

# Step 4: Deploy to Cloud Run with proper environment variables
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
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
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},CORS_ALLOWED_ORIGINS=https://healthcare-forms-v2.web.app,http://localhost:3000,COOKIE_DOMAIN=healthcare-forms-v2.web.app" \
  --timeout 300 \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Go backend deployment complete!${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Testing endpoints:${NC}"

# Test health endpoint
echo -e "${YELLOW}1. Testing health endpoint...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL}/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}   ✓ Health check passed${NC}"
else
    echo -e "${RED}   ✗ Health check failed (HTTP ${HEALTH_STATUS})${NC}"
fi

# Test public form response endpoint accessibility
echo -e "${YELLOW}2. Testing public endpoint accessibility...${NC}"
PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${SERVICE_URL}/responses/public \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{}')

if [ "$PUBLIC_STATUS" = "400" ]; then
    echo -e "${GREEN}   ✓ Public endpoint accessible (returns 400 for empty data - expected)${NC}"
elif [ "$PUBLIC_STATUS" = "401" ]; then
    echo -e "${RED}   ✗ Public endpoint still requires authentication (401) - BUG NOT FIXED${NC}"
else
    echo -e "${YELLOW}   ! Public endpoint returned HTTP ${PUBLIC_STATUS}${NC}"
fi

echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo -e "  • Go backend URL: ${SERVICE_URL}"
echo -e "  • Public form endpoint: ${SERVICE_URL}/responses/public"
echo -e "  • Share link format: /forms/{formId}/fill/{shareToken}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Restart your frontend development server to apply the share link fixes"
echo -e "  2. Update frontend .env if needed with: REACT_APP_BASE_URL=${SERVICE_URL}"
echo -e "  3. Test creating and using share links end-to-end"