# PDF Generation Fix - Certificate/DNS Configuration Issue

## Current Status: PDF Generation Broken (500 Error)

### What's Broken:
The PDF generation service is timing out with "context deadline exceeded" errors when the backend tries to connect to Gotenberg via the internal load balancer at `https://10.128.0.4`.

## Root Cause Analysis

### The Certificate Mismatch Problem:
1. **SSL Certificate SANs (Subject Alternative Names)**:
   - DNS: `gotenberg.internal`
   - IP: `10.0.0.100` (WRONG - outside our subnet range!)

2. **Actual Load Balancer IP**: `10.128.0.4` (in subnet `10.128.0.0/20`)

3. **Backend Configuration**: Currently trying to connect to `https://10.128.0.4`

4. **Why It Fails**: TLS handshake fails because the certificate doesn't include `10.128.0.4` in its SANs

## What Happened During Investigation

### Actions Taken:
1. **DELETED**: The forwarding rule `gotenberg-ilb-https` was deleted while attempting Option A
2. **DISCOVERED**: IP `10.0.0.100` cannot be used - it's outside the VPC subnet range (`10.128.0.0/20`)
3. **CONFIRMED**: The certificate was generated with the wrong IP during initial setup

### Current Infrastructure State:
- ✅ Backend service: `healthcare-forms-backend-go` (running, has CA cert)
- ✅ Gotenberg service: Running with ingress="all"
- ✅ Backend service configuration: Protocol=HTTPS, Port=80 (needs fixing to 443)
- ✅ NEG: `gotenberg-neg` pointing to Gotenberg Cloud Run
- ✅ URL Map: `gotenberg-url-map` configured
- ✅ Target HTTPS Proxy: `gotenberg-https-proxy` with certificate
- ❌ **MISSING**: Forwarding rule (was deleted)

## THE FIX: Option C - DNS Resolution

### Step 1: Restore the Forwarding Rule
```bash
gcloud compute forwarding-rules create gotenberg-ilb-https \
  --region us-central1 \
  --load-balancing-scheme INTERNAL_MANAGED \
  --network default \
  --subnet default \
  --address 10.128.0.4 \
  --target-https-proxy gotenberg-https-proxy \
  --target-https-proxy-region us-central1 \
  --ports 443
```

### Step 2: Create Private DNS Zone
```bash
gcloud dns managed-zones create internal-zone \
  --description="Internal DNS for services" \
  --dns-name="internal." \
  --networks="default" \
  --visibility="private"
```

### Step 3: Add DNS A Record
```bash
gcloud dns record-sets create gotenberg.internal \
  --zone="internal-zone" \
  --type="A" \
  --ttl="300" \
  --rrdatas="10.128.0.4"
```

### Step 4: Update Backend Environment Variable
```bash
gcloud run services update healthcare-forms-backend-go \
  --region us-central1 \
  --update-env-vars "GOTENBERG_URL=https://gotenberg.internal"
```

### Step 5: Fix Backend Service Port (Optional but recommended)
```bash
gcloud compute backend-services update gotenberg-backend \
  --region us-central1 \
  --port 443 \
  --port-name https
```

## Why This Solution Works

1. **Certificate Validation**: The certificate has `DNS:gotenberg.internal` in its SANs, so connecting to `https://gotenberg.internal` will pass TLS validation
2. **DNS Resolution**: Cloud DNS will resolve `gotenberg.internal` → `10.128.0.4`
3. **Proper Networking**: Uses the valid IP `10.128.0.4` within the subnet range
4. **Future Flexibility**: If the IP needs to change, only update the DNS record

## Testing After Fix

1. Check backend logs for successful startup:
```bash
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 20 | grep "secure HTTP client"
```

2. Test PDF generation from the frontend
3. Monitor for successful requests:
```bash
gcloud run services logs read healthcare-forms-backend-go \
  --region us-central1 --limit 20 | grep PDF_GENERATION
```

## Important Context Files

- `/PSC.md` - Full infrastructure setup documentation
- `/request.csr` - The certificate signing request showing the wrong IP
- `/backend-go/ca.pem` - The CA certificate the backend trusts
- `/backend-go/internal/services/gotenberg_service.go` - Go client configuration

## Summary for Next Session

**Problem**: Certificate has wrong IP (`10.0.0.100`) which is outside subnet range. Load balancer at `10.128.0.4` causes TLS mismatch.

**Solution**: Use DNS name `gotenberg.internal` (which IS in the certificate) and create DNS record pointing to the correct IP.

**Status**: Forwarding rule deleted, needs restoration and DNS setup per steps above.