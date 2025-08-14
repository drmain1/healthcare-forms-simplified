#!/bin/bash

# Set environment variables for local development
export GCP_PROJECT_ID='healthcare-forms-v2'
export GOTENBERG_URL='http://localhost:3005'

echo "Starting Healthcare Forms Backend..."
echo "GCP_PROJECT_ID: $GCP_PROJECT_ID"
echo "GOTENBERG_URL: $GOTENBERG_URL"
echo ""

# Run the server
go run cmd/server/main.go