# Gotenberg Private Service Connect Implementation Guide

## Overview
Implementation of HIPAA-compliant Private Service Connect (PSC) architecture for Gotenberg PDF generation service in GCP healthcare-forms-v2 project.

## Current State
- **Backend Service**: healthcare-forms-backend-go (Cloud Run)
- **PDF Service**: gotenberg (Cloud Run) 
- **Issue**: 403 Forbidden errors due to authentication failures
- **Domain**: form.easydocforms.com (Cloudflare proxied)

## Target Architecture
Private Service Connect enabling secure, private communication between services within VPC, eliminating public internet exposure for PHI data processing.

---

## Phase 1: Immediate Fixes (Day 1)

### 1.1 Fix Frontend Routing Issue
**Problem**: Double `/api/api` prefix in PDF generation requests

```bash
# Check current frontend configuration
cd frontend
grep -r "generate-pdf" src/

# Update the API call in frontend
# File: frontend/src/components/Responses/PdfExportButton.tsx
# Change from: /api/api/responses/${responseId}/generate-pdf
# To: /api/responses/${responseId}/generate-pdf
```

### 1.2 Grant Logging Permissions to Backend Service Account
```bash
# Grant logging.logWriter role
gcloud projects add-iam-policy-binding healthcare-forms-v2 \
  --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

# Verify permissions
gcloud projects get-iam-policy healthcare-forms-v2 \
  --flatten="bindings[].members" \
  --filter="bindings.members:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### 1.3 Fix Gotenberg Authentication in Backend
```go
// File: backend-go/internal/services/gotenberg_service.go
// Line 66 - Fix the audience URL

// OLD:
client, err := idtoken.NewClient(ctx, s.url)

// NEW:
// Use the full Cloud Run service URL as audience
audience := "https://gotenberg-ubaop6yg4q-uc.a.run.app"
client, err := idtoken.NewClient(ctx, audience)
```

### 1.4 Temporary Fix - Test Authentication
```bash
# Test if backend can authenticate to Gotenberg
gcloud run services update healthcare-forms-backend-go \
  --region us-central1 \
  --set-env-vars "GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"

# Redeploy backend with fixes
cd backend-go
./deploy.sh
```

---

## Phase 2: VPC Network Setup (Day 2-3)

### 2.1 Create Dedicated VPC Network
```bash
# Create VPC network for healthcare services
gcloud compute networks create healthcare-vpc \
  --subnet-mode=custom \
  --bgp-routing-mode=regional \
  --project=healthcare-forms-v2

# Create subnet for us-central1
gcloud compute networks subnets create healthcare-subnet \
  --network=healthcare-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24 \
  --enable-private-ip-google-access \
  --project=healthcare-forms-v2
```

### 2.2 Create VPC Connector for Backend Service
```bash
# Create VPC connector for backend
gcloud compute networks vpc-access connectors create backend-connector \
  --region=us-central1 \
  --subnet=healthcare-subnet \
  --subnet-project=healthcare-forms-v2 \
  --min-instances=2 \
  --max-instances=10 \
  --machine-type=e2-micro \
  --project=healthcare-forms-v2
```

### 2.3 Create VPC Connector for Gotenberg Service
```bash
# Create VPC connector for Gotenberg
gcloud compute networks vpc-access connectors create gotenberg-connector \
  --region=us-central1 \
  --subnet=healthcare-subnet \
  --subnet-project=healthcare-forms-v2 \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro \
  --project=healthcare-forms-v2
```

### 2.4 Configure Firewall Rules
```bash
# Allow internal communication between services
gcloud compute firewall-rules create allow-internal-healthcare \
  --network=healthcare-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/24 \
  --project=healthcare-forms-v2

# Allow health checks
gcloud compute firewall-rules create allow-health-checks \
  --network=healthcare-vpc \
  --allow=tcp \
  --source-ranges=35.191.0.0/16,130.211.0.0/22 \
  --project=healthcare-forms-v2
```

---

## Phase 3: Private Service Connect Setup (Day 4-5)

### 3.1 Create PSC Subnet
```bash
# Create subnet for PSC (must be /26 or larger)
gcloud compute networks subnets create psc-subnet \
  --network=healthcare-vpc \
  --region=us-central1 \
  --range=10.0.1.0/26 \
  --purpose=PRIVATE_SERVICE_CONNECT \
  --project=healthcare-forms-v2
```

### 3.2 Reserve Internal IP for PSC Endpoint
```bash
# Reserve static internal IP for Gotenberg PSC endpoint
gcloud compute addresses create gotenberg-psc-ip \
  --region=us-central1 \
  --subnet=healthcare-subnet \
  --addresses=10.0.0.100 \
  --project=healthcare-forms-v2
```

### 3.3 Create Service Attachment for Gotenberg
```bash
# First, create a NEG for the Gotenberg Cloud Run service
gcloud compute network-endpoint-groups create gotenberg-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=gotenberg \
  --project=healthcare-forms-v2

# Create backend service
gcloud compute backend-services create gotenberg-backend \
  --load-balancing-scheme=INTERNAL \
  --protocol=HTTPS \
  --region=us-central1 \
  --project=healthcare-forms-v2

# Add NEG to backend service
gcloud compute backend-services add-backend gotenberg-backend \
  --region=us-central1 \
  --network-endpoint-group=gotenberg-neg \
  --network-endpoint-group-region=us-central1 \
  --project=healthcare-forms-v2

# Create internal load balancer
gcloud compute forwarding-rules create gotenberg-ilb \
  --region=us-central1 \
  --load-balancing-scheme=INTERNAL \
  --network=healthcare-vpc \
  --subnet=healthcare-subnet \
  --ip-protocol=TCP \
  --ports=443 \
  --backend-service=gotenberg-backend \
  --project=healthcare-forms-v2

# Create service attachment
gcloud compute service-attachments create gotenberg-attachment \
  --region=us-central1 \
  --producer-forwarding-rule=gotenberg-ilb \
  --connection-preference=ACCEPT_AUTOMATIC \
  --nat-subnets=psc-subnet \
  --project=healthcare-forms-v2
```

### 3.4 Create PSC Endpoint for Backend Access
```bash
# Create PSC endpoint
gcloud compute forwarding-rules create gotenberg-psc-endpoint \
  --region=us-central1 \
  --network=healthcare-vpc \
  --address=gotenberg-psc-ip \
  --target-service-attachment=projects/healthcare-forms-v2/regions/us-central1/serviceAttachments/gotenberg-attachment \
  --project=healthcare-forms-v2

# Get the PSC endpoint address
gcloud compute addresses describe gotenberg-psc-ip \
  --region=us-central1 \
  --format="value(address)" \
  --project=healthcare-forms-v2
```

### 3.5 Update Cloud Run Services with VPC Connectors
```bash
# Update backend service with VPC connector
gcloud run services update healthcare-forms-backend-go \
  --region=us-central1 \
  --vpc-connector=backend-connector \
  --vpc-egress=private-ranges-only \
  --project=healthcare-forms-v2

# Update Gotenberg service with VPC connector
gcloud run services update gotenberg \
  --region=us-central1 \
  --vpc-connector=gotenberg-connector \
  --vpc-egress=all-traffic \
  --project=healthcare-forms-v2
```

### 3.6 Update Backend Environment Variables
```bash
# Update backend to use PSC endpoint (assuming 10.0.0.100)
gcloud run services update healthcare-forms-backend-go \
  --region=us-central1 \
  --set-env-vars "GOTENBERG_URL=http://10.0.0.100:3000" \
  --project=healthcare-forms-v2
```

### 3.7 Update Backend Code for Internal Communication
```go
// File: backend-go/internal/services/gotenberg_service.go
// Update to handle internal endpoint without authentication

func (s *GotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
    conversionURL := s.url + "/forms/chromium/convert/html"
    
    // ... multipart form creation ...
    
    // Use simple HTTP client for internal communication
    client := &http.Client{
        Timeout: 30 * time.Second,
    }
    
    // No authentication needed for internal PSC endpoint
    resp, err := client.Do(req)
    // ... rest of the function
}
```

---

## Phase 4: Security Hardening (Day 6-7)

### 4.1 Create VPC Service Controls Perimeter
```bash
# Create VPC-SC perimeter
gcloud access-context-manager perimeters create healthcare-perimeter \
  --title="Healthcare Forms Perimeter" \
  --resources=projects/673381373352 \
  --restricted-services=storage.googleapis.com,firestore.googleapis.com \
  --project=healthcare-forms-v2
```

### 4.2 Enable Cloud Audit Logs
```bash
# Enable audit logs for all services
gcloud projects add-iam-policy-binding healthcare-forms-v2 \
  --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/logging.admin"

# Configure audit log policy
cat > audit-config.yaml << EOF
auditConfigs:
- service: run.googleapis.com
  auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
- service: firestore.googleapis.com
  auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
EOF

gcloud projects set-iam-policy healthcare-forms-v2 audit-config.yaml
```

### 4.3 Configure Cloud KMS for CMEK
```bash
# Create KMS keyring
gcloud kms keyrings create healthcare-keyring \
  --location=us-central1 \
  --project=healthcare-forms-v2

# Create encryption key
gcloud kms keys create healthcare-key \
  --location=us-central1 \
  --keyring=healthcare-keyring \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=2025-09-01T00:00:00Z \
  --project=healthcare-forms-v2

# Grant service account access to key
gcloud kms keys add-iam-policy-binding healthcare-key \
  --location=us-central1 \
  --keyring=healthcare-keyring \
  --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" \
  --project=healthcare-forms-v2
```

### 4.4 Enable Binary Authorization
```bash
# Create Binary Authorization policy
cat > binary-auth-policy.yaml << EOF
admissionWhitelistPatterns:
- namePattern: gcr.io/healthcare-forms-v2/*
- namePattern: us-docker.pkg.dev/healthcare-forms-v2/*
defaultAdmissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  requireAttestationsBy:
  - projects/healthcare-forms-v2/attestors/prod-attestor
EOF

gcloud container binauthz policy import binary-auth-policy.yaml \
  --project=healthcare-forms-v2
```

### 4.5 Configure Cloud Armor
```bash
# Create Cloud Armor security policy
gcloud compute security-policies create healthcare-security-policy \
  --description="Security policy for healthcare forms" \
  --project=healthcare-forms-v2

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy=healthcare-security-policy \
  --expression="origin.region_code == 'US'" \
  --action=allow \
  --project=healthcare-forms-v2

# Add DDoS protection
gcloud compute security-policies rules create 2000 \
  --security-policy=healthcare-security-policy \
  --expression="origin.asn == 15169" \
  --action=throttle \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --project=healthcare-forms-v2
```

---

## Phase 5: Testing & Validation (Day 8)

### 5.1 Test Internal Connectivity
```bash
# SSH into a VM in the VPC to test connectivity
gcloud compute instances create test-vm \
  --zone=us-central1-a \
  --subnet=healthcare-subnet \
  --project=healthcare-forms-v2

gcloud compute ssh test-vm --zone=us-central1-a

# From within VM, test Gotenberg endpoint
curl -X POST http://10.0.0.100:3000/health
```

### 5.2 Test PDF Generation
```bash
# Test PDF generation through the application
curl -X POST https://form.easydocforms.com/api/responses/[RESPONSE_ID]/generate-pdf \
  -H "Authorization: Bearer [TOKEN]" \
  -H "X-CSRF-Token: [CSRF_TOKEN]"
```

### 5.3 Verify Audit Logs
```bash
# Check audit logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=healthcare-forms-backend-go" \
  --limit=50 \
  --project=healthcare-forms-v2 \
  --format=json
```

### 5.4 Load Testing
```bash
# Run load test
ab -n 100 -c 10 -H "Authorization: Bearer [TOKEN]" \
  https://form.easydocforms.com/api/responses/[RESPONSE_ID]/generate-pdf
```

---

## Phase 6: Cleanup & Optimization (Day 9)

### 6.1 Remove Public Access from Gotenberg
```bash
# Remove public invoker access
gcloud run services remove-iam-policy-binding gotenberg \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=healthcare-forms-v2

# Keep only backend service account access
gcloud run services add-iam-policy-binding gotenberg \
  --region=us-central1 \
  --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=healthcare-forms-v2
```

### 6.2 Update Deployment Script
```bash
# Update deploy.sh to include VPC configuration
# Add to gcloud run deploy command:
--vpc-connector=backend-connector \
--vpc-egress=private-ranges-only \
```

### 6.3 Document Internal Endpoints
```yaml
# Create internal-endpoints.yaml
services:
  gotenberg:
    internal_ip: 10.0.0.100
    port: 3000
    protocol: http
    psc_endpoint: gotenberg-psc-endpoint
  redis:
    internal_ip: 10.35.139.228
    port: 6378
    protocol: tcp
    tls: enabled
```

---

## Monitoring & Alerting

### Create Monitoring Dashboard
```bash
# Create custom dashboard for PSC monitoring
gcloud monitoring dashboards create --config-from-file=- <<EOF
{
  "displayName": "Healthcare Forms PSC Dashboard",
  "dashboardFilters": [],
  "gridLayout": {
    "widgets": [
      {
        "title": "PSC Endpoint Latency",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
              }
            }
          }]
        }
      }
    ]
  }
}
EOF
```

### Set Up Alerts
```bash
# Alert for PSC endpoint failures
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="PSC Endpoint Failure" \
  --condition-display-name="High Error Rate" \
  --condition="resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\"" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

---

## Rollback Plan

If issues occur, rollback to public endpoint:

```bash
# Revert backend to public Gotenberg URL
gcloud run services update healthcare-forms-backend-go \
  --region=us-central1 \
  --set-env-vars "GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app" \
  --remove-vpc-connector \
  --project=healthcare-forms-v2

# Re-enable public access to Gotenberg
gcloud run services add-iam-policy-binding gotenberg \
  --region=us-central1 \
  --member="serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=healthcare-forms-v2
```

---

## Success Criteria

- [ ] No 403 errors on PDF generation
- [ ] All traffic between services stays within VPC
- [ ] Audit logs capture all PDF generation requests
- [ ] Response time < 3 seconds for PDF generation
- [ ] Zero PHI data exposure to public internet
- [ ] Successful HIPAA compliance audit

---

## Notes & Considerations

1. **Cost Optimization**: Monitor VPC connector usage and optimize instance counts
2. **Regional Expansion**: PSC setup needs replication for multi-region
3. **Backup Strategy**: Keep public endpoint configuration documented
4. **Compliance**: Schedule quarterly security reviews
5. **Performance**: Consider caching frequently generated PDFs

---

## Contact & Escalation

- **Project Owner**: DTMain@gmail.com
- **GCP Support**: Case #[TBD]
- **Security Team**: security@easydocforms.com
- **On-Call**: [TBD]