# Redis Configuration Guide

## Overview
This healthcare forms platform uses Redis for secure nonce management to prevent replay attacks and ensure form submission integrity. Redis provides atomic operations for nonce validation and consumption.

## Production Configuration

### GCP Memorystore Redis
- **Instance IP**: `10.153.171.243:6379`
- **Region**: us-central1
- **Network**: Default VPC
- **Service Account**: `go-backend-sa@healthcare-forms-v2.iam.gserviceaccount.com`

### Cloud Run Environment Variables
```bash
REDIS_ADDR=10.153.171.243:6379
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

## Additional Resources

- [GCP Memorystore Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Redis Commands Reference](https://redis.io/commands)
- [go-redis Client Documentation](https://redis.uptrace.dev/)
- [Cloud Run VPC Configuration](https://cloud.google.com/run/docs/configuring/connecting-vpc)