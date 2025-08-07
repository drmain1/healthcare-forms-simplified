#!/bin/bash

# Professional Frontend Deployment Script for Healthcare Forms
# This script builds and deploys the React frontend to Firebase Hosting

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="healthcare-forms-v2"

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
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js first"
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

echo "========================================="
echo "Healthcare Forms Frontend Deployment"
echo "========================================="
echo ""

cd frontend

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps

# Step 2: Run tests (optional, can be skipped with --skip-tests)
if [ "$1" != "--skip-tests" ]; then
    print_status "Running tests..."
    npm test -- --watchAll=false || print_warning "Some tests failed, continuing..."
else
    print_warning "Skipping tests (--skip-tests flag used)"
fi

# Step 3: Build production bundle
print_status "Building production bundle..."
npm run build

# Step 4: Check build size
print_status "Checking bundle size..."
npm run bundle-size || true

# Step 5: Deploy to Firebase Hosting
print_status "Deploying to Firebase Hosting..."
firebase deploy --only hosting --project ${PROJECT_ID}

cd ..

echo ""
echo "========================================="
print_status "Frontend deployment completed successfully!"
echo "========================================="
echo ""
echo "Production URLs:"
echo "- https://healthcare-forms-v2.web.app"
echo "- https://healthcare-forms-v2.firebaseapp.com"
echo ""
echo "To monitor:"
echo "1. Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}/hosting"
echo "2. Check bundle size report in frontend/build/bundle-stats.html"
echo ""