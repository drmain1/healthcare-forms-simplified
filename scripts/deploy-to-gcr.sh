#!/bin/bash

# Deploy Chainguard FastAPI to Google Cloud Run
# This script tags, pushes to GCR, and deploys to Cloud Run

set -e

# Configuration
PROJECT_ID="healthcare-forms-v2"
IMAGE_NAME="chainguard-fastapi"
REGION="us-central1"
SERVICE_NAME="healthcare-forms-backend"
LOCAL_IMAGE="chainguard-fastapi-test:latest"
GCR_IMAGE="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to GCR and Cloud Run...${NC}"

# Step 1: Configure Docker for GCR
echo -e "${YELLOW}Configuring Docker authentication for GCR...${NC}"
gcloud auth configure-docker

# Step 2: Tag the image for GCR
echo -e "${YELLOW}Tagging image for GCR...${NC}"
docker tag ${LOCAL_IMAGE} ${GCR_IMAGE}

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
  --set-env-vars "PROJECT_ID=${PROJECT_ID}" \

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}Note: Update your frontend API URL to: ${SERVICE_URL}${NC}"