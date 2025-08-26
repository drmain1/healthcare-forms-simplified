# Vertex AI Setup Guide

## Prerequisites
- Google Cloud CLI installed and configured
- A Google Cloud Project with billing enabled
- Vertex AI API enabled in your project

## Setup Steps

### 1. Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com
```

### 2. Set Your Project ID
```bash
# Get your current project ID
gcloud config get-value project

# Or set a specific project
gcloud config set project YOUR_PROJECT_ID
```

### 3. Authentication Options

#### Option A: Using Application Default Credentials (Recommended for Development)
```bash
# Login with your Google account
gcloud auth application-default login

# This creates credentials at:
# - MacOS/Linux: ~/.config/gcloud/application_default_credentials.json
# - Windows: %APPDATA%\gcloud\application_default_credentials.json
```

#### Option B: Using Service Account (Recommended for Production)
```bash
# Create a service account
gcloud iam service-accounts create vertex-ai-service \
    --display-name="Vertex AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:vertex-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create vertex-ai-key.json \
    --iam-account=vertex-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/vertex-ai-key.json"
```

### 4. Update Environment Variables
Update your `.env` file:
```env
REACT_APP_GCP_PROJECT_ID=your-actual-project-id
REACT_APP_GCP_LOCATION=us-central1
```

### 5. Test Vertex AI Connection
```bash
# Test with gcloud
gcloud ai models list --region=us-central1
```

## Important Security Notes

### For Frontend Applications
Direct Vertex AI calls from frontend applications expose your credentials. Consider these options:

1. **Backend Proxy (Recommended)**
   - Create a backend endpoint that handles Vertex AI calls
   - Frontend sends requests to your backend
   - Backend uses service account credentials securely

2. **Firebase Functions**
   - Use Firebase Cloud Functions as a proxy
   - Automatically handles authentication
   - Good for serverless architectures

3. **Identity Token Authentication**
   - Use Google Identity Platform
   - Generate short-lived tokens for frontend use
   - More complex but more secure

## Current Implementation Status

The current implementation uses the Google AI Studio API (with API key) which is different from Vertex AI:

- **Google AI Studio**: Uses API keys, simpler setup, good for development
- **Vertex AI**: Uses IAM authentication, enterprise features, better for production

To continue using Google AI Studio (current setup), no changes needed.
To switch to Vertex AI, follow the authentication setup above and implement a backend proxy.

## Switching Between Services

Your code currently has both services available:
- `geminiService.ts` - Uses Google AI Studio (API key)
- `vertexAIService.ts` - Uses Vertex AI (IAM auth)

You can use either based on your needs.