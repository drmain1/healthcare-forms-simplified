#!/bin/bash

# Build and Deploy Chainguard FastAPI to Google Cloud Run
# This script builds for AMD64, pushes to GCR, and deploys to Cloud Run

set -e

# Configuration
PROJECT_ID="healthcare-forms-v2"
IMAGE_NAME="chainguard-fastapi"
REGION="us-central1"
SERVICE_NAME="healthcare-forms-backend"
GCR_IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build and deployment to GCR and Cloud Run...${NC}"

# Step 1: Build the image for AMD64 platform
echo -e "${YELLOW}Building Docker image for AMD64 platform...${NC}"
docker build --platform linux/amd64 \
  -f backend-fastapi/Dockerfile.cloudrun \
  -t ${GCR_IMAGE} \
  .

# Step 2: Configure Docker for GCR (if not already done)
echo -e "${YELLOW}Configuring Docker authentication for GCR...${NC}"
gcloud auth configure-docker --quiet

# Step 3: Push to GCR
echo -e "${YELLOW}Pushing image to GCR...${NC}"
docker push ${GCR_IMAGE}

# Step 4: Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image ${GCR_IMAGE} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "PROJECT_ID=${PROJECT_ID},GOOGLE_APPLICATION_CREDENTIALS=" \
  --timeout 300 \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}Note: Update your frontend API URL to: ${SERVICE_URL}${NC}"

# Verify the deployment
echo -e "${YELLOW}Testing the deployment...${NC}"
curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL}/health || echo -e "${RED}Health check failed${NC}"