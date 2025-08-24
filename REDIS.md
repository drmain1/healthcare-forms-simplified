# Redis Configuration Guide

## Overview
This HIPAA-compliant healthcare forms platform uses Redis as the core security and session infrastructure, providing:

1. **Session Management**: Secure user sessions with metadata and audit trails
2. **CSRF Protection**: Anti-CSRF tokens with automatic expiration
3. **Nonce Management**: Replay attack prevention for public form submissions
4. **Audit Logging**: Distributed session tracking for compliance

Redis ensures atomic operations, proper TTLs, and high-performance caching for maximum security.

## Production Configuration

### GCP Memorystore Redis
- **Instance IP**: `10.35.139.228:6378` (TLS-enabled)
- **Region**: us-central1
- **Network**: Default VPC with TLS encryption
- **Service Account**: `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`
- **Configuration**: 6+ connections, TLS-secured

### Cloud Run Environment Variables
```bash
REDIS_ADDR=10.35.139.228:6378
```

### Current Production Status (Verified)
```json
{
  "redis": {
    "status": "connected",
    "idle_connections": 6,
    "stale_connections": 0,
    "total_connections": 6
  },
  "status": "healthy"
}
```

## Local Development Setup

### Option 1: Docker (Recommended)
```bash
# Start Redis container
docker run -d --name redis-local -p 6379:6379 redis:latest

# Verify Redis is running
docker exec redis-local redis-cli ping
# Should return: PONG

# Stop Redis when done
docker stop redis-local

# Remove container
docker rm redis-local
```

### Option 2: Homebrew (macOS)
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Or run in foreground
redis-server

# Test connection
redis-cli ping
```

### Local Backend Configuration
```bash
# Navigate to backend directory
cd backend-go

# Run with local Redis
unset GOOGLE_APPLICATION_CREDENTIALS && \
GCP_PROJECT_ID='healthcare-forms-v2' \
REDIS_ADDR='localhost:6379' \
GOTENBERG_URL='http://localhost:3005' \
go run ./cmd/server/main.go
```

## Redis Usage in Application

### Nonce Management System
The application uses Redis for secure nonce (number used once) management:

1. **Nonce Generation** (`GenerateNonce`)
   - Creates unique UUID-based nonce
   - Stores in Redis with 30-minute TTL
   - Key format: `nonce:{uuid}`

2. **Nonce Validation** (`ValidateAndConsumeNonce`)
   - Atomically retrieves and deletes nonce using GETDEL
   - Prevents replay attacks
   - Returns true only if nonce existed and was consumed

3. **Proof of Work Validation**
   - Requires SHA256 hash starting with "00"
   - Combines nonce + proof for validation

### Code Location
- **Service**: `backend-go/internal/services/nonce_service.go`
- **Middleware**: `backend-go/internal/api/public_form_middleware.go`
- **Forms API**: `backend-go/internal/api/forms.go`

## Deployment Commands

### Deploy Backend with Redis
```bash
# Deploy to Cloud Run with Redis configuration
gcloud run deploy healthcare-forms-backend-go \
  --source . \
  --region us-central1 \
  --set-env-vars "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app,REDIS_ADDR=10.153.171.243:6379" \
  --project healthcare-forms-v2
```

### Verify Deployment
```bash
# Check service status
gcloud run services describe healthcare-forms-backend-go \
  --region us-central1 \
  --project healthcare-forms-v2 \
  --format="yaml(spec.template.spec.containers[0].env)" | grep REDIS_ADDR

# Test health endpoint
curl https://healthcare-forms-backend-go-ubaop6yg4q-uc.a.run.app/health

# Check logs for Redis issues
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 \
  --project healthcare-forms-v2 \
  --limit 50 | grep -i redis
```

## Monitoring & Debugging

### Redis Connection Testing
```bash
# Test Redis connectivity (local)
redis-cli ping

# Test specific Redis instance
redis-cli -h localhost -p 6379 ping

# For Docker Redis
docker exec redis-local redis-cli ping
```

### Common Issues & Solutions

#### Issue: "REDIS_ADDR environment variable not set"
**Solution**: Ensure REDIS_ADDR is set in environment variables
```bash
export REDIS_ADDR='localhost:6379'  # Local
# or
REDIS_ADDR='localhost:6379' go run ./cmd/server/main.go
```

#### Issue: "dial tcp: connect: connection refused"
**Solutions**:
1. Check Redis is running: `docker ps | grep redis`
2. Verify port is correct: `netstat -an | grep 6379`
3. For GCP, ensure Cloud Run service account has network access

#### Issue: "Operation timed out" when connecting to GCP Redis
**Solutions**:
1. Verify VPC connector is configured for Cloud Run
2. Check firewall rules allow connection from Cloud Run
3. Ensure Redis instance is in same region as Cloud Run

### Debug Commands
```bash
# View all Redis keys (local)
redis-cli keys '*'

# Monitor Redis commands in real-time
redis-cli monitor

# Check Redis memory usage
redis-cli info memory

# View specific nonce (if exists)
redis-cli get "nonce:your-nonce-id"

# Check TTL of a nonce
redis-cli ttl "nonce:your-nonce-id"
```

## Security Considerations

### Nonce System Benefits
- **Replay Attack Prevention**: Each nonce can only be used once
- **Time-Limited**: 30-minute TTL prevents long-term storage
- **Atomic Operations**: GETDEL ensures race-condition-free validation
- **Proof of Work**: Additional computational requirement deters abuse

### Best Practices
1. Never expose Redis directly to internet
2. Use VPC/private networking for production Redis
3. Enable Redis AUTH if available
4. Monitor for unusual nonce generation patterns
5. Regularly review Redis memory usage

## Performance Optimization

### Redis Configuration Tips
- **Max Memory Policy**: Set to `allkeys-lru` for automatic cleanup
- **Connection Pooling**: Go client handles this automatically
- **Persistence**: Not required for nonces (ephemeral data)

### Monitoring Metrics
- Connection count
- Memory usage
- Operation latency
- Evicted keys count
- TTL expiration rate

## Testing Redis Integration

### Unit Tests
```go
// Example test for nonce service
func TestNonceValidation(t *testing.T) {
    // Setup Redis client
    // Generate nonce
    // Validate nonce
    // Ensure second validation fails
}
```

### Integration Tests
```bash
# Run Go tests including Redis integration
cd backend-go
go test ./internal/services -v

# Test with race detection
go test -race ./internal/services
```

## Troubleshooting Checklist

- [ ] Redis service is running (local or GCP)
- [ ] REDIS_ADDR environment variable is set correctly
- [ ] Network connectivity to Redis instance
- [ ] No firewall blocking Redis port (6379)
- [ ] Cloud Run service account has proper permissions (GCP)
- [ ] VPC connector configured (if using private IP in GCP)
- [ ] Redis memory not full
- [ ] No Redis connection limit reached

## Troubleshooting Guide

### Common CSRF Token Issues

#### Issue: 403 Forbidden on CRUD Operations
**Symptoms:**
- User can login successfully
- GET requests work fine
- POST/PUT/DELETE requests return 403 Forbidden
- Error message: "CSRF token not provided in header" or "Invalid or expired CSRF token"

**Root Cause - Duplicate Token Fetch Issue (Resolved Aug 24, 2024):**
The frontend was making two separate calls for CSRF tokens:
1. `authService.sessionLogin()` - Returns valid CSRF token stored in Redis
2. `fetchCSRFToken()` - Fetches a NEW random token (not stored in Redis)

The second call overwrote the valid token with an invalid one.

**Solution:**
Remove the duplicate `fetchCSRFToken()` call in `FirebaseAuthContext.tsx`:
```javascript
// WRONG - Don't do this:
await authService.sessionLogin(authUser.idToken);
await fetchCSRFToken(); // This overwrites the valid token!

// CORRECT - Just use sessionLogin:
await authService.sessionLogin(authUser.idToken);
// The CSRF token is already stored by sessionLogin
```

**Diagnostic Script:**
```javascript
// Run in browser console to diagnose CSRF issues
(async()=>{
  const t=sessionStorage.getItem('csrfToken');
  console.log('Token:',t?`Present (${t.substring(0,8)}...)`:'Missing');
  const r=await fetch('/api/forms',{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json','X-CSRF-Token':t||''},
    body:JSON.stringify({
      title:'Test-'+Date.now(),
      description:'Test',
      category:'Test',
      organization_id:'test',
      json_schema:JSON.stringify({title:'T',pages:[{name:'p1',elements:[{type:'text',name:'t',title:'T'}]}]})
    })
  });
  console.log('Status:',r.status,r.status===201?'✅ WORKING':'❌ FAILED');
})();
```

### Quick Fixes

#### Clear Session and Re-login:
```javascript
// Clear everything and start fresh
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

#### Manual Token Refresh (Emergency):
If backend migration logic is enabled, force a new token generation by:
1. Clear the CSRF token: `sessionStorage.removeItem('csrfToken')`
2. Make any POST request - backend will generate a new token
3. Check response headers for `X-CSRF-Token-Generated`

### Monitoring CSRF Health

Check Redis for CSRF tokens:
```bash
# Connect to Redis
redis-cli -h <redis-host>

# List all CSRF tokens for a user
KEYS csrf:USER_ID:*

# Check token TTL
TTL csrf:USER_ID:TOKEN

# Count total CSRF tokens
KEYS csrf:* | wc -l
```

Backend logs to monitor:
- `AUDIT: Generated CSRF token for user`
- `SECURITY: CSRF validation failed`
- `MIGRATION: Generating CSRF token for existing authenticated user`

## Additional Resources

- [GCP Memorystore Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Redis Commands Reference](https://redis.io/commands)
- [go-redis Client Documentation](https://redis.uptrace.dev/)
- [Cloud Run VPC Configuration](https://cloud.google.com/run/docs/configuring/connecting-vpc)