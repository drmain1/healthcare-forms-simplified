# Redis Instance Information

## Current Production Instance (HIPAA Compliant)

**Instance Name:** `healthcare-forms-redis-hipaa`
**Created:** 2025-08-24T01:55:34
**Status:** READY ✅

### Connection Details
- **Host:** `10.35.139.228`
- **Port:** `6378` (non-standard port)
- **Password:** `8df0d1f3-e164-46df-b112-ff558446aa73`
- **Region:** `us-central1`
- **Network:** `default`
- **Reserved IP Range:** `10.35.139.224/29`

### HIPAA Compliance Features ✅
- **Tier:** `STANDARD_HA` (High Availability)
- **Encryption:** `SERVER_AUTHENTICATION` (TLS enabled)
- **Authentication:** Enabled with auto-generated password
- **Redis Version:** `7.2` (latest)
- **Size:** `1GB`
- **Monthly Cost:** ~$46.72

### Environment Variables for Backend
```bash
# Production (Cloud Run - same VPC as Redis)
REDIS_ADDR=10.35.139.228:6378
REDIS_PASSWORD=8df0d1f3-e164-46df-b112-ff558446aa73
REDIS_TLS_ENABLED=true

# Local Development (requires local Redis or leave blank to disable)
# Option 1: Skip Redis for local dev
# REDIS_ADDR= (leave blank)

# Option 2: Local Redis instance
# REDIS_ADDR=localhost:6379
# REDIS_PASSWORD=your_local_password
```

### GCP Commands for Management
```bash
# List instances
gcloud redis instances list --region=us-central1 --project=healthcare-forms-v2

# Describe instance
gcloud redis instances describe healthcare-forms-redis-hipaa --region=us-central1

# Get auth string
gcloud redis instances get-auth-string healthcare-forms-redis-hipaa --region=us-central1

# Delete instance (if needed)
gcloud redis instances delete healthcare-forms-redis-hipaa --region=us-central1 --quiet
```

### Connection Test Commands
```bash
# Test with redis-cli (requires TLS support)
redis-cli -h 10.35.139.228 -p 6378 -a 8df0d1f3-e164-46df-b112-ff558446aa73 --tls ping

# Test without TLS (should fail - good security test)
redis-cli -h 10.35.139.228 -p 6378 -a 8df0d1f3-e164-46df-b112-ff558446aa73 ping
```

---

## Previous Instance (DELETED)
**Instance Name:** `healthcare-forms-cache` 
**Status:** ❌ DELETED (Non-HIPAA compliant)
**Issues:** Basic tier, no encryption, no authentication

---

## Phase 1 Implementation Notes
- [ ] Update Go dependencies to redis/go-redis/v9
- [ ] Create Redis client singleton in `internal/data/redis.go`
- [ ] Update health check endpoint
- [ ] Test connection and authentication
- [ ] Deploy with secure environment variables

## Security Notes
⚠️ **IMPORTANT:**
- Password should be stored in GCP Secret Manager for production
- Never commit passwords to git
- Use TLS-enabled clients only
- Monitor connection pool metrics via /health endpoint