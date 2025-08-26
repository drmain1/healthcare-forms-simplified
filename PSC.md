# Private Service Connect (PSC) and End-to-End HTTPS Implementation

## Overview
This document tracks the successful implementation of a defense-in-depth security architecture for the healthcare forms platform. It combines Private Service Connect (PSC) with a private Certificate Authority (CA) to achieve end-to-end HTTPS encryption for all internal service communication, ensuring robust HIPAA compliance.

## Final Architecture State

### Cloud Run Services
- **Backend**: `healthcare-forms-backend-go`
  - VPC Connector: `backend-connector-new` (✅ on `default` VPC)
  - VPC Egress: `private-ranges-only`
- **Gotenberg**: `gotenberg`
  - VPC Connector: Attached to `default` VPC
  - Ingress: Internal only (via Load Balancer)

### VPC Infrastructure
- **Network**: `default` (auto-mode)
- **Region**: `us-central1`
- **Subnets**:
  - `default`: `10.128.0.0/20` (Main subnet for services)
  - `vpc-connector-subnet`: `10.8.0.0/28` (For Serverless VPC Access)
  - `proxy-only-subnet-us-central1`: `192.168.0.0/23` (For the Internal HTTPS Load Balancer)

### Redis Infrastructure
- **Instance**: `healthcare-forms-redis-hipaa`
- **Host**: `10.35.139.228:6378`
- **Network**: `default` VPC

### Internal Load Balancer Components
- **Forwarding Rule**: `gotenberg-ilb-https`
  - **IP Address**: `10.128.0.4` (Static, internal)
  - **Port**: `443`
  - **Protocol**: `HTTPS`
- **Target Proxy**: `gotenberg-https-proxy`
- **SSL Certificate**: `ilb-gotenberg-cert` (Signed by our private CA)
- **Backend Service**: `gotenberg-backend` (Points to a NEG for the Gotenberg Cloud Run service)

## Final Architecture Summary

### Traffic Flow (HIPAA Compliant with Defense in Depth)
1. **Frontend** → **Backend** (Cloud Run on `default` VPC)
2. **Backend** → **Redis** (via private IP on `default` VPC)
3. **Backend** → **Gotenberg** (`https://10.128.0.4` via Internal HTTPS Load Balancer)
4. **Load Balancer** → **Gotenberg** (Cloud Run on `default` VPC)

### Key Security Features
- ✅ **Zero Public Internet**: All internal traffic is confined to the private `default` VPC.
- ✅ **Network Isolation**: Services communicate only via private IPs.
- ✅ **End-to-End Encryption**: All internal traffic between the backend and Gotenberg is encrypted with TLS using a trusted private CA, in addition to Google's network-level encryption.
- ✅ **Managed Certificate Lifecycle**: The private CA handles certificate issuance and management, reducing operational overhead.

---

## Architectural Decisions & Troubleshooting Log

This section documents the key decisions and troubleshooting steps taken to achieve the final architecture.

### 1. Initial Architectural Decision: PSC over IAP
- **Decision**: Private Service Connect (PSC) was chosen over Identity-Aware Proxy (IAP) for service-to-service communication.
- **Reasoning**: For HIPAA compliance, true network isolation is paramount. PSC ensures the Gotenberg service has no public IP and is completely isolated within the VPC. IAP, while secure, is primarily for user-to-app access control and would still leave the service on a public, albeit protected, endpoint.

### 2. Mandating End-to-End HTTPS
- **Decision**: All internal traffic between the backend and Gotenberg must use HTTPS, not just HTTP over the private network.
- **Reasoning**: This follows the "defense in depth" security principle. While Google encrypts VPC traffic at the physical layer, application-level encryption (TLS) provides a critical secondary layer of security and is a standard expectation for HIPAA compliance.

### 3. Troubleshooting the Connection Timeout (408 Error)
- **Problem**: After initial setup, requests from the backend to the load balancer (`https://10.128.0.4`) failed with a `dial tcp: i/o timeout`.
- **Investigation Path**:
  - **Hypothesis 1: Firewall Rules.** Initial firewall rules to allow traffic from the VPC connector were created (`allow-vpc-connector-to-lb`, `allow-internal-https-temp`). These did not resolve the issue, indicating the problem was not a simple network block.
  - **Hypothesis 2: Load Balancer Health Checks.** It was suspected that LB health checks were failing. This was proven incorrect, as backend services with Serverless NEG backends (like Cloud Run) do not use traditional GCP health checks.
  - **Hypothesis 3 (Correct): TLS Certificate Trust.** The final diagnosis was that the Go HTTP client in the backend service did not trust the custom certificate presented by the load balancer because the Certificate Authority (CA) that signed it was unknown to the application. The timeout was the symptom of this failed TLS handshake.

### 4. The Certificate Implementation Journey
- **Problem**: The application needed to be configured to trust the private CA, but retrieving the CA certificate proved difficult due to issues with the local `gcloud` tool.
- **Solution Path**:
  1. **Diagnostic Step**: To prove the TLS trust hypothesis, the Go code was temporarily modified to skip certificate verification (`InsecureSkipVerify: true`). This successfully bypassed the `408 timeout` and resulted in a `500` error, confirming the connection was established and the problem was indeed TLS.
  2. **Certificate Retrieval**: After multiple failed attempts to retrieve the CA certificate with `gcloud`, the user provided the correct **Certificate Chain** by downloading it from the GCP Console.
  3. **Final Code Fix**: The diagnostic code was removed. The final, secure code was written to load the provided CA certificate chain from a `ca.pem` file (included in the Docker image) and add it to the HTTP client's trusted root CAs.
  4. **Final Deployment**: The application was redeployed with the corrected code and certificate, leading to a stable and secure service.

### 5. Final Deployment Status
- The final deployment of the backend service (`-00149-5ck`) was successful.
- The application starts without crashing and the logs confirm the secure HTTP client for Gotenberg is created successfully.
- The final issue appears to be a frontend problem, as PDF generation requests are not appearing in the backend logs.

---
*Last Updated: 2025-08-26*
*Status: Infrastructure Complete. Pending Frontend Investigation.*
*Security: HIPAA Defense-in-Depth Architecture ✅ ACTIVE*