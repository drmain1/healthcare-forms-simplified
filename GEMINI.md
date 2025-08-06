# GEMINI.md

This file provides guidance for Gemini AI agents working with this healthcare forms platform on Google Cloud Platform.

## 🏗️ Architecture Overview

### Healthcare Forms Platform - GCP Edition
A HIPAA-compliant healthcare forms platform leveraging Google Cloud services:

**Tech Stack:**
- **Backend:** FastAPI (Python) deployed on Cloud Run
- **Frontend:** React + TypeScript on Firebase Hosting  
- **Database:** Google Cloud Firestore (NoSQL)
- **Authentication:** Firebase Auth with Google Sign-In
- **AI Services:** Vertex AI (Gemini Pro), Document AI
- **Storage:** Cloud Storage for documents/PDFs
- **Monitoring:** Cloud Logging, Cloud Monitoring

## 📦 GCP Project Configuration

```yaml
Project ID: healthcare-forms-v2
Project Number: 673381373352
Region: us-central1
Services Enabled:
  - Cloud Run
  - Cloud Firestore
  - Firebase Auth
  - Vertex AI
  - Document AI
  - Cloud Storage
  - Cloud Build
  - Secret Manager
```

## 🔐 Security & Compliance

### HIPAA Compliance Requirements
- **Encryption:** All PHI data encrypted at rest and in transit
- **Authentication:** Firebase Auth with MFA support
- **Audit Logging:** Cloud Audit Logs for all data access
- **Data Isolation:** Multi-tenant architecture with organization-based isolation
- **Container Security:** Chainguard distroless images for minimal attack surface

### Service Account Configuration
```bash
# Backend service account location
backend-fastapi/healthcare-forms-v2-credentials.json

# Required IAM Roles:
- roles/datastore.user          # Firestore access
- roles/firebase.admin           # Firebase Auth
- roles/aiplatform.user         # Vertex AI
- roles/documentai.apiUser      # Document AI
- roles/storage.objectUser      # Cloud Storage
- roles/secretmanager.secretAccessor  # Secret Manager
```

## 🚀 Deployment

### Backend Deployment (Cloud Run)
```bash
# Build and deploy backend
cd backend-fastapi
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2" \
  --service-account healthcare-forms-backend@healthcare-forms-v2.iam.gserviceaccount.com

# Current production URL
https://healthcare-forms-backend-go-673381373352.us-central1.run.app
```

### Frontend Deployment (Firebase Hosting)
```bash
# Deploy frontend
cd frontend
npm run build
firebase deploy --only hosting --project healthcare-forms-v2

# Production URL
https://healthcare-forms-v2.web.app
```

## 🤖 AI Services Integration

### Vertex AI (Gemini Pro)
```python
# Service: frontend/src/services/vertexAIService.ts
# Model: gemini-1.5-pro
# Use cases:
- Form generation from text descriptions
- Medical terminology extraction
- Form field suggestions
- Data validation rules generation
```

### Document AI
```python
# Service: frontend/src/services/documentAIService.ts
# Processors:
- FORM_PARSER_PROCESSOR: Extract data from uploaded forms
- OCR_PROCESSOR: Text extraction from images/PDFs
- DOCUMENT_SPLITTER: Split multi-page documents
```

### Gemini Service Configuration
```typescript
// frontend/src/services/geminiService.ts
const GEMINI_CONFIG = {
  model: 'gemini-1.5-pro',
  temperature: 0.7,
  maxTokens: 8192,
  topP: 0.95,
  topK: 40
};

// Healthcare-specific prompts
const MEDICAL_FORM_GENERATION_PROMPT = `
Generate a medical intake form with the following requirements:
- HIPAA compliant field naming
- Include necessary medical validations
- Support for body pain diagrams
- Insurance information capture
`;
```

## 📊 Firestore Database Schema

```javascript
// Collections structure
healthcare-forms-v2/
├── organizations/
│   └── {orgId}/
│       ├── name: string
│       ├── settings: object
│       └── created_at: timestamp
├── forms/
│   └── {formId}/
│       ├── organization_id: string
│       ├── title: string
│       ├── surveyjs_json: object
│       ├── ai_generated: boolean
│       └── created_at: timestamp
├── form_responses/
│   └── {responseId}/
│       ├── form_id: string
│       ├── organization_id: string
│       ├── patient_data: map (encrypted)
│       ├── response_data: map (encrypted)
│       └── submitted_at: timestamp
└── form_templates/
    └── {templateId}/
        ├── category: string
        ├── title: string
        └── template_json: object
```

## 🔧 Common GCP Commands

### Firestore Operations
```bash
# Export Firestore data
gcloud firestore export gs://healthcare-forms-v2-backup/$(date +%Y%m%d)

# Import Firestore data  
gcloud firestore import gs://healthcare-forms-v2-backup/20240306

# Create indexes
gcloud firestore indexes create --collection-group=forms \
  --field-config field-path=organization_id,order=ASCENDING \
  --field-config field-path=created_at,order=DESCENDING
```

### Cloud Run Management
```bash
# View service details
gcloud run services describe healthcare-forms-backend-go \
  --region us-central1

# Update environment variables
gcloud run services update healthcare-forms-backend-go \
  --update-env-vars KEY=VALUE \
  --region us-central1

# View logs
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 100
```

### Secret Manager
```bash
# Create secret
echo -n "secret-value" | gcloud secrets create api-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding api-key \
  --member="serviceAccount:healthcare-forms-backend@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 📈 Monitoring & Alerting

### Key Metrics to Monitor
- **Cloud Run:** Request latency, error rate, CPU/memory utilization
- **Firestore:** Read/write operations, document count, storage size
- **Vertex AI:** API request count, model latency, token usage
- **Firebase Auth:** Authentication success/failure rates

### Alert Policies
```yaml
# High error rate alert
resource.type: "cloud_run_revision"
resource.labels.service_name: "healthcare-forms-backend-go"
metric.type: "run.googleapis.com/request_count"
metric.labels.response_code_class: "5xx"
threshold: 10 requests/minute
```

## 🛠️ Development Workflow

### Local Development with GCP Services
```bash
# Set up Application Default Credentials
gcloud auth application-default login

# Use Firestore emulator
gcloud emulators firestore start --host-port=localhost:8080

# Environment variables for local development
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export GCP_PROJECT_ID="healthcare-forms-v2"
```

### CI/CD with Cloud Build
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/healthcare-forms-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/healthcare-forms-backend']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'run'
      - 'deploy'
      - 'healthcare-forms-backend-go'
      - '--image=gcr.io/$PROJECT_ID/healthcare-forms-backend'
      - '--region=us-central1'
```

## 🔄 Data Migration & Backup

### Automated Backup Strategy
```bash
# Create Cloud Scheduler job for daily backups
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/healthcare-forms-v2/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email=healthcare-forms-backup@healthcare-forms-v2.iam.gserviceaccount.com \
  --message-body='{"outputUriPrefix":"gs://healthcare-forms-v2-backup/scheduled"}'
```

## 🎯 Performance Optimization

### Firestore Best Practices
- Use composite indexes for complex queries
- Implement pagination for large datasets
- Cache frequently accessed data in memory
- Use batch operations for bulk updates

### Cloud Run Optimization
- Set minimum instances to avoid cold starts
- Configure concurrency based on workload
- Use Cloud CDN for static assets
- Implement connection pooling for Firestore

## 📝 Important Notes

1. **PHI Data Handling:** All patient health information must be encrypted using the encryption middleware before storage
2. **API Keys:** Never commit API keys or service account files to the repository
3. **Audit Logging:** All data access must be logged for HIPAA compliance
4. **Multi-tenancy:** Always filter queries by organization_id to ensure data isolation
5. **Error Handling:** Never expose sensitive error details to end users

## 🆘 Troubleshooting

### Common Issues and Solutions

**Issue:** Cloud Run service returns 403 Forbidden
```bash
# Solution: Check IAM permissions
gcloud run services add-iam-policy-binding healthcare-forms-backend-go \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-central1
```

**Issue:** Firestore queries timeout
```bash
# Solution: Create composite index
gcloud firestore indexes create --collection-group=forms \
  --field-config field-path=organization_id,order=ASCENDING \
  --field-config field-path=status,order=ASCENDING
```

**Issue:** Vertex AI quota exceeded
```bash
# Solution: Request quota increase
gcloud compute project-info add-metadata \
  --metadata google-compute-default-region=us-central1
```

## 📚 Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Vertex AI Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [HIPAA on Google Cloud](https://cloud.google.com/security/compliance/hipaa)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

*Last updated: 2025-08-06*
*Maintained for: Gemini AI Agent Integration*