#!/bin/bash

# Set environment variables for local development
export GCP_PROJECT_ID='healthcare-forms-v2'
export GOTENBERG_URL='https://gotenberg-ubaop6yg4q-uc.a.run.app'

echo "Starting Healthcare Forms Backend..."
echo "GCP_PROJECT_ID: $GCP_PROJECT_ID"
echo "GOTENBERG_URL: $GOTENBERG_URL"
echo "Logs will be saved to server.log"
echo ""

# Run the server and save logs
go run cmd/server/main.go 2>&1 | tee server.log