#!/bin/bash

# Healthcare Forms GCP Setup Script
# This script sets up Google Cloud services for the Healthcare Forms application

set -e

PROJECT_ID="healthcare-forms-v2"
REGION="us-central1"
GITHUB_REPO="YOUR_GITHUB_USERNAME/YOUR_REPO_NAME" # Update this!

echo "🚀 Setting up Google Cloud Project: $PROJECT_ID"

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable iamcredentials.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com

echo "✅ APIs enabled successfully"

# Create Workload Identity Pool
echo "🔐 Setting up Workload Identity Federation..."
gcloud iam workload-identity-pools create "github-pool" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool" || echo "Pool already exists"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" || echo "Provider already exists"

# Create service account
echo "👤 Creating service account..."
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project="$PROJECT_ID" || echo "Service account already exists"

# Grant permissions
echo "🔑 Granting permissions..."
SERVICE_ACCOUNT="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Configure workload identity
echo "🔗 Configuring workload identity..."
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$GITHUB_REPO"

# Output values for GitHub Secrets
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Add these secrets to your GitHub repository:"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo "WIF_PROVIDER:"
echo "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo ""
echo "WIF_SERVICE_ACCOUNT:"
echo "$SERVICE_ACCOUNT"
echo ""

# Check if Cloud Run services exist
echo "🏃 Checking Cloud Run services..."
if gcloud run services describe healthcare-forms-backend --region=$REGION --project=$PROJECT_ID &>/dev/null; then
  echo "✅ Backend service exists"
else
  echo "ℹ️  Backend service doesn't exist. It will be created on first deployment."
fi

if gcloud run services describe healthcare-forms-frontend --region=$REGION --project=$PROJECT_ID &>/dev/null; then
  echo "✅ Frontend service exists"
else
  echo "ℹ️  Frontend service doesn't exist. It will be created on first deployment."
fi

echo ""
echo "🎉 GCP setup complete! You can now push to GitHub to trigger deployments."