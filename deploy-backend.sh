#!/bin/bash

# Backend Deployment Script for Healthcare Forms
# Automates Docker build and push to Google Container Registry
# Usage: ./deploy-backend.sh [--local]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="healthcare-forms-v2"
SERVICE_NAME="healthcare-forms-backend-go"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend-go/Dockerfile" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "========================================="
echo "Healthcare Forms Backend Deployment"
echo "========================================="
echo ""

# Step 1: Set the active project
print_status "Setting active GCP project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Step 2: Enable required APIs (if not already enabled)
print_status "Ensuring required GCP APIs are enabled..."
gcloud services enable cloudbuild.googleapis.com containerregistry.googleapis.com run.googleapis.com

# Step 3: Build the Docker image
print_status "Building Docker image..."
cd backend-go

# Generate timestamp for tagging
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TAGGED_IMAGE="${IMAGE_NAME}:${TIMESTAMP}"

# Build with Cloud Build (recommended) or local Docker
# Using multi-stage build: golang:1.24-alpine for build, gcr.io/distroless/static-debian12:nonroot for runtime
if [ "$1" == "--local" ]; then
    print_warning "Building locally with Docker (multi-stage: alpine builder -> distroless runtime)..."
    docker build -t ${TAGGED_IMAGE} -t ${IMAGE_NAME}:latest .
    
    # Step 4: Push to Google Container Registry
    print_status "Pushing distroless image to Google Container Registry..."
    docker push ${TAGGED_IMAGE}
    docker push ${IMAGE_NAME}:latest
else
    print_status "Building with Cloud Build (multi-stage: alpine builder -> distroless runtime)..."
    gcloud builds submit --tag ${TAGGED_IMAGE} .
    
    # Also tag as latest
    print_status "Tagging distroless image as latest..."
    gcloud container images add-tag ${TAGGED_IMAGE} ${IMAGE_NAME}:latest --quiet
fi

# Step 5: Deploy to Cloud Run
print_status "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${TAGGED_IMAGE} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --service-account go-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app,CORS_ALLOWED_ORIGINS=http://localhost:3000;https://healthcare-forms-v2.web.app;https://healthcare-forms-v2.firebaseapp.com;https://form.easydocforms.com" \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --max-instances 10

# Step 6: Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

cd ..

echo ""
echo "========================================="
print_status "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Service URL: ${SERVICE_URL}"
echo "Image: ${TAGGED_IMAGE}"
echo ""
echo "Next steps:"
echo "1. Test the health endpoint: curl ${SERVICE_URL}/health"
echo "2. Update frontend .env.local with the new URL if needed"
echo "3. Check logs: gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo ""

# Optional: Test the health endpoint
read -p "Would you like to test the health endpoint now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing health endpoint..."
    curl -s ${SERVICE_URL}/health | python3 -m json.tool || print_error "Health check failed"
fi