# Google Cloud Run Setup Guide

This guide will help you set up Google Cloud Run and GitHub Actions for continuous deployment.

## Prerequisites

- Google Cloud Project: `healthcare-forms-v2`
- GitHub repository
- `gcloud` CLI installed locally

## Step 1: Enable Required APIs

Run these commands to enable the necessary Google Cloud APIs:

```bash
# Set your project
gcloud config set project healthcare-forms-v2

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

## Step 2: Set Up Workload Identity Federation

This allows GitHub Actions to authenticate with Google Cloud without storing service account keys.

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="healthcare-forms-v2" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create a Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="healthcare-forms-v2" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

## Step 3: Create Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project="healthcare-forms-v2"

# Grant necessary permissions
gcloud projects add-iam-policy-binding healthcare-forms-v2 \
  --member="serviceAccount:github-actions@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding healthcare-forms-v2 \
  --member="serviceAccount:github-actions@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding healthcare-forms-v2 \
  --member="serviceAccount:github-actions@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub to impersonate the service account
# Replace YOUR_GITHUB_USERNAME/YOUR_REPO_NAME with your actual values
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@healthcare-forms-v2.iam.gserviceaccount.com \
  --project="healthcare-forms-v2" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

## Step 4: Get Project Number and Provider Name

```bash
# Get your project number
gcloud projects describe healthcare-forms-v2 --format="value(projectNumber)"

# Get the full provider name (save this for GitHub secrets)
echo "projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

## Step 5: Configure GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:

- `WIF_PROVIDER`: The full provider name from Step 4
- `WIF_SERVICE_ACCOUNT`: `github-actions@healthcare-forms-v2.iam.gserviceaccount.com`

## Step 6: Store Application Credentials

For the backend service account file:

```bash
# Create a secret for the service account credentials
gcloud secrets create healthcare-forms-credentials \
  --data-file=backend-fastapi/healthcare-forms-v2-credentials.json \
  --project=healthcare-forms-v2

# Grant the Cloud Run service account access to the secret
gcloud secrets add-iam-policy-binding healthcare-forms-credentials \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=healthcare-forms-v2
```

## Step 7: Update Backend to Use Secret Manager

Update your backend Dockerfile to fetch credentials from Secret Manager:

```dockerfile
# Add to your Dockerfile
RUN apt-get update && apt-get install -y wget
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
RUN chmod +x cloud_sql_proxy
```

## Step 8: Manual Deployment (First Time)

For the first deployment, you might need to do it manually:

```bash
# Build and push backend
cd backend-fastapi
docker build -t gcr.io/healthcare-forms-v2/healthcare-forms-backend .
docker push gcr.io/healthcare-forms-v2/healthcare-forms-backend

# Deploy backend
gcloud run deploy healthcare-forms-backend \
  --image gcr.io/healthcare-forms-v2/healthcare-forms-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and push frontend
cd ../frontend
docker build -t gcr.io/healthcare-forms-v2/healthcare-forms-frontend .
docker push gcr.io/healthcare-forms-v2/healthcare-forms-frontend

# Deploy frontend
gcloud run deploy healthcare-forms-frontend \
  --image gcr.io/healthcare-forms-v2/healthcare-forms-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

## Step 9: Test the Deployment

After deployment:

1. Get the service URLs:
   ```bash
   gcloud run services list --platform managed --region us-central1
   ```

2. Test the backend health endpoint:
   ```bash
   curl https://YOUR_BACKEND_URL/health
   ```

3. Visit the frontend URL in your browser

## Troubleshooting

### If you get permission errors:
- Ensure all APIs are enabled
- Check that the service account has the correct roles
- Verify the Workload Identity Federation setup

### If builds fail:
- Check that Docker images build locally first
- Ensure all required files are not in .dockerignore
- Check Cloud Build logs in the GCP Console

### If deployments fail:
- Check Cloud Run logs in the GCP Console
- Ensure environment variables are correctly set
- Verify that the service account credentials are accessible