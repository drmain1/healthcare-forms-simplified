#!/bin/bash

# Build and Deploy Script for Healthcare Forms (Same-Origin Architecture)
# Builds frontend, copies to backend, and deploys unified service to form.easydocforms.com
# Usage: ./build-and-deploy.sh [--local]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "========================================="
echo "Healthcare Forms - Same-Origin Build & Deploy"
echo "========================================="
echo ""

# Step 1: Build Frontend
print_status "Building React frontend..."
cd frontend

# Ensure we're using the production environment
print_info "Using production environment (relative URLs)"
npm run build

print_status "Frontend build completed"
cd ..

# Step 2: Copy Frontend to Backend
print_status "Copying frontend build to backend..."

# Clean previous web files
rm -rf backend-go/web

# Create web directory and copy build
mkdir -p backend-go/web
cp -r frontend/build backend-go/web/

print_status "Frontend files copied to backend-go/web/build/"

# Step 3: Verify files
print_info "Verifying key files exist:"
if [ -f "backend-go/web/build/index.html" ]; then
    print_status "✓ index.html"
else
    print_error "✗ Missing index.html"
    exit 1
fi

if [ -d "backend-go/web/build/static" ]; then
    print_status "✓ static/ directory"
else
    print_error "✗ Missing static/ directory"
    exit 1
fi

# Step 4: Build and Deploy Backend
print_status "Starting backend build and deployment..."
cd backend-go

# Generate timestamp for tagging
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TAGGED_IMAGE="${IMAGE_NAME}:${TIMESTAMP}"

# Build with Cloud Build (recommended) or local Docker
if [ "$1" == "--local" ]; then
    print_warning "Building locally with Docker..."
    docker build -t ${TAGGED_IMAGE} -t ${IMAGE_NAME}:latest .
    
    print_status "Pushing to Google Container Registry..."
    docker push ${TAGGED_IMAGE}
    docker push ${IMAGE_NAME}:latest
else
    print_status "Building with Cloud Build..."
    gcloud builds submit --tag ${TAGGED_IMAGE} .
    
    print_status "Tagging as latest..."
    gcloud container images add-tag ${TAGGED_IMAGE} ${IMAGE_NAME}:latest --quiet
fi

# Step 5: Deploy to Cloud Run
print_status "Deploying unified service to Cloud Run..."
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
print_status "Same-Origin Deployment completed successfully!"
echo "========================================="
echo ""
echo "🌐 Frontend + Backend URL: https://form.easydocforms.com"
echo "📊 Health Check: https://form.easydocforms.com/health"
echo "🔌 API Endpoints: https://form.easydocforms.com/api/*"
echo "🎯 Service URL: ${SERVICE_URL}"
echo "📦 Image: ${TAGGED_IMAGE}"
echo ""
echo "Benefits of Same-Origin Architecture:"
print_status "✓ CSRF cookies work properly"
print_status "✓ No CORS issues"
print_status "✓ Simplified authentication"
print_status "✓ Better performance (no proxy)"
echo ""

# Step 7: Test the deployment
read -p "Would you like to test the deployment now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Testing health endpoint..."
    curl -s https://form.easydocforms.com/health | python3 -m json.tool || print_error "Health check failed"
    
    print_status "Testing frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://form.easydocforms.com/)
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_status "✓ Frontend is serving correctly"
    else
        print_error "✗ Frontend test failed (HTTP $FRONTEND_STATUS)"
    fi
    
    print_info "🔍 Check browser console for CSRF debug info:"
    print_info "   1. Open https://form.easydocforms.com in browser"
    print_info "   2. Open DevTools Console"
    print_info "   3. Type: __enableDebug() then __debugCSRF()"
    print_info "   4. Verify CSRF cookies are being set and sent"
fi

print_info "Next steps:"
echo "1. Test form creation and submission"
echo "2. Verify PDF generation works"
echo "3. Check that authentication flow is seamless"
echo "4. Monitor logs: gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"