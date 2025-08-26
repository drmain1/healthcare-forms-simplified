# Gotenberg Load Balancer Final Working Configuration

## 🎉 SUCCESS: After 1 week of debugging, PDF generation is now working!

This document captures the exact configuration that finally made the Gotenberg service work through an internal load balancer with serverless NEGs.

## Root Causes That Were Fixed

### 1. **DNS Resolution Issues**
- **Problem**: `gotenberg-http.internal` was pointing to wrong IP (10.128.0.6) 
- **Solution**: Updated DNS to point to correct load balancer IP (10.0.0.100)

### 2. **IAM Permissions for Load Balancer**
- **Problem**: Only `go-backend-sa` had `roles/run.invoker` permissions on Gotenberg service
- **Solution**: Added `allUsers` to `roles/run.invoker` to allow load balancer traffic

### 3. **VPC Egress Blocking Firebase Auth**
- **Problem**: Backend had `vpc-access-egress=all` which blocked Google API access
- **Solution**: Changed to `vpc-access-egress=private-ranges-only`

### 4. **Missing HTTP Forwarding Rule Understanding**
- **Problem**: Confusion about which load balancer IPs were actually active
- **Solution**: Identified correct forwarding rules and their IPs

## Final Working Architecture

### Network Infrastructure
```
VPC: healthcare-vpc
├── Subnet: backend-connector-subnet (for VPC connector)
├── Proxy-only subnet: proxy-only-subnet (10.0.3.0/24)
└── DNS Zone: internal-zone
    ├── gotenberg.internal → 10.128.0.4 (HTTPS)
    └── gotenberg-http.internal → 10.0.0.100 (HTTP) ✅
```

### Load Balancer Components

#### HTTP Load Balancer (Working)
```
Forwarding Rule: gotenberg-ilb
├── IP Address: 10.0.0.100
├── Target: us-central1/targetHttpProxies/gotenberg-proxy
├── URL Map: gotenberg-url-map
└── Backend Service: gotenberg-backend
    ├── Protocol: HTTP
    ├── Port: 80 (ignored for serverless NEGs)
    ├── Timeout: 30s (not configurable for serverless NEGs)
    └── NEG: gotenberg-neg
        ├── Type: SERVERLESS
        ├── Size: 0 (normal for serverless NEGs)
        ├── Cloud Run Service: gotenberg
        └── Region: us-central1
```

#### HTTPS Load Balancer (Available)
```
Forwarding Rule: gotenberg-ilb-https
├── IP Address: 10.128.0.4
├── Target: us-central1/targetHttpsProxies/gotenberg-https-proxy
├── SSL Certificate: ilb-gotenberg-cert
└── Same backend service as HTTP
```

### Cloud Run Services Configuration

#### Backend Service (healthcare-forms-backend-go)
```yaml
Environment Variables:
  GOTENBERG_URL: "http://gotenberg-http.internal"
  GCP_PROJECT_ID: "healthcare-forms-v2"
  
Network Configuration:
  VPC Connector: backend-connector-new
  VPC Access Egress: private-ranges-only ✅ (allows Google APIs)
  
Ingress: all (receives traffic from Cloudflare)
```

#### Gotenberg Service
```yaml
Container Port: 3000
Concurrency: 80

Network Configuration:
  VPC Connector: gotenberg-connector
  VPC Access Egress: all-traffic
  
Ingress: internal-and-cloud-load-balancing ✅

IAM Policy:
  roles/run.invoker:
    - allUsers ✅ (required for load balancer)
    - serviceAccount:go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com
```

## Key Learnings & Documentation Gaps

### Serverless NEG Behavior
- **Size=0 is normal**: Serverless NEGs always show 0 endpoints - this is not an error
- **No health checks**: Load balancer cannot health check serverless backends
- **Port configuration ignored**: Backend service port settings don't apply to serverless NEGs
- **Timeout not configurable**: Backend service timeout cannot be modified for serverless NEGs

### IAM Requirements for Internal Load Balancers
- **Critical Gap**: GCP docs don't clearly state that `allUsers` needs `run.invoker` for internal load balancers
- **Load balancer identity**: Internal load balancers don't use a specific service account identity
- **403 vs timeout**: 403 errors in Gotenberg logs indicated IAM issues, not connectivity issues

### DNS Resolution in VPC
- **Private DNS zones**: Required for internal load balancer IPs to be reachable from VPC
- **Multiple IPs**: Need to track which forwarding rules actually exist vs. documentation assumptions
- **DNS propagation**: Changes take effect immediately within VPC

### VPC Egress Settings Impact
- **egress=all**: Routes ALL traffic through VPC, breaking Google API access
- **egress=private-ranges-only**: Allows internal VPC traffic + direct internet for Google APIs
- **Firebase Auth dependency**: Backend authentication fails without Google API access

## Troubleshooting Commands That Saved Us

### Check Actual Infrastructure
```bash
# List actual forwarding rules (don't assume from docs)
gcloud compute forwarding-rules list --filter="name~gotenberg"

# Check NEG connection to Cloud Run
gcloud compute network-endpoint-groups describe gotenberg-neg --region us-central1

# Verify DNS records
gcloud dns record-sets list --zone=internal-zone --filter="name:gotenberg"
```

### Debug Traffic Flow
```bash
# Backend logs with PDF generation errors
gcloud run services logs read healthcare-forms-backend-go --region us-central1 --limit=20

# Gotenberg logs for 403s (indicates IAM issues)
gcloud run services logs read gotenberg --region us-central1 --limit=10

# Check IAM policies
gcloud run services get-iam-policy gotenberg --region us-central1
```

### Test Connectivity
```bash
# Direct Cloud Run access (bypass load balancer)
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://gotenberg-ubaop6yg4q-uc.a.run.app/health

# Check ingress settings
gcloud run services describe gotenberg --region us-central1 \
  --format="value(spec.template.metadata.annotations)"
```

## Final Architecture Diagram

```
Frontend (form.easydocforms.com)
    ↓ HTTPS
Backend (healthcare-forms-backend-go)
    ↓ HTTP via VPC connector
DNS: gotenberg-http.internal (10.0.0.100)
    ↓ 
Internal Load Balancer (gotenberg-ilb)
    ↓ HTTP via Serverless NEG
Gotenberg Service (Cloud Run)
    ↓ PDF Generation
Return PDF to Frontend
```

## Cost & Performance Notes

- **Load balancer cost**: ~$18/month for regional internal ALB
- **VPC connector cost**: ~$9/month for 2-10 instances  
- **DNS zone cost**: ~$0.20/month for internal zone
- **Total additional cost**: ~$27/month for this infrastructure

- **Performance**: ~2-3 second PDF generation time
- **Reliability**: No more timeouts or DNS failures
- **Security**: Internal-only traffic, no direct internet access to Gotenberg

## Success Metrics

✅ **DNS Resolution**: `gotenberg-http.internal` resolves correctly  
✅ **Load Balancer Routing**: Traffic reaches Gotenberg service  
✅ **IAM Authorization**: Load balancer can invoke Gotenberg  
✅ **PDF Generation**: End-to-end functionality working  
✅ **Error Handling**: Clean 500 errors instead of timeouts on failures  
✅ **Monitoring**: Clear logs for debugging future issues  

## Next Steps for Maintenance

1. **Monitor NEG health**: Even though size=0 is normal, watch for service availability
2. **DNS TTL**: Consider lowering TTL if frequent IP changes needed  
3. **Load balancer scaling**: Monitor if single region sufficient for growth
4. **Security review**: Consider restricting `allUsers` to specific service account if possible
5. **Documentation**: Update CLAUDE.md with this working configuration

---

**Time to resolution**: 1 week  
**Key insight**: IAM permissions for load balancer access was the final missing piece  
**Most helpful debugging**: Gotenberg service logs showing 403 errors instead of timeouts